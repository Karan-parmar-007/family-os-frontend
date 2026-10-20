import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { FosModalOverlay } from '#/components/ui/fos-modal'
import { CategoryPicker } from '#/components/common/category-picker'
import { DocumentUploader } from '#/components/common/document-uploader'
import { FrequencySelector, toSchedule, type Schedule } from '#/components/common/frequency-selector'
import { LetEveryoneEditSection } from '#/components/forms/let-everyone-edit-section'
import {
  useMoneyMutations,
  type MoneyEvent,
  type MoneyKind,
  type MoneyParty,
  type MoneyRule,
  type MoneyScope,
} from '#/hooks/api/use-money'
import { inputToEndOfDayIso, inputToIso, isoToInput, todayInput } from '#/lib/dates'
import { cn } from '#/lib/utils'

export type EntryDialogMode =
  | { type: 'create' }
  | { type: 'rule'; rule: MoneyRule }
  | { type: 'event'; event: MoneyEvent }

type EndMode = 'never' | 'date' | 'count'

interface Member {
  id: string
  name?: string | null
  email?: string | null
}

const fieldClass =
  'mt-1.5 rounded-xl border-[#233554] bg-[#0a192f] text-[#ccd6f6] focus:border-[#64ffda]'

function partyKeys(parties: MoneyParty[] | undefined): string[] {
  const keys = (parties ?? []).map((p) => (p.partyType === 'FAMILY' ? 'FAMILY' : p.userId || ''))
  return keys.filter(Boolean).length ? keys.filter(Boolean) : ['FAMILY']
}

