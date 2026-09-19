import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '#/components/layout/app-shell'
import { DebtsWorkspace } from '#/components/debt/debts-workspace'

export const Route = createFileRoute('/_authenticated/personal/debts')({
  component: PersonalDebtsPage,
})

function PersonalDebtsPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="kicker mb-1">Personal</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Debts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Remaining-balance tracker. Optional EMI maps to a recurring personal expense.
        </p>
      </div>
      <DebtsWorkspace familyId="" scope={{ kind: 'personal' }} hideTitle />
    </AppShell>
  )
}
