import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '#/components/layout/app-shell'
import { AdminNav } from '#/components/admin/admin-nav'

export const Route = createFileRoute('/_authenticated/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <AppShell>
      <AdminNav />
      <Outlet />
    </AppShell>
  )
}
