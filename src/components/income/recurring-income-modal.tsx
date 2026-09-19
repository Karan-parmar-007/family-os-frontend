import { useEffect, useMemo, useState } from 'react'
import { Loader2Icon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { LetEveryoneEditSection } from '#/components/forms/let-everyone-edit-section'
import { FormWizardProgress } from '#/components/forms/form-wizard-progress'
import {
  PersonalFundingSourcesEditor,
  type FundingPersonOption,
} from '#/components/forms/funding-sources-editor'
import {
  appendRecurringDocumentToFormData,
  RecurringDocumentFields,
} from '#/components/forms/recurring-document-fields'
import { activePersonalRows, canEnableEveryoneEdit, type PersonalFundingRow } from '#/lib/forms/allocation'
import { useCreateIncomeCategory, useIncomeCategories } from '#/hooks/api/familyos/use-income'
import { useActiveFriends } from '#/hooks/api/familyos/use-friends'
import type { RecurringIncomeDetail } from '#/lib/api'

type FamilySplitRow = { family_id: string; split_name: string; amount: string }
type Variant = 'simple' | 'full'

const FREQ_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  WEEKLY: 'Weekly',
  DAILY: 'Daily',
  YEARLY: 'Yearly',
  QUARTERLY: 'Quarterly',
}

const RECURRING_WIZARD_STEPS = ['Basics', 'Allocation', 'Schedule & privacy'] as const

