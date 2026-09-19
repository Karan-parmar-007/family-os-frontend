import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import { cn } from '#/lib/utils'

export function TrendPill({
  value,
  className,
}: {
  /** Percentage change, e.g. 24 or -8. */
  value: number
  className?: string
}) {
  const positive = value >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        positive
          ? 'bg-positive/15 text-positive'
          : 'bg-negative/15 text-negative',
        className,
      )}
    >
      {positive ? (
        <TrendingUpIcon className="size-3.5" />
      ) : (
        <TrendingDownIcon className="size-3.5" />
      )}
      {positive ? '+' : ''}
      {value}%
    </span>
  )
}
