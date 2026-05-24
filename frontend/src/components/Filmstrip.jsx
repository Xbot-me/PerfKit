export default function Filmstrip({ frames }) {
  if (!frames || frames.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        No filmstrip data available
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
        {frames.map((frame, i) => (
          <div key={i} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              background: 'var(--bg4)',
              width: 120,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {frame.data ? (
                <img
                  src={frame.data}
                  alt={`Frame at ${frame.timing}ms`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>—</div>
              )}
            </div>
            <span style={{
              fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)',
            }}>
              {frame.timing >= 1000
                ? (frame.timing / 1000).toFixed(1) + 's'
                : frame.timing + 'ms'}
            </span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 12,
        height: 4,
        background: 'var(--border)',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {frames.map((frame, i) => {
          const maxT = frames[frames.length - 1]?.timing || 1
          const pct = (frame.timing / maxT) * 100
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `${pct}%`,
              top: 0, bottom: 0,
              width: 2,
              background: 'var(--accent)',
              opacity: 0.4,
              transform: 'translateX(-50%)',
            }} />
          )
        })}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          background: 'linear-gradient(90deg, var(--accent) 0%, transparent 100%)',
          width: '100%',
          opacity: 0.15,
        }} />
      </div>
    </div>
  )
}
