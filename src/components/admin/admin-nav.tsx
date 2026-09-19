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

      <nav className="flex flex-wrap items-center gap-2 p-1 bg-[#112240] border border-[#172a45] rounded-xl text-sm font-medium">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive =
            to === '/admin' ? currentPath === '/admin' : currentPath === to || currentPath.startsWith(`${to}/`)
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all no-underline ${
                isActive
                  ? 'bg-[#64ffda] text-[#0a192f] font-semibold shadow-sm'
                  : 'text-[#8892b0] hover:text-white hover:bg-[#172a45]/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
