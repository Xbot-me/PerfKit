const VITALS = [
  { key: 'lcp',   label: 'LCP',   full: 'Largest Contentful Paint', unit: 'ms',  desc: 'Time until the largest visible element loads. Good: < 2.5s' },
  { key: 'fcp',   label: 'FCP',   full: 'First Contentful Paint',   unit: 'ms',  desc: 'Time until first content appears. Good: < 1.8s' },
  { key: 'tbt',   label: 'TBT',   full: 'Total Blocking Time',      unit: 'ms',  desc: 'Sum of blocking time. Good: < 200ms' },
  { key: 'cls',   label: 'CLS',   full: 'Cumulative Layout Shift',  unit: '',    desc: 'Visual stability score. Good: < 0.1' },
  { key: 'ttfb',  label: 'TTFB',  full: 'Time to First Byte',       unit: 'ms',  desc: 'Server response time. Good: < 800ms' },
  { key: 'speed_index', label: 'SI', full: 'Speed Index',           unit: 'ms',  desc: 'How quickly content is visually displayed. Good: < 3.4s' },
]

function formatVal(val, unit, key) {
  if (val == null) return '—'
  if (key === 'cls') return val.toFixed(3)
  if (unit === 'ms') {
    if (val >= 1000) return (val / 1000).toFixed(2) + 's'
    return Math.round(val) + 'ms'
  }
  return val
}

export default function WebVitals({ run }) {
  function getColor(rating) {
    if (rating === 'good') return 'var(--good)'
    if (rating === 'needs-improvement') return 'var(--warn)'
    if (rating === 'poor') return 'var(--poor)'
    return 'var(--text3)'
  }

  function getBg(rating) {
    if (rating === 'good') return 'var(--good-bg)'
    if (rating === 'needs-improvement') return 'var(--warn-bg)'
    if (rating === 'poor') return 'var(--poor-bg)'
    return 'var(--bg4)'
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: 10,
    }}>
      {VITALS.map(v => {
        const val = run[`${v.key}_value`]
        const rating = run[`${v.key}_rating`]
        const color = getColor(rating)
        const bg = getBg(rating)
        return (
          <div
            key={v.key}
            title={v.desc}
            style={{
              background: bg,
              border: `1px solid ${color}33`,
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                color: 'var(--text3)', textTransform: 'uppercase',
              }}>
                {v.label}
              </span>
              {rating && rating !== 'unknown' && (
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                  color, textTransform: 'uppercase',
                }}>
                  {rating === 'needs-improvement' ? 'IMPROVE' : rating.toUpperCase()}
                </span>
              )}
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)',
              color, marginBottom: 4,
            }}>
              {formatVal(val, v.unit, v.key)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>
              {v.full}
            </div>
          </div>
        )
      })}
    </div>
  )
}
