import { createFileRoute, Link } from '@tanstack/react-router'
import { CronRunButton } from '#/components/common/cron-run-button'
import { AppShell } from '#/components/layout/app-shell'
import { Button } from '#/components/ui/button'
import { upcomingApi } from '#/lib/api/endpoints/upcoming'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '#/lib/format'

export const Route = createFileRoute('/_authenticated/personal/upcoming')({
  component: PersonalUpcomingPage,
})

function PersonalUpcomingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['personal', 'upcoming', 90],
    queryFn: () => upcomingApi.listPersonal(90),
    staleTime: 60_000,
  })

  return (
    <AppShell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="kicker mb-1">Personal</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Upcoming</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recurring money and transfer offers in your timezone.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CronRunButton />
          <Button asChild variant="outline" size="sm">
            <Link to="/personal/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <ul className="space-y-2">
        {(data?.items ?? []).map((item) => (
          <li
            key={`${item.sourceId}-${item.date}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.type} · {new Date(item.date).toLocaleString()}
              </p>
            </div>
            <span className="shrink-0 font-semibold">
              {formatCurrency(Number(item.amount || 0))}
            </span>
          </li>
        ))}
        {!isLoading && (data?.items ?? []).length === 0 && (
          <li className="text-sm text-muted-foreground">Nothing upcoming.</li>
        )}
      </ul>
    </AppShell>
  )
}
