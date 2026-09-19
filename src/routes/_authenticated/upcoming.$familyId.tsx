import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { CronRunButton } from '#/components/common/cron-run-button'
import { AppShell } from '#/components/layout/app-shell'
import { BentoCard, BentoGrid } from '#/components/bento/bento'
import { Badge } from '#/components/ui/badge'
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
import { useUpcoming } from '#/hooks/api/familyos/use-upcoming'
import { useMyScheduledJobs, useScheduledJobAction } from '#/hooks/api/familyos/use-scheduler'
import { useScope } from '#/hooks/use-scope'
import { ApiError, familiesApi, fundingApi, isNetworkError, type UpcomingItem } from '#/lib/api'
import { formatCurrency } from '#/lib/format'
import {  } from '#/hooks/api/familyos/use-families'
import { scopeLabel } from '#/lib/scope'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '#/lib/query/keys'

interface Search {
  scope?: string
}

const HORIZONS = [30, 90, 180, 365] as const

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  DEBT_EMI: 'Debt EMI',
  INSURANCE_PREMIUM: 'Insurance',
  PLAN_CONTRIB: 'Savings plan',
  GOAL_CONTRIB: 'Goal',
  AUTO_TRANSFER: 'Auto-transfer',
}

export const Route = createFileRoute('/_authenticated/upcoming/$familyId')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    scope: typeof search.scope === 'string' ? search.scope : undefined,
  }),
  beforeLoad: async ({ params }) => {
    if (typeof document === 'undefined') return
    try {
      const { items } = await familiesApi.list()
      if (!items.some((f) => f.id === params.familyId)) {
        throw redirect({ to: '/families' })
      }
    } catch (error) {
      if (isRedirect(error)) throw error
      if (!isNetworkError(error)) throw error
    }
  },
  component: UpcomingPage,
})

function UpcomingPage() {
  const { familyId } = Route.useParams()
  const { scope } = useScope()
  
  const [horizon, setHorizon] = useState<number>(90)
  const { data, isLoading } = useUpcoming(familyId, scope, horizon)
  const { data: myJobs } = useMyScheduledJobs(familyId, 1, 10)
  const jobAction = useScheduledJobAction(familyId)
  const qc = useQueryClient()
  const [editTarget, setEditTarget] = useState<UpcomingItem | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editMode, setEditMode] = useState<'ONE_TIME' | 'PERMANENT'>('ONE_TIME')

  const reschedule = useMutation({
    mutationFn: async () => {
      if (!editTarget?.jobId) throw new Error('No job to reschedule')
      const body = {
        newDate: new Date(editDate).toISOString(),
        mode: editMode,
      }
      if (editTarget.isPersonal) {
        return fundingApi.reschedulePersonalJob(editTarget.jobId, body)
      }
      return fundingApi.rescheduleFamilyJob(familyId, editTarget.jobId, body)
    },
    onSuccess: () => {
      toast.success('Date updated')
      setEditTarget(null)
      qc.invalidateQueries({ queryKey: queryKeys.upcoming(familyId) })
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'Reschedule failed'),
  })

  const openEdit = (item: UpcomingItem) => {
    setEditTarget(item)
    setEditDate(item.date.slice(0, 10))
    setEditMode(item.jobId ? 'ONE_TIME' : 'PERMANENT')
  }

  const format = (value: number) =>
    formatCurrency(value)

  return (
    <AppShell familyId={familyId}>
      <BentoGrid>
        <BentoCard className="col-span-full">
          <h1 className="text-xl font-semibold">Upcoming payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Projected recurring events for {scopeLabel(scope)} — read-only, no
            writes.
          </p>
          <div className="mt-3">
            <CronRunButton />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {HORIZONS.map((days) => (
              <Button
                key={days}
                type="button"
                size="sm"
                variant={horizon === days ? 'default' : 'outline'}
                onClick={() => setHorizon(days)}
              >
                {days} days
              </Button>
            ))}
          </div>

          {isLoading && <p className="mt-4 text-sm">Loading…</p>}

          <ul className="mt-6 space-y-2">
            {(data?.items ?? []).map((item, idx) => (
              <li
                key={`${item.sourceId}-${item.date}-${idx}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {TYPE_LABELS[item.type] ?? item.type}
                    </Badge>
                    <span className="font-medium">{item.name}</span>
                    {item.isPersonal && (
                      <span className="text-xs text-muted-foreground">personal</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={
                    item.direction === 'IN' ? 'font-semibold text-positive' : 'font-semibold'
                  }
                >
                  {item.direction === 'IN' ? '+' : '−'}
                  {format(Number(item.amount))}
                </span>
                <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                  Edit date
                </Button>
              </li>
            ))}
            {!isLoading && (data?.items ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing scheduled in the next {horizon} days.
              </p>
            )}
          </ul>
        </BentoCard>
        <BentoCard className="col-span-full">
          <h2 className="text-lg font-semibold">My pending confirmations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Jobs currently assigned to you and awaiting action.
          </p>
          <ul className="mt-4 space-y-2">
            {(myJobs?.items ?? []).map((job) => (
              <li
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{job.jobType}</Badge>
                    <span className="font-medium">{job.sourceType}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(job.scheduledFor).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className="font-semibold">{format(Number(job.amount))}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      jobAction.mutate(
                        { jobId: job.id, action: 'ACCEPT' },
                        {
                          onSuccess: () => toast.success('Job accepted'),
                          onError: (err) =>
                            toast.error(err instanceof ApiError ? err.message : 'Failed to accept job'),
                        },
                      )
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      jobAction.mutate(
                        { jobId: job.id, action: 'SKIP_DEFAULT' },
                        {
                          onSuccess: () => toast.success('Job skipped'),
                          onError: (err) =>
                            toast.error(err instanceof ApiError ? err.message : 'Failed to skip job'),
                        },
                      )
                    }
                  >
                    Skip
                  </Button>
                </div>
              </li>
            ))}
            {(myJobs?.items ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No pending confirmations.</p>
            )}
          </ul>
        </BentoCard>
      </BentoGrid>

      {editTarget && (
        <Dialog open onOpenChange={(open) => !open && setEditTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit date — {editTarget.name}</DialogTitle>
              <DialogDescription>
                {editTarget.jobId
                  ? 'Choose whether to move only this occurrence or all future ones.'
                  : 'No pending job yet — only permanent date change is available.'}
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (editTarget.jobId) {
                  reschedule.mutate()
                } else {
                  toast.info('Edit the recurring item directly to change future dates.')
                }
              }}
            >
              <div>
                <Label htmlFor="edit-date">New date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                />
              </div>
              {editTarget.jobId && (
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={editMode === 'ONE_TIME'}
                      onChange={() => setEditMode('ONE_TIME')}
                    />
                    Only this occurrence
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={editMode === 'PERMANENT'}
                      onChange={() => setEditMode('PERMANENT')}
                    />
                    This and all future
                  </label>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={reschedule.isPending || !editTarget.jobId}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  )
}
