import {
  createFileRoute,
  isRedirect,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import {
  CalendarDaysIcon,
  CheckIcon,
  ChevronLeftIcon,
  FileTextIcon,
  PieChartIcon,
  PiggyBankIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react'
import { AppShell } from '#/components/layout/app-shell'
import { BentoCard, BentoCardHeader, BentoGrid } from '#/components/bento/bento'
import { Donut } from '#/components/charts/donut'
import { Sparkline } from '#/components/charts/sparkline'
import { TrendPill } from '#/components/ui-bits/trend-pill'
import { Progress } from '#/components/ui/progress'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Tabs, TabsContent } from '#/components/ui/tabs'
import { useCurrentUser } from '#/hooks/api/use-current-user'
import {
  useFamilies,
  useFamilyTotalSavings,
} from '#/hooks/api/use-families'
import { useGlobalSavings } from '#/hooks/api/use-savings'
import { useMoneyEvents, useMoneyRules, useSimpleDebts } from '#/hooks/api/use-money'
import { useUpcoming } from '#/hooks/api/use-upcoming'
import { useScope } from '#/hooks/use-scope'
import { familiesApi, isNetworkError } from '#/lib/api'
import { scopeToViewMode } from '#/lib/scope'
import { formatCurrency } from '#/lib/format'

interface DashboardSearch {
  scope?: string
}

export const Route = createFileRoute('/_authenticated/dashboard/$familyId')({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => {
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
  component: DashboardPage,
})

function DashboardPage() {
  const { familyId } = Route.useParams()
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const { data: familiesData, isSuccess } = useFamilies()
  const { scope } = useScope()
  const viewMode = scopeToViewMode(scope)

  // Savings queries (cached, no re-fetch on nav)
  const { data: familySavings } = useFamilyTotalSavings(familyId)
  const { data: personalSavings } = useGlobalSavings(viewMode === 'personal')
  const moneyScope = viewMode === 'personal' ? 'PERSONAL' : 'FAMILY'
  const { data: recurringIncomes } = useMoneyRules(
    moneyScope,
    viewMode === 'family' ? familyId : undefined,
    'INCOME',
  )
  const { data: expenseEvents } = useMoneyEvents(
    moneyScope,
    viewMode === 'family' ? familyId : undefined,
    'EXPENSE',
  )
  const { data: debtsData } = useSimpleDebts(
    moneyScope,
    viewMode === 'family' ? familyId : undefined,
  )
  const { data: upcomingData } = useUpcoming(familyId, scope, 30)

  const family = familiesData?.items.find((f) => f.id === familyId)

  useEffect(() => {
    if (familyId) {
      localStorage.setItem('lastFamilyId', familyId)
    }
  }, [familyId])

  useEffect(() => {
    if (!isSuccess || !familiesData) return
    const allowed = familiesData.items.some((f) => f.id === familyId)
    if (!allowed) navigate({ to: '/families' })
  }, [isSuccess, familiesData, familyId, navigate])

  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const recurringItems = recurringIncomes?.items ?? []
  const totalRecurring = recurringItems.reduce((acc, i) => acc + (i.amount ?? 0), 0)
  const openDebts = (debtsData?.items ?? []).filter((d) => d.status !== 'SETTLED')
  const totalDebt = openDebts.reduce((sum, d) => sum + Number(d.remainingAmount || 0), 0)
  const expensesSpent = expenseEvents?.items.reduce((sum, e) => sum + (e.amount ?? 0), 0) ?? 0
  const expensesBudget = Math.max(expensesSpent, (totalRecurring || 0) * 0.8 || 1)
  const spentPct = Math.round((expensesSpent / expensesBudget) * 100)
  const debtRows = openDebts.slice(0, 4).map((d) => ({
    label: d.name,
    current: Number(d.amountPaid || 0),
    target: Number(d.amount || 0),
  }))
  const upcomingRows = (upcomingData?.items ?? []).slice(0, 4).map((item) => ({
    label: item.name,
    when: new Date(item.date).toLocaleDateString(),
  }))
  const expenseBreakdown = (() => {
    const map = new Map<string, number>()
    for (const log of expenseEvents?.items ?? []) {
      const key = log.name || 'Other'
      map.set(key, (map.get(key) ?? 0) + Number(log.amount || 0))
    }
    const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, value], idx) => ({ label, value, color: palette[idx % palette.length] }))
  })()

  const format = (value: number, compact?: boolean) => {
    return formatCurrency(value, { compact })
  }

  return (
    <AppShell familyId={familyId}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/families"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground no-underline hover:text-brand"
          >
            <ChevronLeftIcon className="size-3.5" />
            All families
          </Link>
          <p className="kicker mb-1">{family?.name ?? 'Your household'}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s how your family is doing this month.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/savings/$familyId" params={{ familyId }}>Savings</Link>
          </Button>
          <Button asChild>
            <Link to="/income/$familyId" params={{ familyId }}>
              <TrendingUpIcon className="size-4 mr-1.5" />
              Income
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} className="w-full">
        <TabsContent value="family" className="space-y-6">
          <BentoGrid>
            <BentoCard colSpan={2} rowSpan={2} className="justify-between">
              <BentoCardHeader
                icon={<WalletIcon />}
                title="Net Worth"
                subtitle="Across all family accounts"
                accent="positive"
                action={<TrendPill value={0} />}
              />
              <div>
                <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {format((familySavings?.totalSavings ?? 0) - totalDebt)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Updated a few minutes ago
                </p>
              </div>
              <Sparkline data={[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]} height={96} className="my-4" />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-background/30 p-3">
                  <p className="text-xs text-muted-foreground">Savings</p>
                  <p className="text-lg font-semibold text-positive">
                    {familySavings?.totalSavings != null
                      ? format(familySavings.totalSavings, true)
                      : <Link to="/savings/$familyId" params={{ familyId }} className="text-sm text-brand">Set savings →</Link>}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/30 p-3">
                  <p className="text-xs text-muted-foreground">Debt</p>
                  <p className="text-lg font-semibold text-negative">
                    {format(totalDebt, true)}
                  </p>
                </div>
              </div>
            </BentoCard>

            <BentoCard colSpan={2} rowSpan={2}>
              <BentoCardHeader
                icon={<PieChartIcon />}
                title="Monthly Expenses"
                subtitle={`${spentPct}% of budget used`}
                accent="negative"
              />
              <div className="flex flex-1 flex-col items-center gap-5 sm:flex-row sm:justify-around">
                <Donut
                  segments={expenseBreakdown}
                  centerValue={format(expensesSpent, true)}
                  centerLabel={`of ${format(expensesBudget, true)}`}
                />
                <ul className="w-full max-w-48 space-y-2">
                  {expenseBreakdown.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: item.color }}
                        />
                        {item.label}
                      </span>
                      <span className="font-medium">
                        {format(item.value, true)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </BentoCard>

            <BentoCard colSpan={2}>
              <BentoCardHeader
                icon={<TrendingUpIcon />}
                title="Recurring Income"
                subtitle={`${recurringItems.length} source${recurringItems.length === 1 ? '' : 's'} for this family`}
                accent="info"
              />
              <div className="space-y-3">
                {recurringItems.slice(0, 4).map((income) => (
                  <div key={income.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <span className="block truncate text-muted-foreground">{income.name}</span>
                      <span className="text-xs text-muted-foreground/80">
                        {income.frequency.toLowerCase()}
                      </span>
                    </div>
                    <span className="shrink-0 font-semibold text-positive">+{format(income.amount, true)}</span>
                  </div>
                ))}
                {recurringItems.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No recurring incomes yet.{' '}
                    <Link to="/income/$familyId" params={{ familyId }} className="text-brand">Add one →</Link>
                  </p>
                )}
                {totalRecurring > 0 && (
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                    <span className="text-sm font-medium">Total per cycle</span>
                    <span className="font-bold text-positive">+{format(totalRecurring, true)}</span>
                  </div>
                )}
              </div>
            </BentoCard>

            <BentoCard>
              <BentoCardHeader
                icon={<ShieldCheckIcon />}
                title="Tax Checklist"
                accent="warning"
              />
              <ul className="space-y-2.5">
                {[{ label: 'Log all recurring income', done: recurringItems.length > 0 },
                  { label: 'Record monthly expenses', done: (expenseEvents?.items.length ?? 0) > 0 },
                  { label: 'Review upcoming items', done: (upcomingData?.items.length ?? 0) > 0 },
                  { label: 'Track debt repayments', done: openDebts.length > 0 }].map((task) => (
                  <li
                    key={task.label}
                    className="flex items-center gap-2.5 text-sm"
                  >
                    <span
                      className={
                        task.done
                          ? 'flex size-5 items-center justify-center rounded-md bg-positive/20 text-positive'
                          : 'size-5 rounded-md border border-border'
                      }
                    >
                      {task.done && <CheckIcon className="size-3.5" />}
                    </span>
                    <span
                      className={
                        task.done ? 'text-muted-foreground line-through' : ''
                      }
                    >
                      {task.label}
                    </span>
                  </li>
                ))}
              </ul>
              <Button variant="secondary" size="sm" className="mt-4 w-full" asChild>
                <Link to="/upcoming/$familyId" params={{ familyId }}>Open upcoming</Link>
              </Button>
            </BentoCard>

            <BentoCard>
              <BentoCardHeader
                icon={<CalendarDaysIcon />}
                title="Upcoming"
                accent="violet"
              />
              <ul className="space-y-3">
                {upcomingRows.map((event) => (
                  <li key={event.label} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-violet" />
                    <div>
                      <p className="font-medium leading-tight">{event.label}</p>
                      <p className="text-xs text-muted-foreground">{event.when}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </BentoCard>

            <BentoCard colSpan={2}>
              <BentoCardHeader
                icon={<FileTextIcon />}
                title="Open debts"
                accent="brand"
                action={
                  <Badge variant="secondary" className="font-normal">
                    Live
                  </Badge>
                }
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {debtRows.map((goal) => (
                  <div
                    key={goal.label}
                    className="glass-hover flex items-center gap-3 rounded-xl border border-border bg-background/30 p-3"
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-brand/15 text-brand">
                      <FileTextIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{goal.label}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {format(goal.current, true)} / {format(goal.target, true)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </BentoCard>
          </BentoGrid>
        </TabsContent>

        <TabsContent value="personal" className="space-y-6">
          <BentoGrid>
            <BentoCard colSpan={2} rowSpan={2} className="justify-between">
              <BentoCardHeader
                icon={<WalletIcon />}
                title="Net Worth"
                subtitle="Your personal accounts"
                accent="positive"
                action={<TrendPill value={0} />}
              />
              <div>
                <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {format((personalSavings?.totalSavings ?? 0) - totalDebt)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Updated a few minutes ago
                </p>
              </div>
              <Sparkline data={[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]} height={96} className="my-4" />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-background/30 p-3">
                  <p className="text-xs text-muted-foreground">Savings</p>
                  <p className="text-lg font-semibold text-positive">
                    {format(personalSavings?.totalSavings ?? 0, true)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/30 p-3">
                  <p className="text-xs text-muted-foreground">Debt</p>
                  <p className="text-lg font-semibold text-negative">
                    {format(totalDebt, true)}
                  </p>
                </div>
              </div>
            </BentoCard>

            <BentoCard colSpan={2} rowSpan={2}>
              <BentoCardHeader
                icon={<PieChartIcon />}
                title="Monthly Expenses"
                subtitle="Personal budget"
                accent="negative"
              />
              <div className="flex flex-1 flex-col items-center gap-5 sm:flex-row sm:justify-around">
                <Donut
                  segments={expenseBreakdown}
                  centerValue={format(expensesSpent, true)}
                  centerLabel={`of ${format(expensesBudget, true)}`}
                />
                <ul className="w-full max-w-48 space-y-2">
                  {expenseBreakdown.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: item.color }}
                        />
                        {item.label}
                      </span>
                      <span className="font-medium">
                        {format(item.value, true)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </BentoCard>

            <BentoCard colSpan={2}>
              <BentoCardHeader
                icon={<PiggyBankIcon />}
                title="Open debts"
                accent="info"
              />
              <div className="space-y-4">
                {debtRows.map((goal) => {
                  const pct = Math.round((goal.current / goal.target) * 100)
                  return (
                    <div key={goal.label}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium">{goal.label}</span>
                        <span className="text-muted-foreground">
                          {format(goal.current, true)} /{' '}
                          {format(goal.target, true)}
                        </span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  )
                })}
              </div>
            </BentoCard>

            <BentoCard colSpan={2}>
              <BentoCardHeader
                icon={<FileTextIcon />}
                title="Upcoming (Personal)"
                accent="brand"
                action={
                  <Badge variant="secondary" className="font-normal">
                    Live
                  </Badge>
                }
              />
              <ul className="space-y-3">
                {upcomingRows.map((event) => (
                  <li key={event.label} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-brand" />
                    <div>
                      <p className="font-medium leading-tight">{event.label}</p>
                      <p className="text-xs text-muted-foreground">{event.when}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </BentoCard>
          </BentoGrid>
        </TabsContent>
      </Tabs>

      {/* Soft savings reminder banner (non-blocking) */}
      {familySavings?.totalSavings === null && (
        <div className="mt-6 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Set your family total savings to unlock accurate net worth tracking.
          </p>
          <Button size="sm" asChild>
            <Link to="/savings/$familyId" params={{ familyId }}>Go to Savings</Link>
          </Button>
        </div>
      )}
    </AppShell>
  )
}

