import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { PaymentSplitEditor } from '#/components/forms/payment-split-editor'
import type { FamilyOption } from '#/components/forms/payment-split-editor'
import type { SplitLineBody } from '#/lib/api/familyos/endpoints/debts'
import type { SplitLinePayload } from '#/lib/api/familyos/endpoints/funding'
import type {
  DebtSummary,
  PartPaymentMode,
  PartPaymentResponse,
} from '#/lib/api/familyos/types'
import { ApiError } from '#/lib/api'
import { formatCurrency } from '#/lib/format'

const MODE_OPTIONS: Array<{
  value: PartPaymentMode
  label: string
  description: string
}> = [
  {
    value: 'REDUCE_TENURE',
    label: 'Finish sooner',
    description:
      'EMI stays the same. Principal drops, so fewer installments remain until payoff.',
  },
  {
    value: 'REDUCE_EMI',
    label: 'Lower EMI',
    description:
      'Tenure (number of remaining installments) stays the same. We recalculate a lower EMI on the new principal.',
  },
  {
    value: 'CLEAR_UPCOMING',
    label: 'Advance installments',
    description:
      'Pays whole upcoming EMIs first (skips those due dates), then any leftover reduces principal.',
  },
  {
    value: 'FORECLOSURE',
    label: 'Close loan',
    description: 'Pay the full remaining balance and close the loan.',
  },
]

type FundingSource = 'balance' | 'pools' | 'external'
type RemainderSource = 'pools' | 'external'

type MemberOption = { id: string; name: string }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt: DebtSummary | null
  familyId: string
  familyName: string
  otherFamilies?: FamilyOption[]
  members?: MemberOption[]
  showPersonal?: boolean
  onSubmit: (body: {
    amount: number
    mode: PartPaymentMode
    paidExternally?: boolean
    splitLines?: SplitLineBody[]
    targetEmi?: number
    targetTenure?: number
    note?: string
    useBalance?: boolean
    reassignments?: SplitLineBody[]
  }) => void
  onSimulate?: (body: {
    amount: number
    mode: PartPaymentMode
    paidExternally?: boolean
    splitLines?: SplitLineBody[]
    targetEmi?: number
    targetTenure?: number
  }) => Promise<PartPaymentResponse>
  isPending?: boolean
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

/** Planned share from Contributors (expected total). */
function linePlan(line: SplitLinePayload) {
  const planned = parseFloat(line.expectedTotal || '')
  if (!Number.isNaN(planned) && planned > 0) return planned
  const obl = parseFloat(line.obligationRemaining || '')
  if (!Number.isNaN(obl) && obl > 0) return obl
  return 0
}

/** What this payer still owes toward their plan. */
function lineObligation(line: SplitLinePayload) {
  if (line.obligationRemaining != null && line.obligationRemaining !== '') {
    const obl = parseFloat(line.obligationRemaining)
    if (!Number.isNaN(obl)) return Math.max(0, obl)
  }
  return linePlan(line)
}

function isFulfilledLine(line: SplitLinePayload) {
  // Strict: only treat as done when obligation is effectively zero.
  if (line.obligationRemaining == null || line.obligationRemaining === '') {
    return false
  }
  const obl = parseFloat(line.obligationRemaining)
  return !Number.isNaN(obl) && obl <= 0.009
}

/**
 * Build payer rows matching the Contributors plan (EMI + expected total).
 * Uses expectedTotal for amounts shown (same as debt form). Marks fully paid
 * payers (obligation ≈ 0) at EMI 0.
 */
function linesFromDebtSplit(
  splitLines: NonNullable<DebtSummary['splitLines']>,
): SplitLinePayload[] {
  return splitLines.map((l) => {
    const planned =
      l.expectedTotal != null && String(l.expectedTotal) !== ''
        ? String(l.expectedTotal)
        : l.obligationRemaining != null && String(l.obligationRemaining) !== ''
          ? String(l.obligationRemaining)
          : ''
    const actualObl =
      l.obligationRemaining != null && String(l.obligationRemaining) !== ''
        ? Number(l.obligationRemaining)
        : null
    const done =
      actualObl != null && !Number.isNaN(actualObl) && actualObl <= 0.009
    return {
      poolType: l.poolType,
      familyId: l.familyId,
      userId: l.userId,
      amount: done ? '0' : String(l.amount),
      expectedTotal: planned,
      obligationRemaining: done ? '0' : planned,
    }
  })
}

