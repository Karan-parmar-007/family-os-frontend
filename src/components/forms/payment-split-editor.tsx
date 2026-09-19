/**
 * PaymentSplitEditor — lets the user configure multi-pool payment splits
 * for a recurring entity (debt EMI, savings plan contribution, etc.).
 *
 * The editor supports three pool types:
 *   CURRENT_FAMILY  – the family the user is currently viewing
 *   PERSONAL        – the user's personal savings pool
 *   OTHER_FAMILY    – another family the user belongs to
 */

import { useMemo } from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'
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
import type { SplitLinePayload } from '#/lib/api/endpoints/funding'

export type FamilyOption = {
  id: string
  name: string
}

export type SplitEditorProps = {
  lines: SplitLinePayload[]
  currentFamilyId: string
  currentFamilyName: string
  /** Other families the user belongs to (excluding the current one) */
  otherFamilies?: FamilyOption[]
  /** Whether to show the PERSONAL pool option */
  showPersonal?: boolean
  total: string
  onChange: (lines: SplitLinePayload[]) => void
}

const POOL_LABELS: Record<string, string> = {
  CURRENT_FAMILY: 'This family',
  PERSONAL: 'Personal savings',
  OTHER_FAMILY: 'Other family',
}

function computeSum(lines: SplitLinePayload[]): number {
  return lines.reduce((acc, l) => acc + (parseFloat(l.amount) || 0), 0)
}

