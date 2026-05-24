export default function ScoreGauge({ score, label, size = 90 }) {
  const r = (size / 2) * 0.75
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const pct = score != null ? score / 100 : 0
  const dashoffset = circumference * (1 - pct)

  function color(s) {
    if (s == null) return '#5a5a70'
    if (s >= 90) return '#00e5a0'
    if (s >= 50) return '#f5a623'
    return '#ff4d6d'
  }

  function grade(s) {
    if (s == null) return '—'
    if (s >= 90) return 'A'
    if (s >= 80) return 'B'
    if (s >= 70) return 'C'
    if (s >= 50) return 'D'
    return 'F'
  }

  const c = color(score)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#2a2a38"
          strokeWidth={size * 0.08}
        />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={c}
          strokeWidth={size * 0.08}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
        <text
          x={cx} y={cy - size * 0.04}
          textAnchor="middle" dominantBaseline="middle"
          fill={c}
          fontSize={size * 0.26}
          fontWeight="700"
          fontFamily="'IBM Plex Mono', monospace"
        >
          {score != null ? score : '—'}
        </text>
        <text
          x={cx} y={cy + size * 0.2}
          textAnchor="middle" dominantBaseline="middle"
          fill={c}
          fontSize={size * 0.14}
          fontWeight="500"
          fontFamily="'IBM Plex Mono', monospace"
          opacity={0.7}
        >
          {grade(score)}
        </text>
      </svg>
      <span style={{
        fontSize: 11, fontWeight: 500, color: 'var(--text3)',
        letterSpacing: '0.06em', textAlign: 'center', textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  )
}
