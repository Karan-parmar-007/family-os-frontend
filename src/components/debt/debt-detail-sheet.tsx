import { useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { formatCurrency } from '#/lib/format'
import type { DebtPaymentEvent, DebtSummary } from '#/lib/api/types'
import { FileTextIcon, DownloadIcon, EyeIcon } from 'lucide-react'
import { documentsApi } from '#/lib/api'
import { toast } from 'sonner'
import { useCurrentUser } from '#/hooks/api/use-current-user'
import { checkLogDocAccess } from '#/lib/documents/log-document-actions'
import {
  canApplyPartPayment,
  hasFullDebtView,
  isDebtOwner,
} from '#/lib/debt/permissions'
import { payerLabel } from '#/lib/debt/labels'

type DefaultEntry = {
  id: string
  reason: string
  amount: number
  fineAmount: number
  status: string
  periodKey: string
}

type MemberOption = { id: string; name: string }
type FamilyOption = { id: string; name: string }

type Props = {
  debt: DebtSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string
  familyName?: string
  members?: MemberOption[]
  otherFamilies?: FamilyOption[]
  loading?: boolean
  defaults?: DefaultEntry[]
  totalOpen?: number
  paymentEvents?: DebtPaymentEvent[]
  onPartPayment: () => void
  onContribute: (amount: number) => void
  onEdit: () => void
  onSettle: (defaultId: string) => void
  onWaive: (defaultId: string) => void
  contributePending?: boolean
  /** When true, scroll/focus the contribute box on open */
  focusContribute?: boolean
}

export function DebtDetailSheet({
  debt,
  open,
  onOpenChange,
  familyId,
  familyName = 'This family',
  members = [],
  otherFamilies = [],
  loading,
  defaults = [],
  totalOpen = 0,
  paymentEvents = [],
  onPartPayment,
  onContribute,
  onEdit,
  onSettle,
  onWaive,
  contributePending,
  focusContribute = false,
}: Props) {
  const { data: user } = useCurrentUser()
  const currentUserId = user?.id || ''
  const [contribAmount, setContribAmount] = useState('')

  if (!debt && !loading) return null

  const owner = debt ? isDebtOwner(debt, currentUserId) : false
  const canPartPay = debt ? canApplyPartPayment(debt, currentUserId) : false
  const fullView = debt ? hasFullDebtView(debt, currentUserId) : false
  const canContribute = Boolean(debt?.canContribute) && debt?.status === 'ACTIVE'
  const myEmi = debt?.myEmiAmount ?? debt?.emiAmount
  const myObligation = debt?.myObligationRemaining
  const balance = Number(debt?.balanceForPartPayment ?? 0)

  const docFamilyId = debt?.familyId || familyId

  const canViewDoc =
    fullView &&
    debt?.documentId &&
    checkLogDocAccess(
      {
        document_id: debt.documentId,
        show_doc_to_all: debt.showDocToAll ?? true,
        added_by_user_id: debt.userId,
        doc_viewer_user_ids: debt.docViewerUserIds,
      },
      currentUserId,
    )

  const handleViewDocument = async (fid: string, docId: string) => {
    const toastId = toast.loading('Loading document preview...')
    try {
      const { document: meta } = await documentsApi.getMetadata(fid, docId)
      const url = documentsApi.contentUrl(fid, docId)
      const win = window.open(url, '_blank')
      if (!win) {
        toast.error('Pop-up blocked. Please allow pop-ups for this site.', { id: toastId })
      } else {
        toast.success(`Opening ${meta.filename || 'document'}`, { id: toastId })
      }
    } catch {
      toast.error('Failed to view document.', { id: toastId })
    }
  }

  const handleDownloadDocument = async (fid: string, docId: string) => {
    const toastId = toast.loading('Downloading document...')
    try {
      const { document: meta } = await documentsApi.getMetadata(fid, docId)
      const url = documentsApi.contentUrl(fid, docId)
      const a = document.createElement('a')
      a.href = url
      a.download = meta.filename || 'document'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Download started.', { id: toastId })
    } catch {
      toast.error('Failed to download document.', { id: toastId })
    }
  }

  const total = Number(debt?.totalAmount ?? 0)
  const remaining = Number(debt?.remainingAmount ?? 0)
  const paid = Number(debt?.totalPaid ?? Math.max(0, total - remaining))
  const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0
  const obligationDone =
    myObligation != null && Number(myObligation) <= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {debt?.debtName ?? 'Debt details'}
            {debt?.status && <Badge variant="outline">{debt.status}</Badge>}
            {obligationDone && <Badge variant="secondary">Expected payment done</Badge>}
          </DialogTitle>
        </DialogHeader>
        {loading && !debt ? (
          <p className="text-sm text-muted-foreground">Loading details…</p>
        ) : debt ? (
          <div className="mt-4 space-y-4">
            {!fullView ? (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Your installment</p>
                <p className="text-2xl font-semibold">
                  {myEmi != null ? formatCurrency(Number(myEmi)) : '—'}
                </p>
                {myObligation != null && (
                  <p className="text-sm text-muted-foreground">
                    Still expected from you {formatCurrency(Number(myObligation))}
                  </p>
                )}
                {debt.emiNextDate && (
                  <p className="text-sm text-muted-foreground">
                    Next due {new Date(debt.emiNextDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Remaining</p>
                    <p className="font-semibold">{formatCurrency(remaining)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total</p>
                    <p className="font-semibold">{formatCurrency(total)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Part-pay balance</p>
                    <p className="font-semibold">{formatCurrency(balance)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <p className="font-semibold">{debt.status}</p>
                  </div>
                </div>
                {(myEmi != null || myObligation != null) && (
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">Your share</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {myEmi != null && (
                        <Badge variant="outline">EMI {formatCurrency(Number(myEmi))}</Badge>
                      )}
                      {myObligation != null && (
                        <Badge variant="outline">
                          Expected left {formatCurrency(Number(myObligation))}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Payoff progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Paid {formatCurrency(paid)} of {formatCurrency(total)}
                  </p>
                </div>
                {debt.hasEmi && (
                  <div className="space-y-2 rounded-lg border p-3 text-sm">
                    <p className="font-medium">EMI schedule</p>
                    <div className="flex flex-wrap gap-2">
                      {debt.emiAmount != null && (
                        <Badge variant="outline">
                          EMI {formatCurrency(Number(debt.emiAmount))}
                          {debt.emiEvery ? ` / ${debt.emiEvery.toLowerCase()}` : ''}
                        </Badge>
                      )}
                      {debt.emiNextDate && (
                        <Badge variant="outline">
                          Next: {new Date(debt.emiNextDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                {owner && debt.splitLines && debt.splitLines.length > 0 && (
                  <div className="space-y-2 rounded-lg border p-3 text-sm">
                    <p className="font-medium">Payers</p>
                    <ul className="space-y-1">
                      {debt.splitLines.map((l, i) => (
                        <li key={i} className="flex flex-wrap justify-between gap-2 text-xs">
                          <span>
                            {payerLabel(l, {
                              members,
                              families: otherFamilies,
                              currentFamilyId: familyId,
                              currentFamilyName: familyName,
                            })}
                          </span>
                          <span>
                            EMI {formatCurrency(Number(l.amount))}
                            {l.obligationRemaining != null
                              ? ` · left ${formatCurrency(Number(l.obligationRemaining))}`
                              : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {canViewDoc && debt.documentId && (
                  <div className="space-y-2 rounded-lg border p-3 text-sm">
                    <p className="font-medium flex items-center gap-1.5">
                      <FileTextIcon className="size-4 text-muted-foreground" /> Supporting
                      document
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8"
                        onClick={() => handleViewDocument(docFamilyId, debt.documentId!)}
                      >
                        <EyeIcon className="size-3.5" /> View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8"
                        onClick={() => handleDownloadDocument(docFamilyId, debt.documentId!)}
                      >
                        <DownloadIcon className="size-3.5" /> Download
                      </Button>
                    </div>
                  </div>
                )}
                {owner && defaults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Defaults {totalOpen > 0 ? `(${formatCurrency(totalOpen)} open)` : ''}
                    </p>
                    <ul className="space-y-2">
                      {defaults.map((d) => (
                        <li key={d.id} className="rounded-lg border p-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span>
                              {d.reason} · {d.periodKey}
                            </span>
                            <Badge
                              variant={d.status === 'OPEN' ? 'destructive' : 'secondary'}
                            >
                              {d.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">
                            {formatCurrency(d.amount)}
                            {d.fineAmount > 0
                              ? ` + fine ${formatCurrency(d.fineAmount)}`
                              : ''}
                          </p>
                          {d.status === 'OPEN' && (
                            <div className="mt-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onSettle(d.id)}
                              >
                                Settle
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onWaive(d.id)}
                              >
                                Waive
                              </Button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {canContribute && (
              <div
                id="debt-contribute-box"
                className="space-y-2 rounded-lg border p-3"
                ref={(el) => {
                  if (focusContribute && el && open) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  }
                }}
              >                <p className="text-sm font-medium">Contribute to part-payment balance</p>
                <p className="text-xs text-muted-foreground">
                  {canPartPay
                    ? 'Money leaves your savings now and sits in the debt balance until you apply it to the loan.'
                    : 'Only the person who added this debt can apply a part payment. You can add money to the shared balance here; they apply it to the loan.'}
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="h-9 w-36"
                      value={contribAmount}
                      onChange={(e) => setContribAmount(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={contributePending}
                    onClick={() => {
                      const n = Number(contribAmount)
                      if (!n || n <= 0) {
                        toast.error('Enter a positive amount')
                        return
                      }
                      onContribute(n)
                      setContribAmount('')
                    }}
                  >
                    Contribute
                  </Button>
                </div>
              </div>
            )}

            {!canPartPay && !canContribute && debt.status === 'ACTIVE' && (
              <p className="text-xs text-muted-foreground">
                Only the debt owner can apply part payments. Listed payers can contribute to
                the part-payment balance from Details.
              </p>
            )}

            {paymentEvents.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Payment log</p>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
                  {paymentEvents.slice(0, 20).map((e) => (
                    <li
                      key={e.id}
                      className="flex justify-between gap-2 rounded border px-2 py-1"
                    >
                      <span>
                        {e.eventType}
                        {e.note ? ` — ${e.note}` : ''}
                      </span>
                      <span>{formatCurrency(Number(e.amount ?? e.actualAmount ?? 0))}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {debt.status === 'ACTIVE' && (
              <div className="flex flex-wrap gap-2">
                {canPartPay && (
                  <Button size="sm" onClick={onPartPayment}>
                    {balance > 0 ? 'Apply balance / part payment' : 'Part payment'}
                  </Button>
                )}
                {owner && (
                  <Button size="sm" variant="outline" onClick={onEdit}>
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
