import { Loader2Icon } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import type { NotificationItem } from '#/lib/api'
import { ACTION_LABELS } from './action-labels'

type RunAction = (
  notification: NotificationItem,
  action: string,
  delay?: number,
  payload?: Record<string, unknown>,
) => void

export function DefaultNotificationCard({
  notification,
  onAction,
  pending,
}: {
  notification: NotificationItem
  onAction: RunAction
  pending: boolean
}) {
  const primary = notification.allowedActions.find((a) => a === 'ACCEPT')
  const secondary = notification.allowedActions.filter((a) => a !== 'ACCEPT')

  return (
    <div className="rounded-xl border border-border px-4 py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{notification.title}</p>
          {notification.meta?.entityName && (
            <p className="text-xs text-muted-foreground">{notification.meta.entityName}</p>
          )}
          {notification.body && (
            <p className="mt-1 text-muted-foreground">{notification.body}</p>
          )}
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs font-normal">
          {notification.status}
        </Badge>
      </div>
      {notification.allowedActions.length > 0 && notification.status === 'UNREAD' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {primary && (
            <Button
              size="sm"
              disabled={pending}
              onClick={() => onAction(notification, primary)}
            >
              {pending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
              {ACTION_LABELS[primary]?.label ?? primary}
            </Button>
          )}
          {secondary.map((action) => (
            <Button
              key={action}
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => onAction(notification, action)}
            >
              {ACTION_LABELS[action]?.label ?? action.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
