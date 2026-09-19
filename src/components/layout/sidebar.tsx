import { Link, useLocation } from '@tanstack/react-router'
import { ShieldIcon } from 'lucide-react'
import { Logo } from '#/components/brand/logo'
import { cn } from '#/lib/utils'
import { familyNavSections, personalNavSections } from './nav-config'
import type { NavItem } from './nav-config'
import { useAppWorkspace } from '#/hooks/use-app-workspace'
import { useCurrentUser } from '#/hooks/api/familyos/use-current-user'
import { setStoredWorkspace } from '#/lib/app-context'

function NavLink({
  item,
  familyId,
  onNavigate,
}: {
  item: NavItem
  familyId?: string
  onNavigate?: () => void
}) {
  const Icon = item.icon
  const location = useLocation()
  const to = item.getTo(familyId)

  const pathMatches =
    location.pathname === to ||
    location.pathname.startsWith(to + '/') ||
    (item.activePathPrefix
      ? location.pathname === item.activePathPrefix ||
        location.pathname.startsWith(item.activePathPrefix + '/')
      : false)

  const params = new URLSearchParams(location.searchStr || location.search as unknown as string)
  // TanStack may expose search as object
  const scopeFromObj =
    typeof location.search === 'object' && location.search && 'scope' in location.search
      ? String((location.search as { scope?: string }).scope ?? '')
      : ''
  const scopeParam =
    params.get('scope') ||
    scopeFromObj ||
    (params.get('view') === 'personal' ? 'personal' : '') ||
    (location.pathname.startsWith('/personal') ? 'personal' : 'family')

  const itemScope = item.activeScope ?? item.search?.scope
  const isActive =
    pathMatches &&
    (itemScope === undefined ||
      scopeParam === itemScope ||
      (itemScope === 'personal' && location.pathname.startsWith('/personal')))

  const baseClass =
    'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground no-underline transition hover:bg-accent hover:text-foreground'
  const activeClass = cn(
    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold no-underline',
    'bg-brand/15 text-foreground shadow-[inset_0_1px_0_var(--glass-highlight)]',
  )

  const searchStr = item.search
    ? '?' + new URLSearchParams(item.search).toString()
    : ''

  return (
    <a
      href={`${to}${searchStr}`}
      onClick={(e) => {
        e.preventDefault()
        onNavigate?.()
        window.history.pushState({}, '', `${to}${searchStr}`)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }}
      className={isActive ? activeClass : baseClass}
    >
      <Icon className="size-[1.15rem]" />
      {item.label}
    </a>
  )
}

function WorkspaceSwitcher({
  workspace,
  onChange,
}: {
  workspace: 'family' | 'personal'
  onChange: (w: 'family' | 'personal') => void
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/30 p-1">
      {(['family', 'personal'] as const).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            'rounded-lg px-2 py-1.5 text-xs font-semibold capitalize transition',
            workspace === key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {key}
        </button>
      ))}
    </div>
  )
}

export function SidebarContent({
  familyId: propsFamilyId,
  onNavigate,
}: {
  familyId?: string
  onNavigate?: () => void
}) {
  const { workspace, setWorkspace } = useAppWorkspace()
  const { data: user } = useCurrentUser()
  const resolvedFamilyId =
    propsFamilyId ||
    (typeof window !== 'undefined'
      ? (localStorage.getItem('lastFamilyId') ?? undefined)
      : undefined)

  const sections = workspace === 'personal' ? personalNavSections : familyNavSections

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="space-y-3 px-1 pt-2">
        <Link to="/families" onClick={onNavigate} className="no-underline">
          <Logo />
        </Link>
        <WorkspaceSwitcher
          workspace={workspace}
          onChange={(next) => {
            setStoredWorkspace(next)
            setWorkspace(next)
            onNavigate?.()
          }}
        />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto scrollbar-slim">
        {sections.map((section) => (
          <div key={section.heading}>
            <p className="kicker mb-2 px-3">{section.heading}</p>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.routeKey ?? item.label}>
                  <NavLink
                    item={item}
                    familyId={resolvedFamilyId}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
        {user?.is_super_admin && (
          <div>
            <p className="kicker mb-2 px-3">Platform</p>
            <ul className="space-y-1">
              <li>
                <NavLink
                  item={{
                    label: 'Admin',
                    icon: ShieldIcon,
                    getTo: () => '/admin',
                    activePathPrefix: '/admin',
                  }}
                  onNavigate={onNavigate}
                />
              </li>
            </ul>
          </div>
        )}
      </nav>
    </div>
  )
}
