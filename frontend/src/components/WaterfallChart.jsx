import { useMemo, useState } from 'react'

const TYPE_COLORS = {
  document:   '#4d9eff',
  stylesheet: '#a78bfa',
  script:     '#f5a623',
  image:      '#00e5a0',
  font:       '#f472b6',
  xhr:        '#fb7185',
  other:      '#5a5a70',
}

const SEGMENT_COLORS = {
  dns:     '#a78bfa',
  connect: '#f472b6',
  ssl:     '#f5a623',
  send:    '#4d9eff',
  wait:    '#00e5a0',
  receive: '#00b87a',
}

function formatBytes(b) {
  if (!b) return '—'
  if (b < 1024) return b + 'B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + 'KB'
  return (b / 1024 / 1024).toFixed(2) + 'MB'
}

function formatMs(ms) {
  if (ms == null) return '—'
  if (ms < 1000) return Math.round(ms) + 'ms'
  return (ms / 1000).toFixed(2) + 's'
}

function shortUrl(url) {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    const file = parts[parts.length - 1] || u.hostname
    return { host: u.hostname, path: '/' + parts.join('/'), file: file || u.hostname }
  } catch {
    return { host: url, path: url, file: url }
  }
}

export default function WaterfallChart({ entries }) {
  const [filter, setFilter] = useState('all')
  const [tooltip, setTooltip] = useState(null)
  const [expandedIdx, setExpandedIdx] = useState(null)

  const filtered = useMemo(() => {
    if (!entries) return []
    let list = [...entries]
    if (filter !== 'all') list = list.filter(e => e.type === filter)
    return list
  }, [entries, filter])

  const maxTime = useMemo(() => {
    if (!filtered.length) return 1
    return Math.max(...filtered.map(e => (e.startMs || 0) + (e.totalMs || 0)))
  }, [filtered])

  const types = useMemo(() => {
    if (!entries) return []
    return ['all', ...new Set(entries.map(e => e.type))]
  }, [entries])

  if (!entries || entries.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        No network request data available
      </div>
    )
  }

  const ROW_H = 28
  const LABEL_W = 280
  const BAR_AREA = 'calc(100% - 280px - 80px)'

  return (
    <div>
      {/* Filters + legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: '4px 12px', borderRadius: 20,
                border: `1px solid ${filter === t ? TYPE_COLORS[t] || 'var(--accent)' : 'var(--border)'}`,
                background: filter === t ? `${TYPE_COLORS[t] || 'var(--accent)'}18` : 'transparent',
                color: filter === t ? TYPE_COLORS[t] || 'var(--accent)' : 'var(--text3)',
                fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
          {filtered.length} requests · {formatBytes(filtered.reduce((s, e) => s + (e.transferSize || 0), 0))} transferred
        </div>
      </div>

      {/* Segment legend */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
        {Object.entries(SEGMENT_COLORS).map(([seg, col]) => (
          <div key={seg} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: col }} />
            <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{seg}</span>
          </div>
        ))}
      </div>

      {/* Time ruler */}
      <div style={{ display: 'flex', marginBottom: 4, paddingLeft: LABEL_W + 'px' }}>
        {[0, 25, 50, 75, 100].map(pct => (
          <div key={pct} style={{
            flex: pct === 0 ? 'none' : 1,
            width: pct === 0 ? 0 : undefined,
            fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)',
            paddingLeft: pct === 0 ? 0 : 4,
          }}>
            {formatMs(maxTime * pct / 100)}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {filtered.map((entry, i) => {
          const startPct = maxTime > 0 ? (entry.startMs / maxTime) * 100 : 0
          const segs = ['dns', 'connect', 'ssl', 'send', 'wait', 'receive']
          const totalSegMs = segs.reduce((s, k) => s + (entry[k] || 0), 0)
          const isExpanded = expandedIdx === i
          const { file, host } = shortUrl(entry.url)
          const statusOk = entry.status >= 200 && entry.status < 400

          return (
            <div key={i}>
              <div
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
                style={{
                  display: 'flex', alignItems: 'center',
                  borderBottom: '1px solid var(--border)',
                  background: i % 2 === 0 ? 'var(--bg3)' : 'var(--bg2)',
                  cursor: 'pointer',
                  minHeight: ROW_H,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg4)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg3)' : 'var(--bg2)'}
              >
                {/* Type dot + URL */}
                <div style={{
                  width: LABEL_W, minWidth: LABEL_W, padding: '4px 10px',
                  display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: TYPE_COLORS[entry.type] || 'var(--text3)',
                  }} />
                  <span style={{
                    fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }} title={entry.url}>
                    {file}
                  </span>
                </div>

                {/* Bar */}
                <div style={{ flex: 1, position: 'relative', height: ROW_H, display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    position: 'absolute',
                    left: `${startPct}%`,
                    display: 'flex', height: 14, borderRadius: 2, overflow: 'hidden',
                    minWidth: 2,
                  }}>
                    {totalSegMs > 0 ? segs.map(seg => {
                      const w = entry[seg] ? (entry[seg] / totalSegMs) * (entry.totalMs / maxTime) * 100 : 0
                      return w > 0 ? (
                        <div key={seg} style={{
                          width: `${w}%`, minWidth: 1,
                          background: SEGMENT_COLORS[seg],
                          opacity: 0.85,
                        }} title={`${seg}: ${formatMs(entry[seg])}`} />
                      ) : null
                    }) : (
                      <div style={{
                        width: `${Math.max(0.3, (entry.totalMs / maxTime) * 100)}%`,
                        background: TYPE_COLORS[entry.type] || 'var(--text3)',
                        opacity: 0.85,
                      }} />
                    )}
                  </div>
                </div>

                {/* Status + size */}
                <div style={{ width: 80, textAlign: 'right', padding: '0 10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                  <span style={{
                    fontSize: 10, fontFamily: 'var(--mono)',
                    color: statusOk ? 'var(--text3)' : 'var(--poor)',
                  }}>{entry.status}</span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>
                    {formatMs(entry.totalMs)}
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{
                  background: 'var(--bg)',
                  borderBottom: '1px solid var(--border)',
                  padding: '12px 20px',
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4, letterSpacing: '0.06em' }}>URL</div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)', wordBreak: 'break-all' }}>{entry.url}</div>
                  </div>
                  {[
                    ['Type', entry.type],
                    ['Status', entry.status],
                    ['DNS', formatMs(entry.dns)],
                    ['Connect', formatMs(entry.connect)],
                    ['SSL', formatMs(entry.ssl)],
                    ['Wait (TTFB)', formatMs(entry.wait)],
                    ['Receive', formatMs(entry.receive)],
                    ['Total', formatMs(entry.totalMs)],
                    ['Transfer', formatBytes(entry.transferSize)],
                    ['Resource', formatBytes(entry.resourceSize)],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
