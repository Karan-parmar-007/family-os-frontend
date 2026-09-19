/**
 * Single "Who pays?" section for debt forms.
 * Per payer: pool selector, EMI share, expected total, Full details toggle.
 */
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import type { SplitLinePayload } from '#/lib/api/familyos/endpoints/funding'
import type { ScopeViewDraft } from '#/components/debt/debt-scope-views-editor'

export type FamilyOption = { id: string; name: string }
export type MemberOption = { id: string; name: string }

type Props = {
  lines: SplitLinePayload[]
  onLinesChange: (lines: SplitLinePayload[]) => void
  scopeViews: ScopeViewDraft[]
  onScopeViewsChange: (views: ScopeViewDraft[]) => void
  currentFamilyId: string
  currentFamilyName: string
  currentUserId?: string
  /** When false (personal loans), hide "this family" as a payer option. */
  showCurrentFamily?: boolean
  otherFamilies?: FamilyOption[]
  /** Members from current + other/related families who can pay from personal savings. */
  members?: MemberOption[]
  paymentTotal: string
  expectedRemainingTotal?: string
}

function sumLines(lines: SplitLinePayload[], key: 'amount' | 'expectedTotal' = 'amount') {
  return lines.reduce((acc, l) => {
    const raw = key === 'amount' ? l.amount : l.expectedTotal
    return acc + (parseFloat(raw || '0') || 0)
  }, 0)
}

function patchScope(
  views: ScopeViewDraft[],
  key: { scopeKind: 'PERSONAL' | 'FAMILY'; familyId?: string | null; userId?: string | null },
  patch: Partial<ScopeViewDraft>,
): ScopeViewDraft[] {
  const idx = views.findIndex((d) => {
    if (d.scopeKind !== key.scopeKind) return false
    if (key.scopeKind === 'PERSONAL') return (d.userId ?? '') === (key.userId ?? '')
    return d.familyId === key.familyId
  })
  if (idx < 0) return views
  return views.map((d, i) => (i === idx ? { ...d, ...patch } : d))
}

