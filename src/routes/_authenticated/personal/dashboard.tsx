import { createFileRoute, Link } from '@tanstack/react-router'
import { AppShell } from '#/components/layout/app-shell'
import { BentoCard, BentoGrid } from '#/components/bento/bento'
import { Button } from '#/components/ui/button'
import { useCurrentUser } from '#/hooks/api/familyos/use-current-user'
import { useGlobalSavings } from '#/hooks/api/familyos/use-savings'
import { useMoneyRules, useSimpleDebts } from '#/hooks/api/familyos/use-money'
import { upcomingApi } from '#/lib/api/familyos/endpoints/upcoming'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '#/lib/format'

export const Route = createFileRoute('/_authenticated/personal/dashboard')({
  component: PersonalDashboardPage,
})

function PersonalDashboardPage() {
  const { data: user } = useCurrentUser()
  const { data: savings } = useGlobalSavings()
  const { data: incomes } = useMoneyRules('PERSONAL', undefined, 'INCOME')
  const { data: debts } = useSimpleDebts('PERSONAL', undefined)
  const { data: upcoming } = useQuery({
    queryKey: ['personal', 'upcoming', 30],
    queryFn: () => upcomingApi.listPersonal(30),
    staleTime: 60_000,
  })
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const remainingDebt = (debts?.items ?? [])
    .filter((d) => d.status !== 'SETTLED')
    .reduce((sum, d) => sum + Number(d.remainingAmount || 0), 0)

  return (
    <AppShell>
      <p className="kicker mb-1">Personal</p>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Welcome back, {firstName}
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Your personal pool, upcoming payments, and family shortcuts. No family required.
      </p>
      <BentoGrid>
        <BentoCard colSpan={2}>
          <p className="text-xs text-muted-foreground">Personal savings</p>
          <p className="mt-1 text-3xl font-semibold">
            {formatCurrency(Number(savings?.totalSavings ?? 0))}
          </p>
          <Button asChild className="mt-4" size="sm" variant="outline">
            <Link to="/personal/savings">Open ledger</Link>
          </Button>
        </BentoCard>
        <BentoCard>
          <p className="text-xs text-muted-foreground">Open personal debt</p>
          <p className="mt-1 text-2xl font-semibold text-negative">
            {formatCurrency(remainingDebt)}
          </p>
          <Button asChild className="mt-4" size="sm" variant="outline">
            <Link to="/personal/debts">Manage debts</Link>
          </Button>
        </BentoCard>
        <BentoCard>
          <p className="text-xs text-muted-foreground">Recurring income</p>
          <p className="mt-1 text-2xl font-semibold">
            {incomes?.items.length ?? 0}
          </p>
          <Button asChild className="mt-4" size="sm" variant="outline">
            <Link to="/personal/income">Add income</Link>
          </Button>
        </BentoCard>
        <BentoCard colSpan={2}>
          <p className="text-xs text-muted-foreground mb-2">Upcoming</p>
          <ul className="space-y-2 text-sm">
            {(upcoming?.items ?? []).slice(0, 5).map((item) => (
              <li key={`${item.sourceId}-${item.date}`} className="flex justify-between gap-3">
                <span className="truncate">{item.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </li>
            ))}
            {(upcoming?.items ?? []).length === 0 && (
              <li className="text-muted-foreground">Nothing due in the next 30 days.</li>
            )}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/personal/upcoming">All upcoming</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/families">Families</Link>
            </Button>
          </div>
        </BentoCard>
      </BentoGrid>
    </AppShell>
  )
}
