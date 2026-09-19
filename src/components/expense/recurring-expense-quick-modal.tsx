import { useEffect, useState } from 'react'
import { FileTextIcon, Loader2Icon, UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { canEnableEveryoneEdit } from '#/lib/forms/allocation'
import { LetEveryoneEditSection } from '#/components/forms/let-everyone-edit-section'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { useCreateExpenseCategory, useExpenseCategories } from '#/hooks/api/familyos/use-expenses'

type FrequencyMode = 'preset' | 'custom'

const FREQ_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  WEEKLY: 'Weekly',
  DAILY: 'Daily',
  YEARLY: 'Yearly',
  QUARTERLY: 'Quarterly',
}

export function RecurringExpenseQuickModal({
  isOpen,
  familyId,
  members,
  onCreate,
  isPending,
  onClose,
}: {
  isOpen: boolean
  familyId: string
  members: { id?: string; name?: string }[]
  onCreate: (fd: FormData) => void
  isPending: boolean
  onClose: () => void
}) {
  const [form, setForm] = useState({
    expense_name: '',
    total_amount: '',
    family_amount: '',
    personal_savings_amount: '',
    frequency_mode: 'preset' as FrequencyMode,
    paid_every: '',
    custom_interval_days: '',
    custom_interval_months: '',
    custom_interval_years: '',
    next_payment_date: '',
    show_docs_to_all: false,
    repeat_doc_with_logs: true,
    doc_viewer_user_ids: [] as string[],
    let_everyone_edit: false,
  })
  const [file, setFile] = useState<File | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [isCreatingCat, setIsCreatingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const { data: categoriesData } = useExpenseCategories(familyId)
  const createCategoryMutation = useCreateExpenseCategory(familyId)

  useEffect(() => {
    if (!isOpen) return
    setForm({
      expense_name: '',
      total_amount: '',
      family_amount: '',
      personal_savings_amount: '',
      frequency_mode: 'preset',
      paid_every: '',
      custom_interval_days: '',
      custom_interval_months: '',
      custom_interval_years: '',
      next_payment_date: '',
      show_docs_to_all: false,
      repeat_doc_with_logs: true,
      doc_viewer_user_ids: [],
      let_everyone_edit: false,
    })
    setFile(null)
    setSelectedCategoryId('')
    setIsCreatingCat(false)
    setNewCatName('')
  }, [isOpen])

  const personalAmount = Number(form.personal_savings_amount) || 0
  const everyoneEditAllowed = canEnableEveryoneEdit({
    personalAmount,
    familySplitCount: 1,
  })

  useEffect(() => {
    if (!everyoneEditAllowed && form.let_everyone_edit) {
      setForm((f) => ({ ...f, let_everyone_edit: false }))
    }
  }, [everyoneEditAllowed, form.let_everyone_edit])

  const isSplitting = form.family_amount !== '' || form.personal_savings_amount !== ''

  const handleTotalAmountChange = (val: string) => {
    const total = Number(val) || 0
    const family = Number(form.family_amount) || 0
    const personal = Number(form.personal_savings_amount) || 0

    if (form.family_amount && !form.personal_savings_amount) {
      setForm({
        ...form,
        total_amount: val,
        personal_savings_amount: String(Math.max(0, total - family)),
      })
    } else if (form.personal_savings_amount && !form.family_amount) {
      setForm({
        ...form,
        total_amount: val,
        family_amount: String(Math.max(0, total - personal)),
      })
    } else if (form.family_amount && form.personal_savings_amount) {
      setForm({
        ...form,
        total_amount: val,
        personal_savings_amount: String(Math.max(0, total - family)),
      })
    } else {
      setForm({ ...form, total_amount: val })
    }
  }

  const handleFamilyAmountChange = (val: string) => {
    const total = Number(form.total_amount) || 0
    const family = Number(val) || 0
    const personal = Math.max(0, total - family)
    setForm({
      ...form,
      family_amount: val,
      personal_savings_amount: val ? String(personal) : '',
    })
  }

  const handlePersonalAmountChange = (val: string) => {
    const total = Number(form.total_amount) || 0
    const personal = Number(val) || 0
    const family = Math.max(0, total - personal)
    setForm({
      ...form,
      personal_savings_amount: val,
      family_amount: val ? String(family) : '',
    })
  }

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('expense_name', form.expense_name)
    fd.append('total_amount', form.total_amount)
    if (isSplitting) {
      if (form.family_amount) fd.append('family_amount', form.family_amount)
      if (form.personal_savings_amount) fd.append('personal_savings_amount', form.personal_savings_amount)
    }
    if (form.frequency_mode === 'preset') {
      fd.append('paid_every', form.paid_every || '')
    } else {
      if (form.custom_interval_days) fd.append('repeat_interval_days', form.custom_interval_days)
      if (form.custom_interval_months) fd.append('repeat_interval_months', form.custom_interval_months)
      if (form.custom_interval_years) fd.append('repeat_interval_years', form.custom_interval_years)
    }
    fd.append('next_payment_date', form.next_payment_date)
    fd.append('show_docs_to_all', String(form.show_docs_to_all))
    fd.append('repeat_doc_with_logs', String(form.repeat_doc_with_logs))
    fd.append('let_everyone_edit', String(form.let_everyone_edit))
    if (!form.show_docs_to_all && form.doc_viewer_user_ids.length > 0) {
      fd.append('doc_viewer_user_ids', form.doc_viewer_user_ids.join(','))
    }
    if (file) fd.append('document', file)
    if (selectedCategoryId) fd.append('category_id', selectedCategoryId)
    return fd
  }

  const handleSubmit = () => {
    const total = Number(form.total_amount) || 0
    if (!form.expense_name.trim()) {
      toast.error('Please enter an expense name.')
      return
    }
    if (total <= 0) {
      toast.error('Please enter the total amount.')
      return
    }
    if (!form.next_payment_date) {
      toast.error('Please choose when you expect to receive this expense next.')
      return
    }
    if (form.frequency_mode === 'preset' && !form.paid_every) {
      toast.error('Please select how often this expense repeats.')
      return
    }
    if (form.frequency_mode === 'custom') {
      const hasInterval =
        Number(form.custom_interval_days) > 0 ||
        Number(form.custom_interval_months) > 0 ||
        Number(form.custom_interval_years) > 0
      if (!hasInterval) {
        toast.error('For a custom schedule, enter at least one of years, months, or days.')
        return
      }
    }

    if (isSplitting) {
      const family = form.family_amount ? Number(form.family_amount) : null
      const personal = form.personal_savings_amount ? Number(form.personal_savings_amount) : null
      const fa = family ?? 0
      const pa = personal ?? 0
      if (fa <= 0 || pa <= 0) {
        toast.error('When splitting expense, both family and personal amounts must be greater than zero.')
        return
      }
      if (fa + pa !== total) {
        toast.error('Family and personal amounts must add up to the total amount.')
        return
      }
    }

    onCreate(buildFormData())
  }

  const canSubmit =
    !!form.expense_name &&
    Number(form.total_amount) > 0 &&
    !!form.next_payment_date &&
    (form.frequency_mode === 'preset' ? !!form.paid_every : true)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add recurring expense</DialogTitle>
          <DialogDescription>
            Set up expense you receive on a regular schedule for this family.
            To split across multiple families, use <span className="font-medium">Personal → Expense</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/5 p-3">
            <UserIcon className="mt-0.5 size-4 shrink-0 text-brand" />
            <div>
              <p className="text-sm font-medium">Your expense only</p>
              <p className="text-xs text-muted-foreground">
                Recurring expense must be added by the person who spends it.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Expense name *</Label>
            <Input
              value={form.expense_name}
              onChange={(e) => setForm({ ...form, expense_name: e.target.value })}
              placeholder="e.g. Monthly rent"
            />
          </div>

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

          <div className="space-y-1">
            <Label>Total amount *</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={form.total_amount}
              onChange={(e) => handleTotalAmountChange(e.target.value)}
              placeholder="e.g. 80000"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Amount to family</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.family_amount}
                onChange={(e) => handleFamilyAmountChange(e.target.value)}
                placeholder="Optional"
              />
              <p className="text-xs text-muted-foreground">Leave blank to deduct the full amount to this family.</p>
            </div>
            <div className="space-y-1">
              <Label>Personal savings</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.personal_savings_amount}
                onChange={(e) => handlePersonalAmountChange(e.target.value)}
                placeholder="Auto-filled when splitting"
              />
              <p className="text-xs text-muted-foreground">
                Fills automatically from total − family (or vice versa).
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/10">
            <p className="text-sm font-medium">How often does this repeat? *</p>
            <Select
              value={form.frequency_mode}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  frequency_mode: v as FrequencyMode,
                  paid_every: v === 'custom' ? '' : form.paid_every,
                  custom_interval_days: v === 'preset' ? '' : form.custom_interval_days,
                  custom_interval_months: v === 'preset' ? '' : form.custom_interval_months,
                  custom_interval_years: v === 'preset' ? '' : form.custom_interval_years,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose schedule type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preset">Common schedule (daily, weekly, monthly…)</SelectItem>
                <SelectItem value="custom">Custom schedule</SelectItem>
              </SelectContent>
            </Select>

            {form.frequency_mode === 'preset' ? (
              <div className="space-y-1">
                <Label>Frequency</Label>
                <Select
                  value={form.paid_every}
                  onValueChange={(v) => setForm({ ...form, paid_every: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQ_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Enter at least one — years, months, or days. You can combine them (e.g. 1 month and 6 days).
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Years</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.custom_interval_years}
                      onChange={(e) => setForm({ ...form, custom_interval_years: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Months</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.custom_interval_months}
                      onChange={(e) => setForm({ ...form, custom_interval_months: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Days</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.custom_interval_days}
                      onChange={(e) => setForm({ ...form, custom_interval_days: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1 pt-1">
              <Label>Next receiving date *</Label>
              <Input
                type="date"
                value={form.next_payment_date}
                onChange={(e) => setForm({ ...form, next_payment_date: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                When do you expect the next payment? We use this to schedule your first automatic expense entry
                and send you a confirmation reminder.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Supporting document</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Optional — e.g. payslip, offer letter, or invoice template.
            </p>
          </div>

          {file && (
            <div className="space-y-3 rounded-xl border border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Document settings
              </p>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Show document to all members</p>
                  <p className="text-xs text-muted-foreground">
                    When on, everyone in this family can view the attached document.
                  </p>
                </div>
                <Switch
                  checked={form.show_docs_to_all}
                  onCheckedChange={(v) => setForm({ ...form, show_docs_to_all: v })}
                />
              </div>

              {!form.show_docs_to_all && (
                <div className="space-y-2 border-t border-border/50 pt-2">
                  <Label className="text-xs text-muted-foreground">
                    Or limit access to specific members
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {members.map((m) => {
                      const checked = form.doc_viewer_user_ids.includes(m?.id || '')
                      return (
                        <label key={m?.id} className="flex cursor-pointer select-none items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const id = m?.id || ''
                              let next = [...form.doc_viewer_user_ids]
                              if (e.target.checked) {
                                if (!next.includes(id)) next.push(id)
                              } else {
                                next = next.filter((x) => x !== id)
                              }
                              setForm({ ...form, doc_viewer_user_ids: next })
                            }}
                            className="size-4 rounded border-border bg-background text-brand focus:ring-brand"
                          />
                          <span>{m?.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-2">
                <div>
                  <p className="text-sm font-medium">Attach to future payments</p>
                  <p className="text-xs text-muted-foreground">
                    When enabled, the same file is added to each automatic expense entry
                    (handy for a recurring bill or receipt).
                  </p>
                </div>
                <Switch
                  checked={form.repeat_doc_with_logs}
                  onCheckedChange={(v) => setForm({ ...form, repeat_doc_with_logs: v })}
                />
              </div>
              {form.repeat_doc_with_logs && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileTextIcon className="size-3" />
                  This document will be linked to this expense and reused on future entries.
                </p>
              )}
            </div>
          )}

          <LetEveryoneEditSection
            allowed={everyoneEditAllowed}
            checked={form.let_everyone_edit}
            onCheckedChange={(v) => setForm({ ...form, let_everyone_edit: v })}
            allowedDescription="When on, any family member can update this recurring expense from Manage recurring expense."
            disallowedDescription="Not available when personal savings are included."
          />
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending || !canSubmit}>
            {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Add recurring expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
