import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '#/components/layout/app-shell'
import { VaultWorkspace } from '#/components/vault/vault-workspace'

export const Route = createFileRoute('/_authenticated/vault/$familyId')({
  component: VaultPage,
})

function VaultPage() {
  const { familyId } = Route.useParams()
  return (
    <AppShell familyId={familyId}>
      <VaultWorkspace scope="FAMILY" familyId={familyId} />
    </AppShell>
  )
}
