import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const QUICK_URLS = [
  'https://github.com',
  'https://vercel.com',
  'https://tailwindcss.com',
  'https://react.dev',
]

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recent, setRecent] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/history?limit=6').then(r => setRecent(r.data)).catch(() => {})
  }, [])

  async function handleAnalyze(e) {
    e.preventDefault()
    if (!url.trim()) return
    setError(''); setLoading(true)
    try {
      const { data } = await axios.post('/api/analyze', { url: url.trim() })
      navigate(`/report/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start analysis')
      setLoading(false)
    }
  }

  function scoreColor(s) {
    if (s == null) return 'var(--text3)'
    if (s >= 90) return 'var(--good)'
    if (s >= 50) return 'var(--warn)'
    return 'var(--poor)'
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '64px 24px 48px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--accent-dim2)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '4px 14px', marginBottom: 24,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--mono)', letterSpacing: '0.05em' }}>
            LOCAL · PRIVATE · NO LIMITS
          </span>
        </div>
        <h1 style={{
          fontSize: 52, fontWeight: 800, letterSpacing: '-0.04em',
          lineHeight: 1.05, marginBottom: 16,
          background: 'linear-gradient(135deg, var(--text) 0%, var(--text2) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Performance Analysis<br/>On Your Machine
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 520, margin: '0 auto' }}>
          Lighthouse scores, Core Web Vitals, waterfall charts, screenshots and full history — all stored locally.
        </p>
      </div>

      {/* URL Form */}
      <form onSubmit={handleAnalyze} style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex', gap: 10,
          background: 'var(--bg3)',
          border: `1px solid ${error ? 'var(--poor)' : 'var(--border)'}`,
          borderRadius: 10,
          padding: 6,
          transition: 'border-color 0.15s',
        }}>
          <input
            value={url}
            onChange={e => { setUrl(e.target.value); setError('') }}
            placeholder="https://yoursite.com"
            autoFocus
            disabled={loading}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: 15, padding: '8px 12px',
              fontFamily: 'var(--mono)',
            }}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            style={{
              background: loading || !url.trim() ? 'var(--border)' : 'var(--accent)',
              color: loading || !url.trim() ? 'var(--text3)' : '#0a0a0f',
              border: 'none', borderRadius: 6,
              padding: '8px 22px', fontWeight: 700,
              fontSize: 13, letterSpacing: '0.05em',
              transition: 'all 0.15s', cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'QUEUED...' : 'ANALYZE →'}
          </button>
        </div>
        {error && (
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--poor)', fontFamily: 'var(--mono)' }}>
            ⚠ {error}
          </p>
        )}
      </form>

      {/* Quick URLs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 56 }}>
        <span style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center', marginRight: 4 }}>Try:</span>
        {QUICK_URLS.map(u => (
          <button key={u} onClick={() => setUrl(u)} style={{
            background: 'var(--bg4)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)' }}
          >
            {u.replace('https://', '')}
          </button>
        ))}
      </div>

      {/* Feature grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12, marginBottom: 48,
      }}>
        {[
          { icon: '⚡', label: 'Lighthouse Scores', sub: 'Performance, A11y, SEO, Best Practices' },
          { icon: '📊', label: 'Core Web Vitals', sub: 'LCP, CLS, FCP, TTFB, TBT with thresholds' },
          { icon: '🌊', label: 'Waterfall Chart', sub: 'Every request with timing breakdown' },
          { icon: '🎞️', label: 'Filmstrip', sub: 'Page load progression screenshots' },
          { icon: '📸', label: 'Full Screenshot', sub: 'Final page render capture' },
          { icon: '📈', label: 'Trend History', sub: 'Track scores over time per URL' },
        ].map(f => (
          <div key={f.label} style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px',
          }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{f.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent runs */}
      {recent.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.08em', marginBottom: 14 }}>
            RECENT RUNS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map(run => (
              <div
                key={run.id}
                onClick={() => run.status === 'done' && navigate(`/report/${run.id}`)}
                style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  cursor: run.status === 'done' ? 'pointer' : 'default',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => run.status === 'done' && (e.currentTarget.style.borderColor = 'var(--border2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)',
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {run.url.replace(/^https?:\/\//, '')}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {run.status === 'done' ? (
                    <>
                      {[run.score_performance, run.score_accessibility, run.score_seo].map((s, i) => (
                        <div key={i} style={{
                          width: 36, height: 36, borderRadius: '50%',
                          border: `2px solid ${scoreColor(s)}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: scoreColor(s), fontFamily: 'var(--mono)',
                        }}>
                          {s ?? '—'}
                        </div>
                      ))}
                    </>
                  ) : run.status === 'error' ? (
                    <span style={{ fontSize: 12, color: 'var(--poor)', fontFamily: 'var(--mono)' }}>ERROR</span>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--warn)', fontFamily: 'var(--mono)' }}>PENDING</span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', minWidth: 60, textAlign: 'right' }}>
                    {timeAgo(run.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
