import { useState } from 'react'
import { Loader2Icon } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import type { NotificationItem } from '#/lib/api'
import { ACTION_LABELS } from './action-labels'

type RunAction = (
  notification: NotificationItem,
  action: string,
  delay?: number,
  payload?: Record<string, unknown>,
) => void

export function IncomeNotificationCard({
  notification,
  onAction,
  pending,
}: {
  notification: NotificationItem
  onAction: RunAction
  pending: boolean
}) {
  const [amount, setAmount] = useState(notification.meta?.amount ?? '')
  const splits = notification.meta?.incomeSplits ?? []
  const [allocations, setAllocations] = useState(
    splits.map((s) => ({ familyId: s.familyId, amount: s.amount })),
  )
  const [personal, setPersonal] = useState(notification.meta?.personalAmount ?? '0')

  const submitAdjust = () => {
    onAction(notification, 'ADJUST_AMOUNT', undefined, {
      newAmount: amount,
      incomeAllocations: allocations,
      personalAmount: personal,
    })
  }

  return (
    <div className="rounded-xl border border-border px-4 py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{notification.title}</p>
          <p className="mt-1 text-muted-foreground">{notification.body}</p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs font-normal">
          {notification.status}
        </Badge>
      </div>

      {notification.status === 'UNREAD' && (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor={`amt-${notification.id}`}>Amount received</Label>
            <Input
              id={`amt-${notification.id}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {allocations.map((row, idx) => (
            <div key={row.familyId}>
              <Label>
                {splits[idx]?.familyName ?? 'Family'} allocation
              </Label>
              <Input
                value={row.amount}
                onChange={(e) => {
                  const next = [...allocations]
                  next[idx] = { ...row, amount: e.target.value }
                  setAllocations(next)
                }}
              />
            </div>
          ))}
          <div>
            <Label>Personal amount</Label>
            <Input value={personal} onChange={(e) => setPersonal(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={pending} onClick={() => onAction(notification, 'ACCEPT')}>
              {ACTION_LABELS.ACCEPT.label}
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={submitAdjust}>
              {pending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
              {ACTION_LABELS.ADJUST_AMOUNT.label}
            </Button>
            {notification.allowedActions
              .filter((a) => !['ACCEPT', 'ADJUST_AMOUNT'].includes(a))
              .map((action) => (
                <Button
                  key={action}
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => onAction(notification, action)}
                >
                  {ACTION_LABELS[action]?.label ?? action}
                </Button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
