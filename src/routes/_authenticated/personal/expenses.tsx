import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '#/components/layout/app-shell'
import { MoneyWorkspace } from '#/components/money/money-workspace'

export const Route = createFileRoute('/_authenticated/personal/expenses')({
  component: PersonalExpensesPage,
})

function PersonalExpensesPage() {
  return (
    <AppShell>
      <MoneyWorkspace kind="EXPENSE" isPersonal />
    </AppShell>
  )
}