export function MoneyEntryDialog({
  mode,
  kind,
  scope,
  familyId,
  members,
  onClose,
}: {
  mode: EntryDialogMode
  kind: MoneyKind
  scope: MoneyScope
  familyId?: string
  members: Member[]
  onClose: () => void
}) {
  const isIncome = kind === 'INCOME'
  const rule = mode.type === 'rule' ? mode.rule : null
  const event = mode.type === 'event' ? mode.event : null
  const source = rule ?? event

  const [entryType, setEntryType] = useState<'event' | 'recurring'>(rule ? 'recurring' : 'event')
  const [name, setName] = useState(source?.name ?? '')
  const [amount, setAmount] = useState(source ? String(source.amount) : '')
  const [categoryId, setCategoryId] = useState<string | null>(source?.categoryId ?? null)
  const [documentId, setDocumentId] = useState<string | null>(source?.documentId ?? null)
  const [documentName, setDocumentName] = useState<string | null>(null)
  const [letEveryoneEdit, setLetEveryoneEdit] = useState(source?.letEveryoneEdit ?? true)
  const [parties, setParties] = useState<string[]>(partyKeys(source?.parties))
  const [occurredAt, setOccurredAt] = useState(event ? isoToInput(event.occurredAt) : todayInput())
  const [schedule, setSchedule] = useState<Schedule>(toSchedule(rule?.frequency, rule?.everyN))
  const [nextRunAt, setNextRunAt] = useState(rule ? isoToInput(rule.nextRunAt) : todayInput())
  const [endMode, setEndMode] = useState<EndMode>(rule?.endAt ? 'date' : rule?.maxRuns ? 'count' : 'never')
  const [endAt, setEndAt] = useState(rule?.endAt ? isoToInput(rule.endAt) : '')
  const [maxRuns, setMaxRuns] = useState(rule?.maxRuns ? String(rule.maxRuns) : '12')

  const { createRule, updateRule, createEvent, updateEvent } = useMoneyMutations()
  const saving = createRule.isPending || updateRule.isPending || createEvent.isPending || updateEvent.isPending
  const isRecurring = entryType === 'recurring'

  const toggleParty = (key: string) =>
    setParties((prev) =>
      prev.includes(key) ? (prev.length === 1 ? prev : prev.filter((p) => p !== key)) : [...prev, key],
    )

  const partiesPayload = parties.map((p) =>
    p === 'FAMILY' ? { partyType: 'FAMILY' } : { partyType: 'MEMBER', userId: p },
  )

  const endPayload = () => ({
    endAt: endMode === 'date' && endAt ? inputToEndOfDayIso(endAt) : null,
    maxRuns: endMode === 'count' ? Math.max(1, parseInt(maxRuns, 10) || 1) : null,
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = Number(amount)
    if (!name.trim() || !Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Enter a name and an amount above zero')
      return
    }
    if (isRecurring && endMode === 'date' && endAt && endAt < nextRunAt) {
      toast.error('The end date must be on or after the first date')
      return
    }
    const common = {
      name: name.trim(),
      amount: parsed,
      categoryId,
      documentId,
      ...(scope === 'FAMILY' ? { letEveryoneEdit } : {}),
    }
    try {
      if (rule) {
        await updateRule.mutateAsync({
          id: rule.id,
          body: {
            ...common,
            frequency: schedule.frequency,
            everyN: schedule.everyN,
            ...(nextRunAt !== isoToInput(rule.nextRunAt) ? { nextRunAt: inputToIso(nextRunAt) } : {}),
            ...endPayload(),
            ...(scope === 'FAMILY' ? { parties: partiesPayload } : {}),
          },
        })
        toast.success('Recurring entry updated')
      } else if (event) {
        await updateEvent.mutateAsync({
          id: event.id,
          body: {
            ...common,
            ...(occurredAt !== isoToInput(event.occurredAt) ? { occurredAt: inputToIso(occurredAt) } : {}),
          },
        })
        toast.success('Entry updated')
      } else if (isRecurring) {
        await createRule.mutateAsync({
          ...common,
          scope,
          familyId: scope === 'FAMILY' ? familyId : null,
          kind,
          frequency: schedule.frequency,
          everyN: schedule.everyN,
          nextRunAt: inputToIso(nextRunAt),
          ...endPayload(),
          parties: scope === 'FAMILY' ? partiesPayload : [],
        })
        toast.success(`Recurring ${isIncome ? 'income' : 'expense'} added`)
      } else {
        await createEvent.mutateAsync({
          ...common,
          scope,
          familyId: scope === 'FAMILY' ? familyId : null,
          kind,
          occurredAt: inputToIso(occurredAt),
          parties: scope === 'FAMILY' ? partiesPayload : [],
        })
        toast.success(`${isIncome ? 'Income' : 'Expense'} recorded`)
      }
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save')
    }
  }

  const title = rule
    ? 'Edit recurring entry'
    : event
      ? 'Edit entry'
      : `Add ${isIncome ? 'income' : 'expense'}`

  return (
    <FosModalOverlay>
      <div className="my-auto w-full min-w-0 max-w-xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-2xl border border-[#233554]/90 bg-[#112240]/95 p-4 text-[#ccd6f6] shadow-[0_25px_60px_rgba(2,12,27,0.85)] ring-1 ring-white/5 sm:max-h-[88vh] sm:p-7">
        <div className="border-b border-[#233554]/60 pb-3">
          <h2 className="text-xl font-bold tracking-tight text-[#e6f1ff]">{title}</h2>
          {mode.type === 'create' && (
            <div className="mt-3.5 flex rounded-xl border border-[#233554] bg-[#0a192f] p-1">
              {(['event', 'recurring'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEntryType(t)}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-xs font-semibold transition',
                    entryType === t ? 'bg-[#64ffda] text-[#0a192f] shadow' : 'text-[#8892b0] hover:text-[#ccd6f6]',
                  )}
                >
                  {t === 'event' ? 'One-time' : 'Recurring'}
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-[#8892b0]">
            {isRecurring
              ? 'Posted automatically at 18:00 on each due date. Missed dates are caught up.'
              : 'Posted to the balance right away.'}
            {!isIncome && ' If the balance is too low it still posts, and an email goes to '}
            {!isIncome && (scope === 'FAMILY' ? 'the family head.' : 'you.')}
          </p>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <Label className="text-xs text-[#8892b0]">Name</Label>
            <Input
              placeholder={isIncome ? 'e.g. Salary, Dividends' : 'e.g. Rent, Groceries'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              maxLength={255}
              required
            />
          </div>

          <div>
            <Label className="text-xs text-[#8892b0]">Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(fieldClass, 'font-mono')}
              required
            />
          </div>

          <CategoryPicker
            scope={scope}
            categoryType={kind}
            familyId={familyId}
            value={categoryId}
            onSelect={(cat) => setCategoryId(cat?.id ?? null)}
            label="Category"
          />

          {scope === 'FAMILY' && mode.type !== 'event' && (
            <div>
              <Label className="text-xs text-[#8892b0]">{isIncome ? 'Earned by' : 'Used by'}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[{ id: 'FAMILY', label: 'Entire household' }, ...members.map((m) => ({ id: m.id, label: m.name || m.email || 'Member' }))].map(
                  (opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleParty(opt.id)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                        parties.includes(opt.id)
                          ? 'border-[#64ffda] bg-[#64ffda]/10 text-[#64ffda]'
                          : 'border-[#233554] bg-[#0a192f] text-[#8892b0] hover:text-[#ccd6f6]',
                      )}
                    >
                      {opt.label}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {isRecurring ? (
            <>
              <FrequencySelector value={schedule} onChange={setSchedule} />
              <div>
                <Label className="text-xs text-[#8892b0]">{rule ? 'Next date' : 'First date'}</Label>
                <Input
                  type="date"
                  value={nextRunAt}
                  onChange={(e) => setNextRunAt(e.target.value)}
                  className={fieldClass}
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-[#8892b0]">Ends</Label>
                <div className="mt-1.5 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
                  {(
                    [
                      ['never', 'Never'],
                      ['date', 'On a date'],
                      ['count', 'After N times'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEndMode(value)}
                      className={cn(
                        'rounded-lg border px-2 py-1.5 text-xs font-semibold transition',
                        endMode === value
                          ? 'border-[#64ffda] bg-[#64ffda]/10 text-[#64ffda]'
                          : 'border-[#233554] bg-[#0a192f] text-[#8892b0] hover:text-[#ccd6f6]',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {endMode === 'date' && (
                  <Input
                    type="date"
                    value={endAt}
                    min={nextRunAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className={fieldClass}
                    required
                  />
                )}
                {endMode === 'count' && (
                  <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      type="number"
                      min={1}
                      max={10000}
                      value={maxRuns}
                      onChange={(e) => setMaxRuns(e.target.value)}
                      className="h-10 w-full rounded-xl border-[#233554] bg-[#0a192f] text-[#ccd6f6] sm:w-28"
                    />
                    <span className="text-xs text-[#8892b0]">
                      times in total{rule ? ` (${rule.runCount} already posted)` : ''}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div>
              <Label className="text-xs text-[#8892b0]">Date</Label>
              <Input
                type="date"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className={fieldClass}
                required
              />
            </div>
          )}

          <DocumentUploader
            documentId={documentId}
            documentName={documentName}
            onDocumentChange={(id, docName) => {
              setDocumentId(id)
              setDocumentName(docName ?? null)
            }}
            familyId={familyId}
            isPersonal={scope === 'PERSONAL'}
            label={isIncome ? 'Payslip / proof' : 'Receipt / invoice'}
            hint="Optional attachment"
          />

          {scope === 'FAMILY' && (
            <LetEveryoneEditSection
              allowed
              checked={letEveryoneEdit}
              onCheckedChange={setLetEveryoneEdit}
              allowedDescription="On: any family member can change or delete it. Off: only you and the family head."
            />
          )}

          <div className="form-actions border-t border-[#233554]/60 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#233554] px-5 text-[#8892b0] hover:text-[#ccd6f6]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className={cn(
                'px-6 font-semibold shadow-md transition',
                isIncome ? 'bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90' : 'bg-[#f87171] text-[#0a192f] hover:bg-[#f87171]/90',
              )}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </FosModalOverlay>
  )
}
