import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationAction,
  useNotifications,
} from '#/hooks/api/use-notifications'
import { ApiError, type NotificationItem } from '#/lib/api'
import { NotificationCard } from './cards'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function NotificationCenter({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, isError } = useNotifications(1, compact ? 5 : 20)
  const act = useNotificationAction()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const [delayTarget, setDelayTarget] = useState<NotificationItem | null>(null)
  const [delayDays, setDelayDays] = useState('7')

  const runAction = (
    notification: NotificationItem,
    action: string,
    delay?: number,
    payload?: Record<string, unknown>,
  ) => {
    act.mutate(
      {
        notificationId: notification.id,
        body: { action, delayDays: delay, payload },
      },
      {
        onSuccess: () => toast.success('Action applied'),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : 'Action failed'),
      },
    )
  }

  const handleAction = (
    notification: NotificationItem,
    action: string,
    delay?: number,
    payload?: Record<string, unknown>,
  ) => {
    if (action === 'DECLINE_DELAY') {
      setDelayTarget(notification)
      setDelayDays('7')
      return
    }
    runAction(notification, action, delay, payload)
  }

  const submitDelay = (e: React.FormEvent) => {
    e.preventDefault()
    if (!delayTarget) return
    const days = parseInt(delayDays, 10)
    if (isNaN(days) || days < 1 || days > 90) {
      toast.error('Enter delay between 1 and 90 days')
      return
    }
    runAction(delayTarget, 'DECLINE_DELAY', days)
    setDelayTarget(null)
  }

  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">
        Notifications are not enabled on this server.
      </p>
    )
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  const items = data?.items ?? []

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
    )
  }

  return (
    <>
      {!compact && (
        <div className="mb-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={markAll.isPending}
            onClick={() =>
              markAll.mutate(undefined, {
                onSuccess: () => toast.success('All notifications marked as read'),
                onError: (err) =>
                  toast.error(
                    err instanceof ApiError ? err.message : 'Failed to mark all as read',
                  ),
              })
            }
          >
            Mark all as read
          </Button>
        </div>
      )}
      <ul className={compact ? 'space-y-2' : 'space-y-3'}>
        {items.map((n) => (
          <li key={n.id}>
            <NotificationCard
              notification={n}
              onAction={handleAction}
              pending={act.isPending}
            />
            <p className="mt-1 px-1 text-xs text-muted-foreground">
              {formatWhen(n.createdAt)}
            </p>
            {n.status === 'UNREAD' && (
              <div className="mt-1 px-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={markRead.isPending}
                  onClick={() =>
                    markRead.mutate(n.id, {
                      onSuccess: () => toast.success('Marked as read'),
                    })
                  }
                >
                  Mark read
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {delayTarget && (
        <Dialog open onOpenChange={(open) => !open && setDelayTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remind me later</DialogTitle>
              <DialogDescription>
                How many days should we wait before asking again?
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitDelay} className="space-y-4">
              <div>
                <Label htmlFor="delay-days">Delay (days)</Label>
                <Input
                  id="delay-days"
                  type="number"
                  min={1}
                  max={90}
                  value={delayDays}
                  onChange={(e) => setDelayDays(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDelayTarget(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={act.isPending}>
                  Confirm
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
