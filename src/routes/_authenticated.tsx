import { useEffect } from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireAuth } from '#/lib/auth/guards'
import { useCurrentUser } from '#/hooks/api/familyos/use-current-user'
import { setDisplayCurrency } from '#/lib/format'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: requireAuth,
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { data: user } = useCurrentUser()

  useEffect(() => {
    setDisplayCurrency(user?.preferred_currency)
  }, [user?.preferred_currency])

  return <Outlet />
}
