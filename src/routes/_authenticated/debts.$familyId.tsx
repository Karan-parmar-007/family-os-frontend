import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router'
import { AppShell } from '#/components/layout/app-shell'
import { DebtsWorkspace } from '#/components/debt/debts-workspace'
import { useScope } from '#/hooks/use-scope'
import { familiesApi, isNetworkError } from '#/lib/api'

interface Search {
  scope?: string
}

export const Route = createFileRoute('/_authenticated/debts/$familyId')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    scope: typeof search.scope === 'string' ? search.scope : undefined,
  }),
  beforeLoad: async ({ params }) => {
    if (typeof document === 'undefined') return
    try {
      const { items } = await familiesApi.list()
      if (!items.some((f) => f.id === params.familyId)) {
        throw redirect({ to: '/families' })
      }
    } catch (error) {
      if (isRedirect(error)) throw error
      if (!isNetworkError(error)) throw error
    }
  },
  component: DebtsPage,
})

function DebtsPage() {
  const { familyId } = Route.useParams()
  const { scope } = useScope()

  return (
    <AppShell familyId={familyId}>
      <DebtsWorkspace familyId={familyId} scope={scope} />
    </AppShell>
  )
}