function scaleReassignments(
  lines: SplitLinePayload[],
  {
    newEmi,
    newRemaining,
    scaleEmi,
  }: {
    oldEmi: number
    newEmi: number
    oldRemaining: number
    newRemaining: number
    scaleEmi: boolean
  },
): SplitLinePayload[] {
  const fulfilledFlags = lines.map((l) => isFulfilledLine(l))
  const activeIdx = lines.map((_, i) => i).filter((i) => !fulfilledFlags[i])

  if (activeIdx.length === 0) {
    return lines.map((l) => ({
      ...l,
      amount: '0',
      obligationRemaining: '0',
      // Keep planned expectedTotal for history; obligation is zero.
      expectedTotal: l.expectedTotal || '0',
    }))
  }

  const activeEmiSum = activeIdx.reduce(
    (a, i) => a + (parseFloat(lines[i].amount) || 0),
    0,
  )
  // Weight remaining by each payer's plan (expected total), same ratios as Contributors.
  // Fall back to current obligation, then EMI share.
  let weightSum = activeIdx.reduce((a, i) => a + linePlan(lines[i]), 0)
  let weightOf = (i: number) => linePlan(lines[i])
  if (weightSum <= 0) {
    weightSum = activeIdx.reduce((a, i) => a + lineObligation(lines[i]), 0)
    weightOf = (i: number) => lineObligation(lines[i])
  }
  if (weightSum <= 0) {
    weightSum = activeEmiSum
    weightOf = (i: number) => parseFloat(lines[i].amount) || 0
  }

  const targetEmiTotal = scaleEmi
    ? newEmi > 0
      ? newEmi
      : activeEmiSum
    : newEmi > 0
      ? newEmi
      : activeEmiSum

  const scaled = lines.map((l, i) => {
    const planned = l.expectedTotal || String(linePlan(l) || '')
    if (fulfilledFlags[i]) {
      return {
        ...l,
        amount: '0',
        obligationRemaining: '0',
        expectedTotal: planned || '0',
      }
    }
    const emiShare =
      activeEmiSum > 0
        ? (parseFloat(l.amount) || 0) / activeEmiSum
        : 1 / activeIdx.length
    const remShare =
      weightSum > 0 ? weightOf(i) / weightSum : 1 / activeIdx.length
    const emi = round2(targetEmiTotal * emiShare)
    const left = round2(newRemaining * remShare)
    return {
      ...l,
      amount: String(emi),
      obligationRemaining: String(left),
      // Preserve plan expected total; only obligation moves with the loan.
      expectedTotal: planned || String(left),
    }
  })

  const fixDrift = (
    field: 'amount' | 'obligationRemaining',
    target: number,
  ) => {
    if (activeIdx.length === 0 || target < 0) return
    const sum = activeIdx.reduce(
      (a, i) => a + (parseFloat(scaled[i][field] || '0') || 0),
      0,
    )
    const drift = round2(target - sum)
    if (Math.abs(drift) < 0.01) return
    const last = activeIdx[activeIdx.length - 1]
    const cur = parseFloat(scaled[last][field] || '0') || 0
    const next = round2(cur + drift)
    scaled[last] = {
      ...scaled[last],
      [field]: String(next),
    }
  }

  if (targetEmiTotal > 0) fixDrift('amount', targetEmiTotal)
  if (newRemaining > 0) fixDrift('obligationRemaining', newRemaining)
  return scaled
}

