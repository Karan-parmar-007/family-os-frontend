import { createFileRoute, isRedirect, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { PiggyBankIcon } from 'lucide-react'
import { AppShell } from '#/components/layout/app-shell'
import { BentoCard, BentoGrid } from '#/components/bento/bento'
import { LedgerTable } from '#/components/savings/ledger-table'
import { GlobalSavingsCard } from '#/components/savings/global-savings-card'
import { ListPagination } from '#/components/ui/list-pagination'
import { useFamilySavingsLedger } from '#/hooks/api/familyos/use-savings'
import { useFamilies, useFamilyTotalSavings } from '#/hooks/api/familyos/use-families'
import { useScope } from '#/hooks/use-scope'
import { familiesApi, isNetworkError } from '#/lib/api'
import { scopeLabel } from '#/lib/scope'
import { formatCurrency } from '#/lib/format'

interface SavingsSearch {
  scope?: string
}

const LEDGER_PAGE_SIZE = 20

export const Route = createFileRoute('/_authenticated/savings/$familyId')({
  validateSearch: (search: Record<string, unknown>): SavingsSearch => {
    return {
      scope: typeof search.scope === 'string' ? search.scope : undefined,
    }
  },
  beforeLoad: async ({ params }) => {
    if (typeof document === 'undefined') return
    try {
      const { items } = await familiesApi.list()
      const allowed = items.some((f) => f.id === params.familyId)
      if (!allowed) {
        throw redirect({ to: '/families' })
      }
    } catch (error) {
      if (isRedirect(error)) throw error
      const status = error && typeof error === 'object' && 'status' in error ? error.status : null
      if (status === 401 || status === 403) {
        throw redirect({ to: '/' })
      }
      if (isNetworkError(error)) return
      throw error
    }
  },
  component: SavingsPage,
})

function SavingsPage() {
  const { familyId } = Route.useParams()
  const navigate = useNavigate()
  const { data: familiesData, isSuccess } = useFamilies()
  const { scope } = useScope()
  const [ledgerPage, setLedgerPage] = useState(1)

  const { data: familyLedger } = useFamilySavingsLedger(
    familyId,
    ledgerPage,
    LEDGER_PAGE_SIZE,
    scope.kind === 'family',
  )

  const { data: familySavings } = useFamilyTotalSavings(familyId)
  const family = familiesData?.items.find((f) => f.id === familyId)

  useEffect(() => {
    if (familyId) localStorage.setItem('lastFamilyId', familyId)
  }, [familyId])

  useEffect(() => {
    if (!isSuccess || !familiesData) return
    const allowed = familiesData.items.some((f) => f.id === familyId)
    if (!allowed) navigate({ to: '/families' })
  }, [isSuccess, familiesData, familyId, navigate])

  useEffect(() => {
    setLedgerPage(1)
  }, [familyId, scope.kind])

  const familyCurrency = family?.currency || 'USD'
  const format = (value: number, compact?: boolean) =>
    formatCurrency(value, { compact, currency: familyCurrency })

  const ledgerTotal = familyLedger?.total ?? 0
  const rawPages =
    familyLedger?.totalPages ??
    (familyLedger as { total_pages?: number } | undefined)?.total_pages ??
    Math.ceil(ledgerTotal / LEDGER_PAGE_SIZE)
  const ledgerTotalPages = Math.max(1, rawPages || 1)

  return (
    <AppShell familyId={familyId}>
      <div className="mb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-mint-400 mb-1">
            {family?.name ?? 'Your household'}
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-slate-100">
            Savings & Ledger
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {scopeLabel(scope)} savings pool · Source of truth
          </p>
        </div>
      </div>

      {scope.kind === 'personal' && (
        <BentoGrid className="mb-6">
          <BentoCard colSpan={2}>
            <GlobalSavingsCard />
          </BentoCard>
        </BentoGrid>
      )}

      {scope.kind === 'family' && (
        <BentoGrid className="mb-6">
          <BentoCard colSpan={2}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-mint-500/10 text-mint-400">
                  <PiggyBankIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">Family Savings Pool</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Currency: {family?.currency ?? 'USD'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-navy-800 bg-navy-950/60 p-4">
              <p className="text-xs text-slate-400 mb-1">Current Pool Balance</p>
              <p className="text-3xl font-bold font-mono text-mint-400">
                {format(familySavings?.totalSavings ?? 0)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Origin pool is set at household creation. All balance adjustments occur exclusively
                through verified income, expenses, and cross-family transfers.
              </p>
            </div>
          </BentoCard>
        </BentoGrid>
      )}

      <div className="rounded-2xl border border-navy-800 bg-navy-900/60 p-5">
        <h2 className="text-lg font-semibold text-slate-100 mb-1">Activity Ledger</h2>
        <p className="text-xs text-slate-400 mb-4">
          Complete chronological record of all movements credited and debited.
        </p>
        <LedgerTable items={familyLedger?.items ?? []} currency={family?.currency} />
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
