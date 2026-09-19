import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { PiggyBankIcon } from 'lucide-react'
import { AppShell } from '#/components/layout/app-shell'
import { BentoCard, BentoGrid } from '#/components/bento/bento'
import { LedgerTable } from '#/components/savings/ledger-table'
import { GlobalSavingsCard } from '#/components/savings/global-savings-card'
import { ListPagination } from '#/components/ui/list-pagination'
import { usePersonalSavingsLedger } from '#/hooks/api/use-savings'
import type { SavingsLedgerEntry } from '#/lib/api'

const LEDGER_PAGE_SIZE = 20

export const Route = createFileRoute('/_authenticated/personal/savings')({
  component: PersonalSavingsPage,
})

function PersonalSavingsPage() {
  const [ledgerPage, setLedgerPage] = useState(1)
  const { data: ledger } = usePersonalSavingsLedger(ledgerPage, LEDGER_PAGE_SIZE, true)
  const items = (ledger?.items ?? []) as SavingsLedgerEntry[]
  const ledgerTotal = ledger?.total ?? 0
  const rawPages =
    ledger?.totalPages ??
    (ledger as { total_pages?: number } | undefined)?.total_pages ??
    Math.ceil(ledgerTotal / LEDGER_PAGE_SIZE)
  const ledgerTotalPages = Math.max(1, rawPages || 1)

  return (
    <AppShell>
      <div className="mb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-mint-400 mb-1">Personal</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-slate-100">
            Savings & Ledger
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Personal pool · origin set at setup · no manual adjust
          </p>
        </div>
      </div>

      <BentoGrid className="mb-6">
        <BentoCard colSpan={2}>
          <GlobalSavingsCard />
        </BentoCard>
      </BentoGrid>

      <div className="rounded-2xl border border-navy-800 bg-navy-900/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <PiggyBankIcon className="size-4 text-mint-400" />
          <h2 className="text-lg font-semibold text-slate-100">Activity Ledger</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Chronological IN/OUT movements for your personal pool.
        </p>
        <LedgerTable items={items} />
        <ListPagination
          page={ledgerPage}
          totalPages={ledgerTotalPages}
          total={ledgerTotal}
          pageSize={LEDGER_PAGE_SIZE}
          onPageChange={setLedgerPage}
        />
      </div>
    </AppShell>
  )
}
