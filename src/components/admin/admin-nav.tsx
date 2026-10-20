import { Link, useRouterState } from '@tanstack/react-router'
import { Coins, LayoutDashboard, Shield, Users, Home } from 'lucide-react'

export function AdminNav() {
  const router = useRouterState()
  const currentPath = router.location.pathname

  const links = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/families', label: 'Families', icon: Home },
    { to: '/admin/currencies', label: 'Currencies', icon: Coins },
  ] as const

  return (
    <div className="mb-8 border-b border-[#172a45] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-mono text-[#64ffda] uppercase tracking-wider mb-1">
          <Shield className="w-3.5 h-3.5" />
          <span>Operator Console</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Admin</h1>
      </div>

      <nav className="grid w-full grid-cols-2 gap-1 rounded-xl border border-[#172a45] bg-[#112240] p-1 text-sm font-medium sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-2">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive =
            to === '/admin' ? currentPath === '/admin' : currentPath === to || currentPath.startsWith(`${to}/`)
          return (
            <Link
              key={to}
              to={to}
              className={`flex min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-2 transition-all no-underline sm:justify-start sm:px-3.5 sm:py-1.5 ${
                isActive
                  ? 'bg-[#64ffda] text-[#0a192f] font-semibold shadow-sm'
                  : 'text-[#8892b0] hover:text-white hover:bg-[#172a45]/50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
