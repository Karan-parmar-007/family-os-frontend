import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '#/components/layout/app-shell'
import { MoneyWorkspace } from '#/components/money/money-workspace'

export const Route = createFileRoute('/_authenticated/income/$familyId')({
  component: IncomePage,
})

function IncomePage() {
  const { familyId } = Route.useParams()
  return (
    <AppShell familyId={familyId}>
      <MoneyWorkspace kind="INCOME" familyId={familyId} />
    </AppShell>
  )
}
