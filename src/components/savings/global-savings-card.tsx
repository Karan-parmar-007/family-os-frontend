import { useGlobalSavings } from '#/hooks/api/familyos/use-savings'
import { formatCurrency } from '#/lib/format'
import { PiggyBankIcon } from 'lucide-react'

export function GlobalSavingsCard() {
  const { data, isLoading } = useGlobalSavings()

  if (isLoading) {
    return <p className="text-sm text-slate-400">Loading personal savings…</p>
  }

  if (!data) {
    return (
      <p className="text-sm text-slate-400">
        Personal savings are not available.
      </p>
    )
  }

  const format = (value: number) => formatCurrency(value)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-mint-500/10 text-mint-400">
          <PiggyBankIcon className="size-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-100">Personal Savings Pool</h3>
          <p className="text-xs text-slate-400 font-mono">
            Opening: {format(Number(data.originAmount))}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-navy-800 bg-navy-950/60 p-4">
        <p className="text-xs text-slate-400 mb-1">Current Balance</p>
        <p className="text-2xl font-bold font-mono text-mint-400">
          {format(Number(data.totalSavings))}
        </p>
        <p className="text-[11px] text-slate-500 mt-2">
          Balance updates automatically via income, expenses, and accepted transfers. Manual adjustments are disabled.
        </p>
      </div>
    </div>
  )
}
