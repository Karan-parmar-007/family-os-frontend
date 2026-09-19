import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '#/components/layout/app-shell'
import { MoneyWorkspace } from '#/components/money/money-workspace'

export const Route = createFileRoute('/_authenticated/personal/income')({
  component: PersonalIncomePage,
})

function PersonalIncomePage() {
  return (
    <AppShell>
      <MoneyWorkspace kind="INCOME" isPersonal />
    </AppShell>
  )
}
