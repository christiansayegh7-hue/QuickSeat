export default function MiniLineChart({ data }) {
  // data: [{ label, value }]
  const width = 600
  const height = 200
  const padding = 24
  const max = Math.max(1, ...data.map((d) => d.value))

  const points = data.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / Math.max(1, data.length - 1)
    const y = height - padding - (d.value / max) * (height - padding * 2)
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1]?.x || 0},${height - padding} L${points[0]?.x || 0},${height - padding} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full">
      <path d={areaPath} fill="var(--color-olive-100)" />
      <path d={linePath} fill="none" stroke="var(--color-olive-700)" strokeWidth="2.5" />
      {points.map((p) => (
        <circle key={p.label} cx={p.x} cy={p.y} r="3.5" fill="var(--color-olive-800)" />
      ))}
      {points.map((p) => (
        <text key={p.label} x={p.x} y={height - 4} textAnchor="middle" fontSize="10" fill="var(--color-olive-500)">
          {p.label}
        </text>
      ))}
    </svg>
  )
}
