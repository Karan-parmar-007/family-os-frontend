import { cn } from '#/lib/utils'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutProps {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  className?: string
  centerLabel?: string
  centerValue?: string
}

/** Dependency-free donut chart using stroke-dasharray. */
export function Donut({
  segments,
  size = 160,
  thickness = 18,
  className,
  centerLabel,
  centerValue,
}: DonutProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={thickness}
          opacity={0.5}
        />
        {segments.map((segment) => {
          const length = (segment.value / total) * circumference
          const circle = (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
            />
          )
          offset += length
          return circle
        })}
      </svg>
      {(centerValue || centerLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue && (
            <span className="text-xl font-bold tracking-tight">
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="text-xs text-muted-foreground">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
