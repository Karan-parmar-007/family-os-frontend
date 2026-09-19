import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarClock, Coins, Home, Users } from 'lucide-react'
import { CronRunButton } from '#/components/common/cron-run-button'
import { useAdminCurrencies, useAdminFamilies, useAdminUsers } from '#/hooks/api/use-admin'

export const Route = createFileRoute('/_authenticated/admin/')({
  component: AdminHomePage,
})

function AdminHomePage() {
  const users = useAdminUsers()
  const families = useAdminFamilies()
  const currencies = useAdminCurrencies()

  const cards = [
    {
      to: '/admin/users' as const,
      label: 'Users',
      hint: 'Profiles, family caps, cascade delete',
      icon: Users,
      count: users.data?.items.length,
    },
    {
      to: '/admin/families' as const,
      label: 'Families',
      hint: 'Households and cascade delete',
      icon: Home,
      count: families.data?.items.length,
    },
    {
      to: '/admin/currencies' as const,
      label: 'Currencies',
      hint: 'Catalog and USD conversion rates',
      icon: Coins,
      count: currencies.data?.items.length,
    },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#233554]/90 bg-[#112240]/90 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-[#64ffda]/20 bg-[#64ffda]/10 p-2 text-[#64ffda]">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-[#e6f1ff]">Scheduled jobs</h2>
            <p className="mt-1 text-sm text-[#8892b0]">
              Recurring money rules and transfer offers apply at 18:00 in each scope timezone.
              The API also ticks on startup and about every minute. Use these to test immediately.
            </p>
            <div className="mt-4">
              <CronRunButton />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(({ to, label, hint, icon: Icon, count }) => (
          <Link
            key={to}
            to={to}
            className="rounded-2xl border border-[#233554]/90 bg-[#112240]/90 p-4 no-underline transition hover:border-[#64ffda]/40"
          >
            <Icon className="h-5 w-5 text-[#64ffda]" />
            <p className="mt-3 text-base font-semibold text-[#e6f1ff]">{label}</p>
            <p className="mt-1 text-xs text-[#8892b0]">{hint}</p>
            <p className="mt-3 font-mono text-sm text-[#64ffda]">
              {typeof count === 'number' ? count : '—'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