export function PaymentSplitEditor({
  lines,
  currentFamilyId,
  currentFamilyName,
  otherFamilies = [],
  showPersonal = true,
  total,
  onChange,
}: SplitEditorProps) {
  const totalNum = parseFloat(total) || 0
  const sum = computeSum(lines)
  const diff = Math.abs(totalNum - sum)
  const valid = diff < 0.01

  // Compute remaining/unselected pools globally
  const hasRemainingPools = useMemo(() => {
    const currentFamilySelected = lines.some((l) => l.poolType === 'CURRENT_FAMILY')
    const personalSelected = showPersonal && lines.some((l) => l.poolType === 'PERSONAL')
    const selectedOtherFamilyIds = new Set(
      lines.filter((l) => l.poolType === 'OTHER_FAMILY').map((l) => l.familyId)
    )
    const unselectedOtherFamilies = otherFamilies.filter((f) => !selectedOtherFamilyIds.has(f.id))

    return !currentFamilySelected || (showPersonal && !personalSelected) || unselectedOtherFamilies.length > 0
  }, [lines, showPersonal, otherFamilies])

  const update = (idx: number, patch: Partial<SplitLinePayload>) => {
    onChange(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  const remove = (idx: number) => {
    onChange(lines.filter((_, i) => i !== idx))
  }

  const add = () => {
    if (!hasRemainingPools) return

    // Find the first unselected pool to auto-select
    const currentFamilySelected = lines.some((l) => l.poolType === 'CURRENT_FAMILY')
    const personalSelected = showPersonal && lines.some((l) => l.poolType === 'PERSONAL')
    const selectedOtherFamilyIds = new Set(
      lines.filter((l) => l.poolType === 'OTHER_FAMILY').map((l) => l.familyId)
    )
    const unselectedOtherFamilies = otherFamilies.filter((f) => !selectedOtherFamilyIds.has(f.id))

    let defaultPoolType: SplitLinePayload['poolType'] = 'CURRENT_FAMILY'
    let defaultFamilyId: string | undefined = undefined

    if (!currentFamilySelected) {
      defaultPoolType = 'CURRENT_FAMILY'
      defaultFamilyId = currentFamilyId
    } else if (showPersonal && !personalSelected) {
      defaultPoolType = 'PERSONAL'
    } else if (unselectedOtherFamilies.length > 0) {
      defaultPoolType = 'OTHER_FAMILY'
      defaultFamilyId = unselectedOtherFamilies[0].id
    }

    onChange([
      ...lines,
      {
        poolType: defaultPoolType,
        familyId: defaultFamilyId,
        userId: undefined,
        amount: '',
      },
    ])
  }

  const handlePoolTypeChange = (idx: number, poolType: string) => {
    // When changing pool type, select the first unselected option for that type
    let familyId: string | undefined = undefined
    if (poolType === 'CURRENT_FAMILY') {
      familyId = currentFamilyId
    } else if (poolType === 'OTHER_FAMILY') {
      const selectedOtherFamilyIds = new Set(
        lines.filter((l, i) => i !== idx && l.poolType === 'OTHER_FAMILY').map((l) => l.familyId)
      )
      const firstUnselectedOther = otherFamilies.find((f) => !selectedOtherFamilyIds.has(f.id))
      familyId = firstUnselectedOther?.id ?? otherFamilies[0]?.id
    }
    update(idx, { poolType, familyId })
  }

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">Payment split</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Specify which pools contribute to this payment.
          </p>
        </div>
        {hasRemainingPools && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={add}
          >
            <PlusIcon className="size-3.5" />
            Add pool
          </Button>
        )}
      </div>

      {lines.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No split configured — defaults to current family pool.
        </p>
      ) : (
        <div className="space-y-2">
          {lines.map((line, idx) => {
            const otherLines = lines.filter((_, i) => i !== idx)

            // Determine if options are available for this specific row
            const showCurrentFamily = !otherLines.some((l) => l.poolType === 'CURRENT_FAMILY') || line.poolType === 'CURRENT_FAMILY'
            const showPersonalOption = showPersonal && (!otherLines.some((l) => l.poolType === 'PERSONAL') || line.poolType === 'PERSONAL')
            const selectedOtherFamilyIds = new Set(
              otherLines.filter((l) => l.poolType === 'OTHER_FAMILY').map((l) => l.familyId)
            )
            const availableOtherFamilies = otherFamilies.filter(
              (f) => !selectedOtherFamilyIds.has(f.id) || line.familyId === f.id
            )
            const showOtherFamilyOption = availableOtherFamilies.length > 0

            return (
              <div
                key={idx}
                className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_minmax(0,8rem)_auto] items-end"
              >
                {/* Pool type */}
                <Select
                  value={line.poolType}
                  onValueChange={(v) => handlePoolTypeChange(idx, v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Pool type" />
                  </SelectTrigger>
                  <SelectContent>
                    {showCurrentFamily && (
                      <SelectItem value="CURRENT_FAMILY">
                        {POOL_LABELS.CURRENT_FAMILY} ({currentFamilyName})
                      </SelectItem>
                    )}
                    {showPersonalOption && (
                      <SelectItem value="PERSONAL">
                        {POOL_LABELS.PERSONAL}
                      </SelectItem>
                    )}
                    {showOtherFamilyOption && (
                      <SelectItem value="OTHER_FAMILY">
                        {POOL_LABELS.OTHER_FAMILY}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {/* Family selector (only for OTHER_FAMILY) */}
                {line.poolType === 'OTHER_FAMILY' ? (
                  <Select
                    value={line.familyId ?? ''}
                    onValueChange={(v) => update(idx, { familyId: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select family" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOtherFamilies.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground flex items-center px-2 h-9 border rounded-md bg-muted/30">
                    {line.poolType === 'CURRENT_FAMILY'
                      ? currentFamilyName
                      : 'Personal'}
                  </div>
                )}

                {/* Amount */}
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="h-9"
                  placeholder="Amount"
                  value={line.amount}
                  onChange={(e) => update(idx, { amount: e.target.value })}
                />

                {/* Remove */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => remove(idx)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Sum vs total indicator */}
      {lines.length > 0 && totalNum > 0 && (
        <div
          className={`flex items-center justify-between text-xs px-1 ${
            valid ? 'text-emerald-600' : 'text-destructive'
          }`}
        >
          <span>
            Split sum: <strong>{sum.toFixed(2)}</strong>
          </span>
          <span>
            {valid ? '✓ Matches total' : `⚠ Difference: ${diff.toFixed(2)}`}
          </span>
        </div>
      )}
    </div>
  )
}