export function PartPaymentDialog({
  open,
  onOpenChange,
  debt,
  familyId,
  familyName,
  otherFamilies = [],
  members = [],
  showPersonal = true,
  onSubmit,
  onSimulate,
  isPending,
}: Props) {
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<PartPaymentMode>('REDUCE_TENURE')
  const [fundingSource, setFundingSource] = useState<FundingSource>('pools')
  const [remainderSource, setRemainderSource] =
    useState<RemainderSource>('external')
  const [notes, setNotes] = useState('')
  const [targetEmi, setTargetEmi] = useState('')
  const [targetTenure, setTargetTenure] = useState('')
  const [splitLines, setSplitLines] = useState<SplitLinePayload[]>([])
  const [reassignments, setReassignments] = useState<SplitLinePayload[]>([])
  const [preview, setPreview] = useState<PartPaymentResponse | null>(null)
  const [simulating, setSimulating] = useState(false)
  const onSimulateRef = useRef(onSimulate)
  onSimulateRef.current = onSimulate

  const balance = Number(debt?.balanceForPartPayment ?? 0)
  const remaining = Number(debt?.remainingAmount ?? 0)
  const currentEmi = Number(debt?.emiAmount ?? 0)
  const amountNum = Number(amount) || 0
  const fromBalance =
    fundingSource === 'balance' ? round2(Math.min(amountNum, balance)) : 0
  const shortage =
    fundingSource === 'balance' && amountNum > balance
      ? round2(amountNum - balance)
      : 0
  const useBalance = fundingSource === 'balance' && fromBalance > 0
  const paidExternally =
    fundingSource === 'external' ||
    (fundingSource === 'balance' &&
      (shortage <= 0 || remainderSource === 'external'))
  const needsPoolSplit =
    fundingSource === 'pools' ||
    (fundingSource === 'balance' && shortage > 0 && remainderSource === 'pools')
  const poolSplitTotal =
    fundingSource === 'pools'
      ? amount || '0'
      : shortage > 0
        ? String(shortage)
        : '0'

  const memberName = (userId?: string | null) => {
    if (!userId) return 'Personal savings'
    return (
      members.find((m) => m.id === userId)?.name ??
      `Member ${userId.slice(0, 8)}`
    )
  }

  const familyLabel = (fid?: string | null) => {
    if (!fid) return 'Family'
    if (fid === familyId) return familyName
    return (
      otherFamilies.find((f) => f.id === fid)?.name ??
      `Family ${fid.slice(0, 8)}`
    )
  }

  const payerLabel = (line: SplitLinePayload) => {
    if (line.poolType === 'PERSONAL') {
      return `${memberName(line.userId)} (personal)`
    }
    if (line.poolType === 'CURRENT_FAMILY') {
      return `${familyName} (this family)`
    }
    return `${familyLabel(line.familyId)} (other family)`
  }

  const installmentsCovered = useMemo(() => {
    const value = Number(amount) || 0
    if (mode !== 'CLEAR_UPCOMING' || currentEmi <= 0 || value <= 0) return null
    const full = Math.floor(value / currentEmi)
    const leftover = round2(value - full * currentEmi)
    return { full, leftover }
  }, [amount, mode, currentEmi])

  useEffect(() => {
    if (!open) return
    setAmount('')
    setMode('REDUCE_TENURE')
    setFundingSource(balance > 0 ? 'balance' : 'pools')
    setRemainderSource('external')
    setNotes('')
    setTargetEmi('')
    setTargetTenure('')
    setSplitLines([])
    // Mirror Contributors: EMI + expected total. Do not re-scale to loan remaining on open.
    setReassignments(linesFromDebtSplit(debt?.splitLines ?? []))
    setPreview(null)
    if (balance > 0) setAmount(String(balance))
  }, [open, debt?.id, balance, debt?.splitLines])

  useEffect(() => {
    if (mode === 'FORECLOSURE' && debt) {
      setAmount(String(debt.remainingAmount))
    }
  }, [mode, debt])

  // Default amount to ready balance when switching to balance funding (editable above it).
  useEffect(() => {
    if (!open) return
    if (fundingSource === 'balance' && balance > 0 && mode !== 'FORECLOSURE') {
      setAmount(String(balance))
      setSplitLines([])
    }
  }, [fundingSource, balance, open, mode])

  const modeMeta = MODE_OPTIONS.find((m) => m.value === mode)

  const buildBody = (opts?: { forSimulate?: boolean }) => {
    const value = Number(amount)
    if (Number.isNaN(value) || (mode !== 'FORECLOSURE' && value <= 0)) {
      toast.error('Enter a valid part-payment amount')
      return null
    }
    if (
      fundingSource === 'balance' &&
      shortage > 0 &&
      remainderSource === 'pools'
    ) {
      const splitSum = splitLines.reduce(
        (a, l) => a + (parseFloat(l.amount) || 0),
        0,
      )
      if (Math.abs(splitSum - shortage) >= 0.02) {
        toast.error(
          `Cover the shortfall ${formatCurrency(shortage)} from pools (split must match)`,
        )
        return null
      }
    }
    if (fundingSource === 'pools' && splitLines.length > 0) {
      const splitSum = splitLines.reduce(
        (a, l) => a + (parseFloat(l.amount) || 0),
        0,
      )
      if (Math.abs(splitSum - value) >= 0.02) {
        toast.error('Pool split must match the payment amount')
        return null
      }
    }
    if (mode === 'REDUCE_BOTH') {
      const te = targetEmi ? Number(targetEmi) : undefined
      const tt = targetTenure ? Number(targetTenure) : undefined
      if (
        (te == null || Number.isNaN(te)) &&
        (tt == null || Number.isNaN(tt))
      ) {
        toast.error('Reduce both needs a target EMI and/or tenure')
        return null
      }
    }
    if (
      !opts?.forSimulate &&
      reassignments.length === 0 &&
      (debt?.splitLines?.length ?? 0) > 0
    ) {
      toast.error('Reassign EMI and expected amounts for every payer')
      return null
    }
    return {
      amount: value,
      mode,
      paidExternally,
      useBalance,
      note: notes.trim() || undefined,
      targetEmi: targetEmi ? Number(targetEmi) : undefined,
      targetTenure: targetTenure ? Number(targetTenure) : undefined,
      splitLines: needsPoolSplit
        ? splitLines.map((l) => ({
            poolType: l.poolType as SplitLineBody['poolType'],
            amount: Number(l.amount),
            familyId: l.familyId,
            userId: l.userId,
          }))
        : undefined,
      reassignments:
        !opts?.forSimulate && reassignments.length > 0
          ? reassignments.map((l) => ({
              poolType: l.poolType as SplitLineBody['poolType'],
              amount: Number(l.amount),
              familyId: l.familyId,
              userId: l.userId,
              expectedTotal:
                l.expectedTotal != null && l.expectedTotal !== ''
                  ? Number(l.expectedTotal)
                  : undefined,
              obligationRemaining:
                l.obligationRemaining != null && l.obligationRemaining !== ''
                  ? Number(l.obligationRemaining)
                  : undefined,
            }))
          : undefined,
    }
  }

  const handleSubmit = () => {
    const body = buildBody()
    if (!body) return
    onSubmit(body)
  }

  useEffect(() => {
    if (!open || !onSimulateRef.current || amountNum <= 0) {
      setPreview(null)
      setSimulating(false)
      return
    }
    if (mode === 'REDUCE_BOTH' && !targetEmi && !targetTenure) return

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setSimulating(true)
      try {
        const simulate = onSimulateRef.current
        if (!simulate) return
        const res = await simulate({
          amount: amountNum,
          mode,
          paidExternally,
          targetEmi: targetEmi ? Number(targetEmi) : undefined,
          targetTenure: targetTenure ? Number(targetTenure) : undefined,
        })
        if (cancelled) return
        setPreview(res)
        const base = linesFromDebtSplit(debt?.splitLines ?? [])
        if (base.length) {
          setReassignments(
            scaleReassignments(base, {
              oldEmi: Number(res.oldEmi),
              newEmi: Number(res.newEmi),
              oldRemaining: Number(res.oldRemaining),
              newRemaining: Number(res.newRemaining),
              scaleEmi: mode === 'REDUCE_EMI' || mode === 'REDUCE_BOTH',
            }),
          )
        }
      } catch (err) {
        if (!cancelled) {
          setPreview(null)
          if (err instanceof ApiError) {
            toast.error(err.message)
          }
        }
      } finally {
        if (!cancelled) setSimulating(false)
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      setSimulating(false)
    }
  }, [
    open,
    amountNum,
    mode,
    paidExternally,
    targetEmi,
    targetTenure,
    debt?.splitLines,
  ])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Part payment — {debt?.debtName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="order-0 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
            <p>
              <span className="font-medium text-foreground">
                Loan remaining:
              </span>{' '}
              {formatCurrency(remaining)}
              {currentEmi > 0
                ? ` · current EMI ${formatCurrency(currentEmi)}`
                : ''}
            </p>
            {debt?.interestType && (
              <p>
                Interest:{' '}
                <span className="text-foreground">
                  {debt.interestType.replace(/_/g, ' ')}
                  {debt.interestRate != null ? ` @ ${debt.interestRate}%` : ''}
                </span>
                . Reducing EMI uses standard amortization on the new principal;
                reduce tenure keeps EMI and shortens remaining periods.
              </p>
            )}
          </div>

          <div className="order-2 space-y-2">
            <Label>2. Pay from where?</Label>
            <Select
              value={fundingSource}
              onValueChange={(v) => setFundingSource(v as FundingSource)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balance" disabled={balance <= 0}>
                  Saved part-payment balance
                  {balance > 0 ? ` (${formatCurrency(balance)})` : ' (empty)'}
                </SelectItem>
                <SelectItem value="pools">
                  Debit savings / family pools now
                </SelectItem>
                <SelectItem value="external">Paid outside the app</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {fundingSource === 'balance'
                ? 'Uses money already contributed by payers. No new savings debit.'
                : fundingSource === 'external'
                  ? 'Records the payment without touching savings balances.'
                  : 'Debits the pools you choose below when you apply.'}
            </p>
          </div>

          <div className="order-1 space-y-1">
            <Label>1. How much?</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setPreview(null)
              }}
              disabled={mode === 'FORECLOSURE'}
            />
            {fundingSource === 'balance' && balance > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAmount(String(balance))
                      setPreview(null)
                    }}
                  >
                    Use full balance {formatCurrency(balance)}
                  </Button>
                </div>
                {shortage > 0 ? (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
                    <p className="text-xs text-foreground">
                      Balance covers {formatCurrency(fromBalance)}. Shortfall{' '}
                      <span className="font-medium">
                        {formatCurrency(shortage)}
                      </span>{' '}
                      must be paid another way.
                    </p>
                    <div className="space-y-1">
                      <Label className="text-xs">Cover shortfall from</Label>
                      <Select
                        value={remainderSource}
                        onValueChange={(v) => {
                          setRemainderSource(v as RemainderSource)
                          setSplitLines([])
                          setPreview(null)
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="external">
                            Paid outside the app
                          </SelectItem>
                          <SelectItem value="pools">
                            Debit savings / family pools
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Using {formatCurrency(fromBalance)} from saved balance
                    {amountNum > 0 && amountNum < balance
                      ? ` (${formatCurrency(round2(balance - fromBalance))} left unused)`
                      : ''}
                    .
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="order-3 space-y-1">
            <Label>3. What should improve?</Label>
            <Select
              value={mode}
              onValueChange={(v) => {
                const next = v as PartPaymentMode
                setMode(next)
                setPreview(null)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {modeMeta && (
              <p className="text-xs text-muted-foreground">
                {modeMeta.description}
              </p>
            )}
          </div>

          {mode === 'REDUCE_BOTH' && (
            <div className="order-4 grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Target EMI</Label>
                <Input
                  type="number"
                  value={targetEmi}
                  onChange={(e) => setTargetEmi(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Target tenure (periods)</Label>
                <Input
                  type="number"
                  value={targetTenure}
                  onChange={(e) => setTargetTenure(e.target.value)}
                />
              </div>
            </div>
          )}

          {installmentsCovered && (
            <div className="order-4 rounded-lg border border-brand/30 bg-brand/5 p-3 text-sm">
              <p className="font-medium">Installments this amount covers</p>
              <p className="mt-1 text-muted-foreground">
                {installmentsCovered.full > 0
                  ? `${installmentsCovered.full} full EMI${installmentsCovered.full === 1 ? '' : 's'}`
                  : 'No full EMI yet'}
                {installmentsCovered.leftover > 0
                  ? ` + ${formatCurrency(installmentsCovered.leftover)} leftover toward principal`
                  : ''}
              </p>
            </div>
          )}

          {needsPoolSplit && (
            <div className="order-4 space-y-2">
              {shortage > 0 && fundingSource === 'balance' && (
                <p className="text-xs text-muted-foreground">
                  Split the shortfall {formatCurrency(shortage)} across pools
                  (balance already covers {formatCurrency(fromBalance)}).
                </p>
              )}
              <PaymentSplitEditor
                lines={splitLines}
                currentFamilyId={familyId}
                currentFamilyName={familyName}
                otherFamilies={otherFamilies}
                showPersonal={showPersonal}
                total={poolSplitTotal}
                onChange={setSplitLines}
              />
            </div>
          )}

          {reassignments.length > 0 && (
            <details className="order-4 rounded-lg border p-3">
              <summary className="cursor-pointer list-none">
                <div>
                  <p className="text-sm font-medium">
                    Adjust payer shares manually
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Shares are automatically scaled from the contributor plan.
                  </p>
                </div>
              </summary>
              <div className="mt-3 space-y-3 border-t pt-3">
                {reassignments.map((line, idx) => {
                  const done = isFulfilledLine(line)
                  return (
                    <div
                      key={`${line.poolType}-${line.userId ?? ''}-${line.familyId ?? ''}-${idx}`}
                      className="grid grid-cols-1 gap-2 sm:grid-cols-[1.4fr_minmax(0,7rem)_minmax(0,7rem)]"
                    >
                      <div className="self-end">
                        <p className="text-xs font-medium">
                          {payerLabel(line)}
                        </p>
                        {done && (
                          <p className="text-[10px] text-emerald-500">
                            Share complete
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">EMI share</Label>
                        <Input
                          type="number"
                          className="h-8"
                          value={line.amount}
                          disabled={
                            done ||
                            mode === 'REDUCE_TENURE' ||
                            mode === 'CLEAR_UPCOMING'
                          }
                          onChange={(e) =>
                            setReassignments((rows) =>
                              rows.map((r, i) =>
                                i === idx
                                  ? { ...r, amount: e.target.value }
                                  : r,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Expected left</Label>
                        <Input
                          type="number"
                          className="h-8"
                          value={line.obligationRemaining ?? ''}
                          disabled={done}
                          onChange={(e) =>
                            setReassignments((rows) =>
                              rows.map((r, i) =>
                                i === idx
                                  ? {
                                      ...r,
                                      obligationRemaining: e.target.value,
                                      expectedTotal: e.target.value,
                                    }
                                  : r,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </details>
          )}

          <div className="order-4 space-y-1">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note for this payment"
              rows={2}
            />
          </div>

          {preview && (
            <div className="order-4 rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
              <p className="font-medium">Preview</p>
              <p>
                Remaining {formatCurrency(Number(preview.oldRemaining))} →{' '}
                {formatCurrency(Number(preview.newRemaining))}
              </p>
              <p>
                EMI {formatCurrency(Number(preview.oldEmi))} →{' '}
                {formatCurrency(Number(preview.newEmi))}
              </p>
              <p>Remaining periods: {preview.newPeriods}</p>
              {(preview.periodsCleared ?? 0) > 0 && (
                <p>Installments advanced: {preview.periodsCleared}</p>
              )}
              {preview.interestSavedEstimate != null &&
                Number(preview.interestSavedEstimate) > 0 && (
                  <p>
                    Est. interest saved{' '}
                    {formatCurrency(Number(preview.interestSavedEstimate))}
                  </p>
                )}
              {preview.note && (
                <p className="text-muted-foreground">{preview.note}</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={simulating || isPending}>
            {simulating ? 'Calculating…' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
