import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function formatBytes(b) {
  if (b == null) return '—'
  if (b < 1024) return b + 'B'
  if (b < 1024*1024) return (b/1024).toFixed(1)+'KB'
  return (b/1024/1024).toFixed(2)+'MB'
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

function scoreColor(s) {
  if (s == null) return 'var(--text3)'
  if (s >= 90) return 'var(--good)'
  if (s >= 50) return 'var(--warn)'
  return 'var(--poor)'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '10px 14px',
      fontFamily: 'var(--mono)', fontSize: 12,
    }}>
      <div style={{ color: 'var(--text3)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

export default function History() {
  const [runs, setRuns] = useState([])
  const [urls, setUrls] = useState([])
  const [selectedUrl, setSelectedUrl] = useState(null)
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      axios.get('/api/history?limit=100'),
      axios.get('/api/urls'),
    ]).then(([runsRes, urlsRes]) => {
      setRuns(runsRes.data)
      setUrls(urlsRes.data)
      if (urlsRes.data.length > 0) setSelectedUrl(urlsRes.data[0].url)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedUrl) return
    axios.get(`/api/trend?url=${encodeURIComponent(selectedUrl)}&limit=30`)
      .then(r => {
        setTrend(r.data.map(row => ({
          ...row,
          date: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          perf: row.score_performance,
          a11y: row.score_accessibility,
          lcp: row.lcp_value ? Math.round(row.lcp_value) : null,
          fcp: row.fcp_value ? Math.round(row.fcp_value) : null,
          tbt: row.tbt_value ? Math.round(row.tbt_value) : null,
        })))
      })
      .catch(() => {})
  }, [selectedUrl])

  async function deleteRun(id, e) {
    e.stopPropagation()
    await axios.delete(`/api/runs/${id}`)
    setRuns(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
      Loading history...
    </div>
  )

  if (runs.length === 0) return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>📭</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No runs yet</div>
      <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24 }}>Analyze a URL to start building your history.</div>
      <button onClick={() => navigate('/')} style={{
        background: 'var(--accent)', color: '#0a0a0f',
        border: 'none', borderRadius: 'var(--radius)',
        padding: '10px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        fontFamily: 'var(--font)',
      }}>
        Analyze a URL
      </button>
    </div>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 28 }}>History</h1>

      {/* URL Trend selector */}
      {urls.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Trend Analysis
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {urls.map(u => (
              <button
                key={u.url}
                onClick={() => setSelectedUrl(u.url)}
                style={{
                  padding: '5px 14px', borderRadius: 20,
                  border: `1px solid ${selectedUrl === u.url ? 'var(--accent)' : 'var(--border)'}`,
                  background: selectedUrl === u.url ? 'var(--accent-dim)' : 'transparent',
                  color: selectedUrl === u.url ? 'var(--accent)' : 'var(--text2)',
                  fontSize: 12, fontFamily: 'var(--mono)', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {u.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                <span style={{ marginLeft: 6, opacity: 0.6 }}>×{u.run_count}</span>
              </button>
            ))}
          </div>

          {trend.length >= 2 && (
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '20px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
            }}>
              {/* Performance scores chart */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Lighthouse Scores
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="perf" stroke="var(--good)" strokeWidth={2} dot={{ r: 3, fill: 'var(--good)' }} name="Performance" />
                    <Line type="monotone" dataKey="a11y" stroke="var(--info)" strokeWidth={2} dot={{ r: 3, fill: 'var(--info)' }} name="Accessibility" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Web Vitals chart */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Vitals (ms)
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="lcp"  stroke="#f5a623" strokeWidth={2} dot={{ r: 3 }} name="LCP" />
                    <Line type="monotone" dataKey="fcp"  stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} name="FCP" />
                    <Line type="monotone" dataKey="tbt"  stroke="#ff4d6d" strokeWidth={2} dot={{ r: 3 }} name="TBT" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {trend.length === 1 && (
            <div style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--mono)', padding: '12px 0' }}>
              Run more analyses on this URL to see trend charts.
            </div>
          )}
        </div>
      )}

      {/* All runs table */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          All Runs ({runs.length})
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 56px 56px 56px 56px 80px 80px 60px',
          gap: 8, padding: '8px 16px',
          fontSize: 11, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase',
          borderBottom: '1px solid var(--border)',
        }}>
          <span>URL</span>
          <span style={{ textAlign: 'center' }}>Perf</span>
          <span style={{ textAlign: 'center' }}>A11y</span>
          <span style={{ textAlign: 'center' }}>SEO</span>
          <span style={{ textAlign: 'center' }}>BP</span>
          <span style={{ textAlign: 'right' }}>Size</span>
          <span style={{ textAlign: 'right' }}>Req</span>
          <span style={{ textAlign: 'right' }}>When</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {runs.map(run => (
            <div
              key={run.id}
              onClick={() => run.status === 'done' && navigate(`/report/${run.id}`)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 56px 56px 56px 56px 80px 80px 60px',
                gap: 8,
                padding: '10px 16px',
                borderBottom: '1px solid var(--border)',
                cursor: run.status === 'done' ? 'pointer' : 'default',
                alignItems: 'center',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => run.status === 'done' && (e.currentTarget.style.background = 'var(--bg3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {run.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </div>
                {run.status !== 'done' && (
                  <div style={{ fontSize: 11, color: run.status === 'error' ? 'var(--poor)' : 'var(--warn)', marginTop: 2 }}>
                    {run.status.toUpperCase()}
                  </div>
                )}
              </div>
              {[run.score_performance, run.score_accessibility, run.score_seo, run.score_best_practices].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 13, fontFamily: 'var(--mono)', fontWeight: 600, color: scoreColor(s) }}>
                    {s ?? '—'}
                  </span>
                </div>
              ))}
              <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>
                {formatBytes(run.total_bytes)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>
                {run.total_requests ?? '—'}
              </div>
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>
                  {timeAgo(run.created_at)}
                </span>
                <button
                  onClick={(e) => deleteRun(run.id, e)}
                  title="Delete run"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text3)', fontSize: 14, padding: '0 2px',
                    opacity: 0.4, lineHeight: 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.4}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
