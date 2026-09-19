import type { SavingsLedgerEntry } from '#/lib/api'
import { formatCurrency } from '#/lib/format'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function directionSign(direction: string, amount: number) {
  const signed = direction === 'OUT' ? -amount : amount
  return signed
}

export function LedgerTable({
  items,
  currency,
  emptyMessage = 'No ledger entries yet.',
}: {
  items: SavingsLedgerEntry[]
  currency?: string
  emptyMessage?: string
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  const format = (value: number) => formatCurrency(value, currency ? { currency } : {})

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[32rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-background/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Date</th>
            <th className="px-4 py-2.5 font-medium">Source</th>
            <th className="px-4 py-2.5 font-medium">Description</th>
            <th className="px-4 py-2.5 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((entry) => {
            const signed = directionSign(entry.direction, Number(entry.amount))
            return (
              <tr
                key={entry.id}
                className="border-b border-border/60 last:border-0"
              >
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {formatDate(entry.occurredAt)}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">
                    {entry.sourceType.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {entry.description ?? '—'}
                </td>
                <td
                  className={`px-4 py-3 text-right font-semibold tabular-nums ${
                    signed >= 0 ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {format(signed)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
