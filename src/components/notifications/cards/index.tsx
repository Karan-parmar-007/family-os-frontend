import type { NotificationItem } from '#/lib/api'
import { DefaultNotificationCard } from './default-notification-card'
import { IncomeNotificationCard } from './income-notification-card'

type RunAction = (
  notification: NotificationItem,
  action: string,
  delay?: number,
  payload?: Record<string, unknown>,
) => void

export function NotificationCard({
  notification,
  onAction,
  pending,
}: {
  notification: NotificationItem
  onAction: RunAction
  pending: boolean
}) {
  const jobType = notification.meta?.jobType ?? notification.type

  if (jobType === 'RECURRING_INCOME' && notification.status === 'UNREAD') {
    return (
      <IncomeNotificationCard
        notification={notification}
        onAction={onAction}
        pending={pending}
      />
    )
  }

  return (
    <DefaultNotificationCard
      notification={notification}
      onAction={onAction}
      pending={pending}
    />
  )
}