export function RecurringIncomeModal({
  isOpen,
  existing,
  families,
  members = [],
  variant = 'full',
  contextFamilyId,
  contextFamilyName,
  currentUserId,
  onClose,
  onCreate,
  onUpdate,
  isPending,
}: {
  isOpen: boolean
  existing: RecurringIncomeDetail | null
  families: { id: string; name: string }[]
  members?: { id?: string; name?: string }[]
  /** simple = this family + personal only; full = multi-family split editor */
  variant?: Variant
  contextFamilyId?: string
  contextFamilyName?: string
  currentUserId?: string
  onClose: () => void
  onCreate: (fd: FormData) => void
  onUpdate: (id: string, fd: FormData) => void
  isPending: boolean
}) {
  const isSimple = variant === 'simple'
  const useMultiPersonal = !!currentUserId
  const [step, setStep] = useState(0)

  const [form, setForm] = useState({
    income_name: '',
    total_amount: '',
    personal_savings_amount: '',
    family_amount: '',
    received_every: '',
    custom_days: '',
    custom_months: '',
    custom_years: '',
    next_receiving_date: '',
    frequency_mode: 'preset' as 'preset' | 'custom',
    show_docs_to_all: false,
    repeat_doc_with_logs: true,
    doc_viewer_user_ids: [] as string[],
    let_everyone_edit: false,
  })
  const [file, setFile] = useState<File | null>(null)
  const [splits, setSplits] = useState<FamilySplitRow[]>([])
  const [personalRows, setPersonalRows] = useState<PersonalFundingRow[]>([])
  const [showIntervalConfirm, setShowIntervalConfirm] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [isCreatingCat, setIsCreatingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  const categoryFamilyId = contextFamilyId || families[0]?.id || ''
  const { data: categoriesData } = useIncomeCategories(categoryFamilyId)
  const createCategoryMutation = useCreateIncomeCategory(categoryFamilyId)
  const { data: friendsData } = useActiveFriends()

  const personOptions = useMemo((): FundingPersonOption[] => {
    const map = new Map<string, FundingPersonOption>()
    if (currentUserId) {
      map.set(currentUserId, { id: currentUserId, name: 'You', kind: 'self' })
    }
    for (const member of members) {
      if (member.id && member.name && member.id !== currentUserId) {
        map.set(member.id, { id: member.id, name: member.name, kind: 'member' })
      }
    }
    for (const friend of friendsData?.items ?? []) {
      if (!map.has(friend.id)) {
        map.set(friend.id, { id: friend.id, name: friend.name, kind: 'friend' })
      }
    }
    return [...map.values()]
  }, [members, friendsData?.items, currentUserId])

  const recurrenceChanged = existing
    ? (() => {
        const origDate = existing.next_receiving_date?.split('T')[0] ?? ''
        const origPreset = existing.received_every ?? ''
        const origDays = existing.repeat_interval_days ? String(existing.repeat_interval_days) : ''
        const origMonths = existing.repeat_interval_months ? String(existing.repeat_interval_months) : ''
        const origYears = existing.repeat_interval_years ? String(existing.repeat_interval_years) : ''
        const origMode = origDays || origMonths || origYears ? 'custom' : 'preset'
        if (form.frequency_mode !== origMode) return true
        if (form.next_receiving_date !== origDate) return true
        if (form.frequency_mode === 'preset') return form.received_every !== origPreset
        return (
          form.custom_days !== origDays ||
          form.custom_months !== origMonths ||
          form.custom_years !== origYears
        )
      })()
    : false

  useEffect(() => {
    if (!isOpen) {
      setStep(0)
      setFile(null)
      return
    }
    if (existing) {
      const contextSplit = contextFamilyId
        ? existing.family_splits.find((s) => s.family_id === contextFamilyId)
        : existing.family_splits[0]

      setForm({
        income_name: existing.income_name,
        total_amount: String(existing.total_amount),
        personal_savings_amount: existing.personal_savings_amount ? String(existing.personal_savings_amount) : '',
        family_amount: contextSplit ? String(contextSplit.amount) : '',
        received_every: existing.received_every ?? '',
        custom_days: existing.repeat_interval_days ? String(existing.repeat_interval_days) : '',
        custom_months: existing.repeat_interval_months ? String(existing.repeat_interval_months) : '',
        custom_years: existing.repeat_interval_years ? String(existing.repeat_interval_years) : '',
        next_receiving_date: existing.next_receiving_date?.split('T')[0] ?? '',
        frequency_mode:
          existing.repeat_interval_days || existing.repeat_interval_months || existing.repeat_interval_years
            ? 'custom'
            : 'preset',
        show_docs_to_all: existing.show_docs_to_all,
        repeat_doc_with_logs: existing.repeat_doc_with_logs,
        doc_viewer_user_ids: existing.doc_viewer_user_ids ?? [],
        let_everyone_edit: existing.let_everyone_edit ?? false,
      })
      setFile(null)
      setSplits(
        existing.family_splits.map((s) => ({
          family_id: s.family_id,
          split_name: s.split_name,
          amount: String(s.amount),
        })),
      )
      setSelectedCategoryId(existing.category_id || '')
      setIsCreatingCat(false)
      setNewCatName('')
      if (existing.personal_splits?.length) {
        setPersonalRows(
          existing.personal_splits.map((s) => ({
            userId: s.user_id,
            amount: String(s.amount),
          })),
        )
      } else if (existing.personal_savings_amount) {
        const userId = currentUserId || existing.user_id
        setPersonalRows(
          userId ? [{ userId, amount: String(existing.personal_savings_amount) }] : [],
        )
      } else {
        setPersonalRows([])
      }
    } else {
      setForm({
        income_name: '',
        total_amount: '',
        personal_savings_amount: '',
        family_amount: '',
        received_every: '',
        custom_days: '',
        custom_months: '',
        custom_years: '',
        next_receiving_date: '',
        frequency_mode: 'preset',
        show_docs_to_all: false,
        repeat_doc_with_logs: true,
        doc_viewer_user_ids: [],
        let_everyone_edit: false,
      })
      setFile(null)
      setSplits([])
      setSelectedCategoryId('')
      setIsCreatingCat(false)
      setNewCatName('')
      setPersonalRows(currentUserId ? [{ userId: currentUserId, amount: '' }] : [])
    }
  }, [existing, isOpen, contextFamilyId, currentUserId])

  const total = Number(form.total_amount) || 0
  const personal = Number(form.personal_savings_amount) || 0
  const activePersonal = activePersonalRows(personalRows)
  const personalFromRows = useMultiPersonal
    ? activePersonal.reduce((acc, row) => acc + (Number(row.amount) || 0), 0)
    : personal
  const splitSum = splits.reduce((acc, s) => acc + (Number(s.amount) || 0), 0)
  const activeFamilySplitCount = isSimple
    ? 1
    : splits.filter((s) => Number(s.amount) > 0).length || splits.length

  const everyoneEditAllowed = canEnableEveryoneEdit({
    personalAmount: personalFromRows,
    familySplitCount: activeFamilySplitCount,
  })

  useEffect(() => {
    if (!everyoneEditAllowed && form.let_everyone_edit) {
      setForm((f) => ({ ...f, let_everyone_edit: false }))
    }
  }, [everyoneEditAllowed, form.let_everyone_edit])

  const noExplicitSimpleSplit =
    isSimple && form.family_amount === '' && personalFromRows === 0

  const simpleFamilyAmount = (() => {
    if (!isSimple) return 0
    if (noExplicitSimpleSplit) return total
    if (form.family_amount !== '') return Number(form.family_amount) || 0
    return Math.max(0, total - personalFromRows)
  })()

  const allocationOk = useMemo(() => {
    if (total <= 0) return false
    if (isSimple) {
      if (noExplicitSimpleSplit) return true
      return simpleFamilyAmount + personalFromRows === total
    }
    return personalFromRows + splitSum === total
  }, [
    total,
    personalFromRows,
    splitSum,
    isSimple,
    noExplicitSimpleSplit,
    simpleFamilyAmount,
  ])

  const handleTotalAmountChange = (val: string) => {
    const nextTotal = Number(val) || 0
    const family = Number(form.family_amount) || 0

    if (useMultiPersonal) {
      setForm({ ...form, total_amount: val })
      return
    }
    const pers = Number(form.personal_savings_amount) || 0
    if (form.family_amount && !form.personal_savings_amount) {
      setForm({ ...form, total_amount: val, personal_savings_amount: String(Math.max(0, nextTotal - family)) })
    } else if (form.personal_savings_amount && !form.family_amount) {
      setForm({ ...form, total_amount: val, family_amount: String(Math.max(0, nextTotal - pers)) })
    } else if (form.family_amount && form.personal_savings_amount) {
      setForm({ ...form, total_amount: val, personal_savings_amount: String(Math.max(0, nextTotal - family)) })
    } else {
      setForm({ ...form, total_amount: val })
    }
  }

  const handleFamilyAmountChange = (val: string) => {
    setForm({
      ...form,
      family_amount: val,
      ...(useMultiPersonal
        ? {}
        : {
            personal_savings_amount: val
              ? String(Math.max(0, (Number(form.total_amount) || 0) - (Number(val) || 0)))
              : '',
          }),
    })
  }

  const handlePersonalAmountChange = (val: string) => {
    const nextTotal = Number(form.total_amount) || 0
    const pers = Number(val) || 0
    setForm({
      ...form,
      personal_savings_amount: val,
      family_amount: val ? String(Math.max(0, nextTotal - pers)) : '',
    })
  }

  const addSplit = () => {
    const used = new Set(splits.map((s) => s.family_id))
    const next = families.find((f) => !used.has(f.id))
    if (!next) return
    setSplits([...splits, { family_id: next.id, split_name: form.income_name || next.name, amount: '' }])
  }

  const buildFamilySplitsPayload = () => {
    if (isSimple) {
      const targetId = contextFamilyId ?? existing?.family_splits[0]?.family_id
      if (!targetId) return []
      const familyAmt = simpleFamilyAmount
      if (existing) {
        return existing.family_splits.map((s) => ({
          family_id: s.family_id,
          split_name: s.split_name || form.income_name,
          amount: s.family_id === targetId ? familyAmt : s.amount,
        })).filter((s) => Number(s.amount) > 0)
      }
      return familyAmt > 0
        ? [{ family_id: targetId, split_name: form.income_name || contextFamilyName || 'Family', amount: familyAmt }]
        : []
    }
    return splits
      .filter((s) => Number(s.amount) > 0)
      .map((s) => ({
        family_id: s.family_id,
        split_name: s.split_name || form.income_name,
        amount: Number(s.amount),
      }))
  }

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('income_name', form.income_name)
    fd.append('total_amount', form.total_amount)

    const active = useMultiPersonal ? activePersonal : []
    const personalSum = useMultiPersonal ? personalFromRows : Number(form.personal_savings_amount) || 0

    if (isSimple) {
      // Quick-add create fields
      if (!noExplicitSimpleSplit) {
        fd.append('family_amount', String(simpleFamilyAmount))
        if (personalSum > 0) fd.append('personal_savings_amount', String(personalSum))
      } else if (existing) {
        // Clear personal on update when total-only
        fd.append('personal_savings_amount', '0')
      }
    } else if (personalSum > 0) {
      fd.append('personal_savings_amount', String(personalSum))
    } else if (existing) {
      fd.append('personal_savings_amount', '0')
    }

    if (useMultiPersonal) {
      // Always send on update so clearing personal rows replaces old splits
      if (existing || active.length > 0) {
        fd.append(
          'personal_splits',
          JSON.stringify(active.map((row) => ({ user_id: row.userId, amount: Number(row.amount) }))),
        )
      }
    }

    fd.append('family_splits', JSON.stringify(buildFamilySplitsPayload()))
    if (form.frequency_mode === 'preset') {
      fd.append('received_every', form.received_every)
    } else {
      if (form.custom_days) fd.append('repeat_interval_days', form.custom_days)
      if (form.custom_months) fd.append('repeat_interval_months', form.custom_months)
      if (form.custom_years) fd.append('repeat_interval_years', form.custom_years)
    }
    fd.append('next_receiving_date', form.next_receiving_date)
    appendRecurringDocumentToFormData(fd, {
      file,
      showDocsToAll: form.show_docs_to_all,
      repeatDocWithLogs: form.repeat_doc_with_logs,
      docViewerUserIds: form.doc_viewer_user_ids,
    })
    if (isSimple) {
      fd.append('let_everyone_edit', String(form.let_everyone_edit))
    }
    if (selectedCategoryId) {
      fd.append('category_id', selectedCategoryId)
    }
    return fd
  }

  const submit = () => {
    if (!allocationOk) {
      toast.error(
        isSimple
          ? 'Family and personal amounts must add up to the total (or leave blank for all to family).'
          : 'Allocate the full total across personal and family splits.',
      )
      return
    }
    if (existing && recurrenceChanged) {
      setShowIntervalConfirm(true)
      return
    }
    const fd = buildFormData()
    if (existing) onUpdate(existing.id, fd)
    else onCreate(fd)
  }

  const confirmSubmit = () => {
    setShowIntervalConfirm(false)
    if (!existing) return
    onUpdate(existing.id, buildFormData())
  }

  const familyLabel = contextFamilyName ? `To ${contextFamilyName}` : 'To this family'

  const goNext = () => {
    if (step === 0 && !form.income_name.trim()) {
      toast.error('Enter an income name before continuing')
      return
    }
    if (step === 1 && !allocationOk) {
      toast.error(
        isSimple
          ? 'Family and personal amounts must add up to the total (or leave blank for all to family).'
          : 'Allocate the full total across personal and family splits.',
      )
      return
    }
    setStep((s) => Math.min(RECURRING_WIZARD_STEPS.length - 1, s + 1))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit recurring income' : 'Add recurring income'}</DialogTitle>
          <DialogDescription>
            {isSimple
              ? 'Update this income for this family and your personal savings.'
              : 'Split your income across any families you belong to, plus personal savings.'}
          </DialogDescription>
        </DialogHeader>
        <FormWizardProgress steps={RECURRING_WIZARD_STEPS} currentStep={step} />

        <div className="space-y-4">
          {step === 0 && (
            <>
          <div>
            <Label>Income name *</Label>
            <Input value={form.income_name} onChange={(e) => setForm({ ...form, income_name: e.target.value })} />
          </div>

          {categoryFamilyId && (
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={selectedCategoryId}
                onValueChange={(val) => {
                  if (val === 'NEW') {
                    setIsCreatingCat(true)
                  } else {
                    setSelectedCategoryId(val)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category (defaults to Other)" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesData?.items.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.categoryName}
                    </SelectItem>
                  ))}
                  <SelectItem value="NEW" className="text-brand font-medium">
                    + Create new category...
                  </SelectItem>
                </SelectContent>
              </Select>
              {isCreatingCat && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-2">
                  <Input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      if (!newCatName.trim()) return
                      try {
                        const res = await createCategoryMutation.mutateAsync(newCatName.trim())
                        setSelectedCategoryId(res.id)
                        setNewCatName('')
                        setIsCreatingCat(false)
                        toast.success('Category created')
                      } catch {
                        toast.error('Failed to create category')
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreatingCat(false)
                      setNewCatName('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}

          <div>
            <Label>Total amount *</Label>
            <Input
              type="number"
              value={form.total_amount}
              onChange={(e) => (isSimple ? handleTotalAmountChange(e.target.value) : setForm({ ...form, total_amount: e.target.value }))}
            />
          </div>
            </>
          )}

          {step === 1 && (
            <>
          {isSimple ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>{familyLabel}</Label>
                <Input
                  type="number"
                  value={form.family_amount}
                  onChange={(e) => handleFamilyAmountChange(e.target.value)}
                  placeholder="Optional"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank (and no personal rows) to put the full total in this family.
                </p>
              </div>
              {useMultiPersonal && currentUserId ? (
                <PersonalFundingSourcesEditor
                  rows={personalRows}
                  people={personOptions}
                  currentUserId={currentUserId}
                  onChange={setPersonalRows}
                />
              ) : (
                <div className="space-y-1">
                  <Label>Personal savings</Label>
                  <Input
                    type="number"
                    value={form.personal_savings_amount}
                    onChange={(e) => handlePersonalAmountChange(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              )}
              <p className={`text-xs ${allocationOk ? 'text-positive' : 'text-destructive'}`}>
                {noExplicitSimpleSplit
                  ? 'Entire amount goes to family savings.'
                  : `Allocated: ${simpleFamilyAmount + personalFromRows} of ${total || '—'}`}
              </p>
            </div>
          ) : (
            <>
              {useMultiPersonal && currentUserId ? (
                <PersonalFundingSourcesEditor
                  rows={personalRows}
                  people={personOptions}
                  currentUserId={currentUserId}
                  onChange={setPersonalRows}
                />
              ) : (
                <div>
                  <Label>Personal savings</Label>
                  <Input
                    type="number"
                    value={form.personal_savings_amount}
                    onChange={(e) => setForm({ ...form, personal_savings_amount: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Split into families</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSplit}>+ Add family</Button>
                </div>
                {splits.map((split, idx) => (
                  <div key={split.family_id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Select
                      value={split.family_id}
                      onValueChange={(v) => {
                        const next = [...splits]
                        next[idx] = {
                          ...next[idx],
                          family_id: v,
                          split_name: families.find((f) => f.id === v)?.name ?? split.split_name,
                        }
                        setSplits(next)
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {families.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={split.amount}
                      onChange={(e) => {
                        const next = [...splits]
                        next[idx] = { ...next[idx], amount: e.target.value }
                        setSplits(next)
                      }}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setSplits(splits.filter((_, i) => i !== idx))}>
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {!isSimple && (
            <p className={`text-xs ${allocationOk ? 'text-positive' : 'text-destructive'}`}>
              Allocated: {personalFromRows + splitSum} of {total || '—'}
            </p>
          )}
            </>
          )}

          {step === 2 && (
            <>
          <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/10">
            <p className="text-sm font-medium">How often does this repeat? *</p>
            <Select
              value={form.frequency_mode}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  frequency_mode: v as 'preset' | 'custom',
                  received_every: v === 'custom' ? '' : form.received_every,
                })
              }
            >
              <SelectTrigger><SelectValue placeholder="Choose schedule type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="preset">Common schedule</SelectItem>
                <SelectItem value="custom">Custom schedule</SelectItem>
              </SelectContent>
            </Select>
            {form.frequency_mode === 'preset' ? (
              <Select value={form.received_every} onValueChange={(v) => setForm({ ...form, received_every: v })}>
                <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQ_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Enter at least one — years, months, or days. You can combine them.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" placeholder="Years" value={form.custom_years} onChange={(e) => setForm({ ...form, custom_years: e.target.value })} />
                  <Input type="number" placeholder="Months" value={form.custom_months} onChange={(e) => setForm({ ...form, custom_months: e.target.value })} />
                  <Input type="number" placeholder="Days" value={form.custom_days} onChange={(e) => setForm({ ...form, custom_days: e.target.value })} />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label>Next receiving date *</Label>
              <Input type="date" value={form.next_receiving_date} onChange={(e) => setForm({ ...form, next_receiving_date: e.target.value })} />
              <p className="text-xs text-muted-foreground">
                When you expect the next payment — used to schedule the next automatic entry.
              </p>
            </div>
          </div>

          <RecurringDocumentFields
            file={file}
            onFileChange={setFile}
            existingDocumentId={existing?.document_id}
            form={{
              show_docs_to_all: form.show_docs_to_all,
              repeat_doc_with_logs: form.repeat_doc_with_logs,
              doc_viewer_user_ids: form.doc_viewer_user_ids,
            }}
            onFormChange={(patch) => setForm({ ...form, ...patch })}
            members={members}
            entryNoun="income"
          />

          {isSimple && (
            <LetEveryoneEditSection
              allowed={everyoneEditAllowed}
              checked={form.let_everyone_edit}
              onCheckedChange={(v) => setForm({ ...form, let_everyone_edit: v })}
              allowedDescription="Allow any family member to update this recurring income."
              disallowedDescription="Not available when personal savings or multiple family splits are included."
            />
          )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>
          )}
          {step < RECURRING_WIZARD_STEPS.length - 1 ? (
            <Button onClick={goNext}>Next</Button>
          ) : (
            <Button onClick={submit} disabled={isPending || !allocationOk}>
              {isPending ? <Loader2Icon className="size-4 animate-spin" /> : existing ? 'Save changes' : 'Create'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      <Dialog open={showIntervalConfirm} onOpenChange={setShowIntervalConfirm}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update schedule?</DialogTitle>
            <DialogDescription>
              Changing the repeat interval or next receiving date will reschedule the next automatic
              income entry. Any pending confirmation for the current period may be replaced.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIntervalConfirm(false)}>Go back</Button>
            <Button onClick={confirmSubmit} disabled={isPending}>
              {isPending ? <Loader2Icon className="size-4 animate-spin" /> : 'Update schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
