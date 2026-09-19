import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '#/components/layout/app-shell'
import { VaultWorkspace } from '#/components/vault/vault-workspace'

export const Route = createFileRoute('/_authenticated/personal/vault')({
  component: PersonalVaultPage,
})

function PersonalVaultPage() {
  return (
    <AppShell>
      <VaultWorkspace scope="PERSONAL" />
    </AppShell>
  )
}