export function DebtFundingSection({
  lines,
  onLinesChange,
  scopeViews,
  onScopeViewsChange,
  currentFamilyId,
  currentFamilyName,
  currentUserId = '',
  showCurrentFamily = true,
  otherFamilies = [],
  members = [],
  paymentTotal,
  expectedRemainingTotal,
}: Props) {
  const totalNum = parseFloat(paymentTotal) || 0
  const expectedNum = parseFloat(expectedRemainingTotal || '') || 0
  const emiSum = sumLines(lines, 'amount')
  const expectedSum = sumLines(lines, 'expectedTotal')
  const emiValid = Math.abs(totalNum - emiSum) < 0.01
  const expectedValid =
    expectedNum <= 0 || Math.abs(expectedNum - expectedSum) < 0.01

  const selectedOtherIds = new Set(
    lines.filter((l) => l.poolType === 'OTHER_FAMILY').map((l) => l.familyId),
  )
  const selectedPersonalUserIds = new Set(
    lines
      .filter((l) => l.poolType === 'PERSONAL')
      .map((l) => l.userId || currentUserId)
      .filter(Boolean),
  )
  const hasCurrent = lines.some((l) => l.poolType === 'CURRENT_FAMILY')
  const freeOther = otherFamilies.filter((f) => !selectedOtherIds.has(f.id))
  const freeMembers = members.filter((m) => !selectedPersonalUserIds.has(m.id))
  const canAdd =
    (showCurrentFamily && !hasCurrent) ||
    freeMembers.length > 0 ||
    freeOther.length > 0

  const update = (idx: number, patch: Partial<SplitLinePayload>) => {
    onLinesChange(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  const add = () => {
    if (!canAdd) return
    if (showCurrentFamily && !hasCurrent) {
      onLinesChange([
        ...lines,
        { poolType: 'CURRENT_FAMILY', familyId: currentFamilyId, amount: '', expectedTotal: '' },
      ])
      return
    }
    if (freeMembers[0]) {
      onLinesChange([
        ...lines,
        {
          poolType: 'PERSONAL',
          userId: freeMembers[0].id,
          amount: '',
          expectedTotal: '',
        },
      ])
      return
    }
    if (freeOther[0]) {
      onLinesChange([
        ...lines,
        {
          poolType: 'OTHER_FAMILY',
          familyId: freeOther[0].id,
          amount: '',
          expectedTotal: '',
        },
      ])
    }
  }

  const viewForLine = (line: SplitLinePayload) => {
    if (line.poolType === 'PERSONAL') {
      const userId = line.userId || currentUserId
      return scopeViews.find(
        (v) => v.scopeKind === 'PERSONAL' && (v.userId ?? '') === (userId ?? ''),
      )
    }
    const familyId =
      line.poolType === 'CURRENT_FAMILY' ? currentFamilyId : line.familyId
    return scopeViews.find(
      (v) => v.scopeKind === 'FAMILY' && v.familyId === familyId,
    )
  }

  const memberName = (userId?: string | null) => {
    if (!userId) return 'Personal savings'
    if (userId === currentUserId) return 'Your personal savings'
    return `${members.find((m) => m.id === userId)?.name ?? 'Member'}'s personal savings`
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Set each payer&apos;s EMI and the total amount you expect from them. EMI shares must
        add up to the loan EMI
        {expectedNum > 0 ? '; expected totals should match remaining' : ''}.
      </p>

      <div className="flex items-center justify-between">
        <Label className="text-sm">Contributors</Label>
        {canAdd && (
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={add}>
            <PlusIcon className="size-3.5" />
            Add
          </Button>
        )}
      </div>

      {lines.length === 0 ? (
        <p className="text-xs italic text-muted-foreground">
          Add at least one contributor.
        </p>
      ) : (
        <div className="space-y-3">
          {lines.map((line, idx) => {
            const otherLines = lines.filter((_, i) => i !== idx)
            const showCurrent =
              showCurrentFamily &&
              (line.poolType === 'CURRENT_FAMILY' ||
                !otherLines.some((l) => l.poolType === 'CURRENT_FAMILY'))
            const takenPersonal = new Set(
              otherLines
                .filter((l) => l.poolType === 'PERSONAL')
                .map((l) => l.userId || currentUserId),
            )
            const availableMembers = members.filter(
              (m) =>
                !takenPersonal.has(m.id) ||
                m.id === (line.userId || currentUserId),
            )
            const takenOther = new Set(
              otherLines
                .filter((l) => l.poolType === 'OTHER_FAMILY')
                .map((l) => l.familyId),
            )
            const availableOther = otherFamilies.filter(
              (f) => !takenOther.has(f.id) || line.familyId === f.id,
            )
            const view = viewForLine(line)
            const personalUserId = line.userId || currentUserId
            const isOwnerPersonal =
              line.poolType === 'PERSONAL' && personalUserId === currentUserId
            const label =
              line.poolType === 'CURRENT_FAMILY'
                ? currentFamilyName
                : line.poolType === 'PERSONAL'
                  ? memberName(personalUserId)
                  : otherFamilies.find((f) => f.id === line.familyId)?.name ??
                    'Other family'

            const selectValue =
              line.poolType === 'OTHER_FAMILY'
                ? `OTHER:${line.familyId ?? ''}`
                : line.poolType === 'PERSONAL'
                  ? `PERSONAL:${personalUserId ?? ''}`
                  : line.poolType

            const obligation = parseFloat(line.obligationRemaining || '')
            const fulfilled =
              line.obligationRemaining != null &&
              line.obligationRemaining !== '' &&
              !Number.isNaN(obligation) &&
              obligation <= 0

            return (
              <div
                key={idx}
                className="space-y-3 rounded-lg border border-border/70 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{label}</span>
                  {fulfilled && (
                    <Badge variant="secondary">Expected payment done</Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.2fr_minmax(0,7rem)_minmax(0,7rem)_auto] sm:items-end">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Paid from</Label>
                    <Select
                      value={selectValue}
                      onValueChange={(v) => {
                        if (v === 'CURRENT_FAMILY') {
                          update(idx, {
                            poolType: 'CURRENT_FAMILY',
                            familyId: currentFamilyId,
                            userId: undefined,
                          })
                        } else if (v.startsWith('PERSONAL:')) {
                          update(idx, {
                            poolType: 'PERSONAL',
                            familyId: undefined,
                            userId: v.slice('PERSONAL:'.length) || currentUserId,
                          })
                        } else if (v.startsWith('OTHER:')) {
                          update(idx, {
                            poolType: 'OTHER_FAMILY',
                            familyId: v.slice(6),
                            userId: undefined,
                          })
                        }
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {showCurrent && (
                          <SelectItem value="CURRENT_FAMILY">
                            {currentFamilyName} (family)
                          </SelectItem>
                        )}
                        {availableMembers.map((m) => (
                          <SelectItem key={m.id} value={`PERSONAL:${m.id}`}>
                            {m.id === currentUserId
                              ? 'Your personal savings'
                              : `${m.name}'s personal savings`}
                          </SelectItem>
                        ))}
                        {availableOther.map((f) => (
                          <SelectItem key={f.id} value={`OTHER:${f.id}`}>
                            {f.name} (family)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">EMI</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-9"
                      value={line.amount}
                      onChange={(e) => update(idx, { amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {fulfilled ? 'Add more (expected)' : 'Expected total'}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-9"
                      value={line.expectedTotal ?? ''}
                      onChange={(e) => {
                        const next = e.target.value
                        const patch: Partial<SplitLinePayload> = {
                          expectedTotal: next,
                        }
                        // Raising expected after fulfilled re-opens obligation by the delta.
                        if (fulfilled) {
                          const prevExpected = parseFloat(line.expectedTotal || '0') || 0
                          const nextExpected = parseFloat(next) || 0
                          const bump = Math.max(0, nextExpected - prevExpected)
                          patch.obligationRemaining = String(bump)
                        } else if (
                          line.obligationRemaining == null ||
                          line.obligationRemaining === ''
                        ) {
                          patch.obligationRemaining = next
                        }
                        update(idx, patch)
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => onLinesChange(lines.filter((_, i) => i !== idx))}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>

                {isOwnerPersonal ? (
                  <p className="text-xs text-muted-foreground">
                    You always see the full loan details.
                  </p>
                ) : view ? (
                  <div className="flex items-center justify-between gap-3 rounded-md bg-muted/30 px-3 py-2">
                    <div>
                      <p className="text-xs font-medium">
                        What{' '}
                        {view.scopeKind === 'PERSONAL'
                          ? (view.userName ?? label)
                          : (view.familyName ?? label)}{' '}
                        sees
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {view.showBreakdown
                          ? 'Full loan + their share'
                          : 'Only their EMI and expected remaining'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Label className="text-xs whitespace-nowrap">Full details</Label>
                      <Switch
                        checked={view.showBreakdown}
                        onCheckedChange={(checked) =>
                          onScopeViewsChange(
                            patchScope(
                              scopeViews,
                              view.scopeKind === 'PERSONAL'
                                ? {
                                    scopeKind: 'PERSONAL',
                                    userId: view.userId,
                                  }
                                : {
                                    scopeKind: 'FAMILY',
                                    familyId: view.familyId,
                                  },
                              {
                                showBreakdown: checked,
                                isMasked: !checked,
                              },
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {lines.length > 0 && (
        <div className="space-y-1 text-xs">
          <p className={emiValid ? 'text-muted-foreground' : 'text-negative'}>
            EMI shares {emiSum.toFixed(2)}
            {totalNum > 0 ? ` / ${totalNum.toFixed(2)}` : ''}
            {!emiValid && totalNum > 0 ? ' — must match loan EMI' : ''}
          </p>
          {expectedNum > 0 && (
            <p className={expectedValid ? 'text-muted-foreground' : 'text-negative'}>
              Expected totals {expectedSum.toFixed(2)} / {expectedNum.toFixed(2)}
              {!expectedValid ? ' — must match remaining' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
