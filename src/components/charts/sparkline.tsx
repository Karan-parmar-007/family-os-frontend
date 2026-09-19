import { useId } from 'react'
import { cn } from '#/lib/utils'

interface SparklineProps {
  data: number[]
  className?: string
  stroke?: string
  height?: number
  fill?: boolean
}

/** Lightweight dependency-free area/line sparkline. */
export function Sparkline({
  data,
  className,
  stroke = 'var(--brand)',
  height = 64,
  fill = true,
}: SparklineProps) {
  const gradientId = useId()
  const width = 100
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1 || 1)) * width
    const y = height - ((value - min) / range) * (height - 8) - 4
    return [x, y] as const
  })

  const line = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ')

  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('h-16 w-full', className)}
      style={{ height }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.32" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradientId})`} />}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
