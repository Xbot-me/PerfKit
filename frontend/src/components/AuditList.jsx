import { useState } from 'react'

const CAT_COLORS = {
  performance:     '#f5a623',
  accessibility:   '#4d9eff',
  'best-practices':'#a78bfa',
  seo:             '#00e5a0',
}

function getSeverity(score) {
  if (score === null || score === undefined) return { label: 'INFO', color: '#5a5a70', bg: 'rgba(90,90,112,0.12)' }
  if (score <= 0.49) return { label: 'HIGH', color: '#ff4d6d', bg: 'rgba(255,77,109,0.12)' }
  if (score <= 0.89) return { label: 'MED', color: '#f5a623', bg: 'rgba(245,166,35,0.12)' }
  return { label: 'LOW', color: '#4d9eff', bg: 'rgba(77,158,255,0.12)' }
}

function ScoreBar({ score }) {
  const pct = Math.round((score || 0) * 100)
  const color = score >= 0.9 ? 'var(--good)' : score >= 0.5 ? 'var(--warn)' : 'var(--poor)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color, minWidth: 28, textAlign: 'right' }}>{pct}</span>
    </div>
  )
}

function formatBytes(b) {
  if (!b) return null
  if (b < 1024) return b + 'B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + 'KB'
  return (b / 1024 / 1024).toFixed(2) + 'MB'
}

function formatMs(ms) {
  if (!ms) return null
  if (ms < 1000) return Math.round(ms) + 'ms'
  return (ms / 1000).toFixed(2) + 's'
}

export default function AuditList({ audits }) {
  const [catFilter, setCatFilter] = useState('all')
  const [sevFilter, setSevFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  if (!audits || audits.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--good)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        ✓ All audits passed — no issues found
      </div>
    )
  }

  const cats = ['all', ...new Set(audits.map(a => a.category))]
  const sevs = ['all', 'HIGH', 'MED', 'LOW']

  let filtered = audits
  if (catFilter !== 'all') filtered = filtered.filter(a => a.category === catFilter)
  if (sevFilter !== 'all') filtered = filtered.filter(a => getSeverity(a.score).label === sevFilter)

  const counts = { HIGH: 0, MED: 0, LOW: 0 }
  audits.forEach(a => { const s = getSeverity(a.score).label; if (counts[s] !== undefined) counts[s]++ })

  return (
    <div>
      {/* Severity summary bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, padding: '12px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8 }}>
        {[
          { label: 'HIGH', color: '#ff4d6d', bg: 'rgba(255,77,109,0.12)' },
          { label: 'MED',  color: '#f5a623', bg: 'rgba(245,166,35,0.12)' },
          { label: 'LOW',  color: '#4d9eff', bg: 'rgba(77,158,255,0.12)' },
        ].map(s => (
          <div key={s.label} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: s.bg, border: `1px solid ${s.color}44`,
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
            opacity: sevFilter !== 'all' && sevFilter !== s.label ? 0.4 : 1,
          }} onClick={() => setSevFilter(sevFilter === s.label ? 'all' : s.label)}>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--mono)', color: s.color }}>{counts[s.label]}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: '0.06em' }}>{s.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>priority</div>
            </div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)', alignSelf: 'center', fontFamily: 'var(--mono)' }}>
          {filtered.length} of {audits.length} issues
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{
            padding: '4px 12px', borderRadius: 20,
            border: `1px solid ${catFilter === c ? CAT_COLORS[c] || 'var(--accent)' : 'var(--border)'}`,
            background: catFilter === c ? `${CAT_COLORS[c] || 'var(--accent)'}18` : 'transparent',
            color: catFilter === c ? CAT_COLORS[c] || 'var(--accent)' : 'var(--text3)',
            fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
          }}>
            {c === 'best-practices' ? 'Best Practices' : c}
            {c !== 'all' && <span style={{ marginLeft: 5, opacity: 0.7 }}>{audits.filter(a => a.category === c).length}</span>}
          </button>
        ))}
      </div>

      {/* Audit items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((audit, i) => {
          const isOpen = expanded === i
          const catColor = CAT_COLORS[audit.category] || 'var(--text3)'
          const sev = getSeverity(audit.score)
          const savings = audit.details?.overallSavingsMs

          return (
            <div key={audit.id} style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 8, overflow: 'hidden',
              borderLeft: `3px solid ${sev.color}`,
            }}>
              {/* Header */}
              <div onClick={() => setExpanded(isOpen ? null : i)} style={{
                padding: '12px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                {/* Severity badge */}
                <div style={{
                  flexShrink: 0, marginTop: 2,
                  background: sev.bg, border: `1px solid ${sev.color}44`,
                  borderRadius: 4, padding: '2px 7px',
                  fontSize: 10, fontWeight: 700, color: sev.color, letterSpacing: '0.08em',
                  minWidth: 42, textAlign: 'center',
                }}>
                  {sev.label}
                </div>

                {/* Score bar + title */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <div style={{ width: 120, flexShrink: 0 }}>
                      <ScoreBar score={audit.score} />
                    </div>
                    <span style={{
                      fontSize: 10, color: catColor, fontWeight: 600,
                      letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0,
                    }}>
                      {audit.category === 'best-practices' ? 'BEST PRACTICES' : audit.category.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: audit.displayValue ? 3 : 0 }}>
                    {audit.title}
                  </div>
                  {audit.displayValue && (
                    <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--warn)' }}>
                      {audit.displayValue}
                    </div>
                  )}
                </div>

                {/* Savings + expand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {savings > 0 && (
                    <div style={{
                      background: 'var(--warn-bg)', border: '1px solid var(--warn)44',
                      borderRadius: 4, padding: '3px 8px',
                      fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--warn)',
                    }}>
                      −{formatMs(savings)}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--text3)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</div>
                </div>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', background: 'var(--bg2)' }}>
                  {audit.description && (
                    <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 14 }}>
                      {audit.description.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')}
                    </p>
                  )}

                  {/* Learn more link */}
                  {audit.description && audit.description.match(/\[([^\]]+)\]\(([^)]+)\)/) && (() => {
                    const match = audit.description.match(/\[([^\]]+)\]\(([^)]+)\)/)
                    return (
                      <a href={match[2]} target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--mono)',
                        marginBottom: 14, textDecoration: 'none',
                      }}>
                        Learn how to fix this ↗
                      </a>
                    )
                  })()}

                  {/* Affected resources */}
                  {audit.details?.items?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Affected Resources
                      </div>
                      {audit.details.headings?.length > 0 && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: `1fr ${audit.details.headings.slice(1).map(() => 'auto').join(' ')}`,
                          gap: 8, padding: '6px 12px',
                          fontSize: 10, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          {audit.details.headings.map((h, hi) => <span key={hi} style={{ textAlign: hi > 0 ? 'right' : 'left' }}>{h}</span>)}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                        {audit.details.items.slice(0, 8).map((item, j) => (
                          <div key={j} style={{
                            background: 'var(--bg4)', borderRadius: 4,
                            padding: '7px 12px', display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', gap: 12,
                          }}>
                            <span style={{
                              fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)',
                              flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }} title={item.url}>
                              {item.url ? item.url.split('/').pop() || item.url : JSON.stringify(item).slice(0, 60)}
                            </span>
                            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                              {item.wastedMs > 0 && <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--warn)' }}>−{formatMs(item.wastedMs)}</span>}
                              {item.wastedBytes > 0 && <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--poor)' }}>−{formatBytes(item.wastedBytes)}</span>}
                              {item.totalBytes > 0 && <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{formatBytes(item.totalBytes)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}