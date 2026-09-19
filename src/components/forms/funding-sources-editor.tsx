import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { CurrencyAmountInput } from '#/components/forms/currency-amount-input'
import { getDisplayCurrency } from '#/lib/format'
import type { FamilyFundingRow, PersonalFundingRow } from '#/lib/forms/allocation'

export type FundingSourceRow = FamilyFundingRow

export type FundingFamilyOption = {
  id: string
  name: string
  currency: string
}

export type FundingPersonOption = {
  id: string
  name: string
  kind?: 'self' | 'member' | 'friend'
}

export function PersonalFundingSourcesEditor({
  rows,
  people,
  currentUserId,
  displayCurrency,
  rates,
  ratesBase,
  onChange,
}: {
  rows: PersonalFundingRow[]
  people: FundingPersonOption[]
  currentUserId: string
  displayCurrency?: string
  rates?: Record<string, number>
  ratesBase?: string
  onChange: (rows: PersonalFundingRow[]) => void
}) {
  const amountCurrency = displayCurrency || getDisplayCurrency()

  const update = (idx: number, patch: Partial<PersonalFundingRow>) => {
    onChange(rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  }

  const remove = (idx: number) => {
    onChange(rows.filter((_, i) => i !== idx))
  }

  const add = () => {
    const used = new Set(rows.map((r) => r.userId))
    const next = people.find((p) => !used.has(p.id))
    if (!next) return
    onChange([...rows, { userId: next.id, amount: '' }])
  }

  const labelFor = (userId: string) => {
    if (userId === currentUserId) return 'You (personal savings)'
    const person = people.find((p) => p.id === userId)
    if (!person) return 'Personal savings'
    if (person.kind === 'friend') return `${person.name} (friend)`
    return `${person.name} (personal)`
  }

  const selectablePeople = people.filter((p) => p.id)

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label>Personal splits</Label>
          <p className="text-xs text-muted-foreground">
            Allocate to your personal savings, family members, or friends.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 self-start"
          onClick={add}
          disabled={selectablePeople.length === 0 || rows.length >= selectablePeople.length}
        >
          <PlusIcon className="size-3.5" />
          Add person
        </Button>
      </div>

      {selectablePeople.length === 0 ? (
        <p className="text-xs text-muted-foreground">No people available to allocate to.</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Optional — add people to split personal amounts.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div
              key={`${idx}-${row.userId}`}
              className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_minmax(0,9rem)_auto]"
            >
              <Select value={row.userId} onValueChange={(value) => update(idx, { userId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {selectablePeople.map((person) => (
                    <SelectItem
                      key={person.id}
                      value={person.id}
                      disabled={rows.some((r, i) => i !== idx && r.userId === person.id)}
                    >
                      {labelFor(person.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CurrencyAmountInput
                value={row.amount}
                onChange={(val) => update(idx, { amount: val })}
                currency={amountCurrency}
                displayCurrency={amountCurrency}
                rates={rates}
                ratesBase={ratesBase}
                placeholder="Amount"
                min="0"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="self-end sm:self-auto"
                onClick={() => remove(idx)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function FundingSourcesEditor({
  rows,
  families,
  excludeFamilyId,
  displayCurrency,
  rates,
  ratesBase,
  onChange,
}: {
  rows: FundingSourceRow[]
  families: FundingFamilyOption[]
  /** Current family page — excluded from the dropdown. */
  excludeFamilyId?: string
  displayCurrency?: string
  rates?: Record<string, number>
  ratesBase?: string
  onChange: (rows: FundingSourceRow[]) => void
}) {
  const selectableFamilies = families.filter((f) => f.id !== excludeFamilyId)

  const update = (idx: number, patch: Partial<FundingSourceRow>) => {
    onChange(rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  }

  const remove = (idx: number) => {
    onChange(rows.filter((_, i) => i !== idx))
  }

  const add = () => {
    const used = new Set(rows.map((r) => r.familyId))
    const next = selectableFamilies.find((f) => !used.has(f.id))
    if (!next) return
    onChange([...rows, { familyId: next.id, amount: '' }])
  }

  const amountCurrency = displayCurrency || getDisplayCurrency()

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label>Other family splits</Label>
          <p className="text-xs text-muted-foreground">
            Allocate amounts to your other families (this family is entered above).
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 self-start"
          onClick={add}
          disabled={selectableFamilies.length === 0 || rows.length >= selectableFamilies.length}
        >
          <PlusIcon className="size-3.5" />
          Add family
        </Button>
      </div>

      {selectableFamilies.length === 0 ? (
        <p className="text-xs text-muted-foreground">You only belong to this family.</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Optional — add other families to split across.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div
              key={`${idx}-${row.familyId}`}
              className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_minmax(0,9rem)_auto]"
            >
              <Select value={row.familyId} onValueChange={(value) => update(idx, { familyId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select family" />
                </SelectTrigger>
                <SelectContent>
                  {selectableFamilies.map((family) => (
                    <SelectItem
                      key={family.id}
                      value={family.id}
                      disabled={rows.some((r, i) => i !== idx && r.familyId === family.id)}
                    >
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CurrencyAmountInput
                value={row.amount}
                onChange={(val) => update(idx, { amount: val })}
                currency={amountCurrency}
                displayCurrency={amountCurrency}
                rates={rates}
                ratesBase={ratesBase}
                placeholder="Amount"
                min="0"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="self-end sm:self-auto"
                onClick={() => remove(idx)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
