import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AppShell } from '#/components/layout/app-shell'
import { BentoCard, BentoGrid } from '#/components/bento/bento'
import { NotificationCenter } from '#/components/notifications/notification-center'
import { Button } from '#/components/ui/button'
import { useNotifications } from '#/hooks/api/use-notifications'

export const Route = createFileRoute('/_authenticated/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  const [tab, setTab] = useState<'active' | 'history'>('active')
  const { data: historyData } = useNotifications(1, 50)

  const historyItems =
    historyData?.items.filter((n) => n.status === 'ACTIONED' || n.status === 'DISMISSED') ??
    []

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm scheduled income, EMIs, and other pending actions.
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant={tab === 'active' ? 'default' : 'outline'}
            onClick={() => setTab('active')}
          >
            Needs action
          </Button>
          <Button
            size="sm"
            variant={tab === 'history' ? 'default' : 'outline'}
            onClick={() => setTab('history')}
          >
            History
          </Button>
        </div>
      </div>
      <BentoGrid>
        <BentoCard className="col-span-full">
          {tab === 'active' ? (
            <NotificationCenter />
          ) : (
            <ul className="space-y-2">
              {historyItems.map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl border border-border px-4 py-3 text-sm"
                >
                  <p className="font-medium">{n.title}</p>
                  {n.actionTaken && (
                    <p className="text-xs text-muted-foreground">
                      Action: {n.actionTaken}
                    </p>
                  )}
                </li>
              ))}
              {historyItems.length === 0 && (
                <p className="text-sm text-muted-foreground">No history yet.</p>
              )}
            </ul>
          )}
        </BentoCard>
      </BentoGrid>
    </AppShell>
  )
}
