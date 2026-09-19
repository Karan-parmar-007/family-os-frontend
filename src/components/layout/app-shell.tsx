import { useState } from 'react'
import type { ReactNode } from 'react'
import { XIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { SidebarContent } from './sidebar'
import { Topbar } from './topbar'

export function AppShell({
  children,
  familyId,
}: {
  children: ReactNode
  familyId?: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <aside className="glass fixed inset-y-0 left-0 z-[60] hidden w-64 border-r lg:block">
        <SidebarContent familyId={familyId} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="glass absolute inset-y-0 left-0 w-72 animate-in slide-in-from-left">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-3 rounded-full"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <XIcon className="size-5" />
            </Button>
            <SidebarContent
              familyId={familyId}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className={cn('lg:pl-64')}>
        <div className="mx-auto w-full max-w-[1400px] px-3 pb-8 sm:px-5 sm:pb-10">
          {/*
            Sticky chrome owns its own solid + soft edge.
            Fade lives in-flow (not an absolute overlay), so resting page
            content stays fully opaque until it scrolls under this block.
          */}
          <div className="sticky top-0 z-[60]">
            <div className="bg-background pt-3 sm:pt-5">
              <Topbar
                familyId={familyId}
                onOpenSidebar={() => setMobileOpen(true)}
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none h-5 bg-gradient-to-b from-background to-transparent sm:h-6"
            />
          </div>

          <main className="rise-in">{children}</main>
        </div>
      </div>
    </div>
  )
}
