import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '#/components/layout/app-shell'
import { MoneyWorkspace } from '#/components/money/money-workspace'

export const Route = createFileRoute('/_authenticated/expenses/$familyId')({
  component: ExpensesPage,
})

function ExpensesPage() {
  const { familyId } = Route.useParams()
  return (
    <AppShell familyId={familyId}>
      <MoneyWorkspace kind="EXPENSE" familyId={familyId} />
    </AppShell>
  )
}
