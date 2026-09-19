import { useNavigate } from '@tanstack/react-router'
import {
  BellIcon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { useLogout } from '#/hooks/api/use-auth'
import { useUnreadNotificationCount } from '#/hooks/api/use-notifications'
import { useCurrentUser } from '#/hooks/api/use-current-user'
import { useAppWorkspace } from '#/hooks/use-app-workspace'

function initialsOf(name?: string | null) {
  if (!name) return 'FO'
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Topbar({
  onOpenSidebar,
}: {
  familyId?: string
  onOpenSidebar: () => void
}) {
  const { data: user } = useCurrentUser()
  const { data: unread } = useUnreadNotificationCount()
  const logout = useLogout()
  const navigate = useNavigate()
  const { workspace } = useAppWorkspace()

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast.success('Signed out')
        navigate({ to: '/' })
      },
      onError: () => toast.error('Could not sign out'),
    })
  }

  return (
    <header className="glass relative z-[2] flex items-center gap-3 rounded-2xl px-3 py-2.5 sm:px-4">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
      >
        <MenuIcon className="size-5" />
      </Button>

      <div className="relative hidden max-w-sm flex-1 items-center sm:flex">
        <SearchIcon className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search anything…"
          className="h-10 w-full rounded-full border border-border bg-background/40 pl-9 pr-4 text-sm outline-none transition focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Badge variant="secondary" className="hidden capitalize sm:inline-flex">
          {workspace}
        </Badge>
                <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
          onClick={() => navigate({ to: '/notifications' })}
        >
          <BellIcon className="size-[1.15rem]" />
          {(unread?.count ?? 0) > 0 && (
            <span className="absolute right-1.5 top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-negative px-1 text-[10px] font-bold text-white ring-2 ring-card">
              {(unread?.count ?? 0) > 9 ? '9+' : unread?.count}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-full p-0.5 pr-2 transition hover:bg-accent">
              <Avatar className="size-8">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-brand/20 text-xs font-semibold text-brand">
                  {initialsOf(user?.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {user?.name ?? 'Guest'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span>{user?.name ?? 'Not signed in'}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {user?.email ?? '—'}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: '/profile' })}>
              <UserIcon className="size-4" />
              Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={handleLogout}
              disabled={logout.isPending}
            >
              <LogOutIcon className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
