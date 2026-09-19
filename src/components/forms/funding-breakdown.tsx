/**
 * FundingBreakdown — displays which pools funded a specific job/payment.
 *
 * Shows a visual breakdown with pool type badges, amounts, and family/personal labels.
 */

import type { FundingBreakdownEntry } from '#/lib/api/familyos/endpoints/funding'

const POOL_COLORS: Record<string, string> = {
  CURRENT_FAMILY:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  PERSONAL:
    'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  OTHER_FAMILY:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  EXTERNAL:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
}

const POOL_LABELS: Record<string, string> = {
  CURRENT_FAMILY: 'Family',
  PERSONAL: 'Personal',
  OTHER_FAMILY: 'Other family',
  EXTERNAL: 'External',
}

type FundingBreakdownProps = {
  entries: FundingBreakdownEntry[]
  /** Optional family name map for labelling OTHER_FAMILY entries */
  familyNames?: Record<string, string>
  className?: string
}

export function FundingBreakdown({
  entries,
  familyNames = {},
  className = '',
}: FundingBreakdownProps) {
  if (!entries || entries.length === 0) return null

  const total = entries.reduce(
    (acc, e) => acc + parseFloat(e.amount || '0'),
    0,
  )

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Funded by
      </p>
      <div className="space-y-1.5">
        {entries.map((entry) => {
          const poolLabel =
            entry.poolType === 'OTHER_FAMILY' && entry.familyId
              ? (familyNames[entry.familyId] ?? 'Other family')
              : POOL_LABELS[entry.poolType] ?? entry.poolType
          const colorClass =
            POOL_COLORS[entry.poolType] ?? 'bg-muted text-muted-foreground'
          const pct =
            total > 0
              ? ((parseFloat(entry.amount) / total) * 100).toFixed(1)
              : '0'

          return (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
                >
                  {poolLabel}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div
                  className="h-1.5 rounded-full bg-current opacity-20"
                  style={{ width: `${Math.max(4, parseFloat(pct))}px` }}
                />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {pct}%
                </span>
                <span className="font-medium tabular-nums">
                  {parseFloat(entry.amount).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total row */}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-1.5 text-sm font-semibold">
        <span className="text-muted-foreground">Total</span>
        <span className="tabular-nums">
          {total.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  )
}
