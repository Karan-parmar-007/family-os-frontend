import { useEffect, useState } from 'react'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  FilterIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react'
import { BentoCard } from '#/components/bento/bento'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Skeleton } from '#/components/ui/skeleton'
import { Label } from '#/components/ui/label'
import { FormWizardProgress } from '#/components/forms/form-wizard-progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import {
  useMyExpenseLogs,
  useMyExpenseLogDetail,
  useCreateMyExpenseLog,
  useUpdateMyExpenseLog,
} from '#/hooks/api/use-expenses-recurring'
import { useExpenseCategories, useCreateExpenseCategory } from '#/hooks/api/use-expenses'
import {
  checkLogDocAccess,
  downloadLogDocument,
  viewLogDocument,
} from '#/lib/documents/log-document-actions'
import { formatCurrency } from '#/lib/format'
import { toast } from 'sonner'
import type { ExpenseLogsFilters, FamilySummary, PersonalExpenseLogListItem } from '#/lib/api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const SOURCE_COLORS: Record<string, string> = {
  MANUAL: 'bg-blue-500/10 text-blue-500',
  RECURRING: 'bg-brand/10 text-brand',
  FAMILY_EXPENSE_LOG: 'bg-emerald-500/10 text-emerald-600',
}

function sourceTypeLabel(sourceType: string) {
  if (sourceType === 'MANUAL') return 'Manual'
  if (sourceType === 'RECURRING') return 'Recurring'
  if (sourceType === 'FAMILY_EXPENSE_LOG') return 'Family split'
  return sourceType
}

type FamilyOption = Pick<FamilySummary, 'id' | 'name' | 'currency'>

export function PersonalExpenseLogsCard({
  families,
  currentUserId,
}: {
  families: FamilyOption[]
  currentUserId: string
}) {
  const [logsPage, setLogsPage] = useState(1)
  const [logsFilters, setLogsFilters] = useState<ExpenseLogsFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [showAddLog, setShowAddLog] = useState(false)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)

  const { data: logsData, isLoading: logsLoading } = useMyExpenseLogs({
    ...logsFilters,
    page: logsPage,
    page_size: 10,
  })
  const { data: editLogDetail, isLoading: editLogLoading } = useMyExpenseLogDetail(editingLogId)
  const createLog = useCreateMyExpenseLog()
  const updateLog = useUpdateMyExpenseLog()

  const format = (value: number) => formatCurrency(value)
  const categoryFamilyId = families[0]?.id ?? ''

  return (
    <>
      <PersonalExpenseLogsSection
        logsData={logsData}
        logsLoading={logsLoading}
        logsPage={logsPage}
        setLogsPage={setLogsPage}
        logsFilters={logsFilters}
        setLogsFilters={setLogsFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        onAddLog={() => setShowAddLog(true)}
        onEditLog={setEditingLogId}
        format={format}
        currentUserId={currentUserId}
        categoryFamilyId={categoryFamilyId}
      />

      <PersonalExpenseLogModal
        isOpen={showAddLog}
        categoryFamilyId={categoryFamilyId}
        onClose={() => setShowAddLog(false)}
        isPending={createLog.isPending}
        onSubmit={(fd) =>
          createLog.mutate(fd, {
            onSuccess: () => {
              toast.success('Personal expense logged')
              setShowAddLog(false)
            },
            onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to add log'),
          })
        }
      />

      <PersonalExpenseLogModal
        isOpen={!!editingLogId}
        logDetail={editLogDetail ?? null}
        isLoadingDetail={editLogLoading}
        currentUserId={currentUserId}
        categoryFamilyId={categoryFamilyId}
        onClose={() => setEditingLogId(null)}
        isPending={updateLog.isPending}
        onSubmit={(fd) =>
          editingLogId &&
          updateLog.mutate(
            { logId: editingLogId, formData: fd },
            {
              onSuccess: () => {
                toast.success('Expense log updated')
                setEditingLogId(null)
              },
              onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to update log'),
            },
          )
        }
      />
    </>
  )
}

function PersonalExpenseLogsSection({
  logsData,
  logsLoading,
  logsPage,
  setLogsPage,
  logsFilters,
  setLogsFilters,
  showFilters,
  setShowFilters,
  onAddLog,
  onEditLog,
  format,
  currentUserId,
  categoryFamilyId,
}: {
  logsData: ReturnType<typeof useMyExpenseLogs>['data']
  logsLoading: boolean
  logsPage: number
  setLogsPage: (p: number) => void
  logsFilters: ExpenseLogsFilters
  setLogsFilters: (f: ExpenseLogsFilters) => void
  showFilters: boolean
  setShowFilters: (v: boolean) => void
  onAddLog: () => void
  onEditLog: (id: string) => void
  format: (v: number) => string
  currentUserId: string
  categoryFamilyId: string
}) {
  const [filterStart, setFilterStart] = useState(logsFilters.start_date ?? '')
  const [filterEnd, setFilterEnd] = useState(logsFilters.end_date ?? '')
  const [filterCategory, setFilterCategory] = useState(logsFilters.category_id ?? '')
  const { data: categoriesData } = useExpenseCategories(categoryFamilyId)

  const applyFilters = () => {
    setLogsFilters({
      ...(filterStart ? { start_date: filterStart } : {}),
      ...(filterEnd ? { end_date: filterEnd } : {}),
      ...(filterCategory ? { category_id: filterCategory } : {}),
    })
    setLogsPage(1)
  }

  const clearFilters = () => {
    setFilterStart('')
    setFilterEnd('')
    setFilterCategory('')
    setLogsFilters({})
    setLogsPage(1)
  }

  const hasActiveFilters = !!(logsFilters.start_date || logsFilters.end_date || logsFilters.category_id)

  return (
    <BentoCard colSpan={4}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-4 text-warning" />
          <p className="font-semibold">Personal expense logs</p>
          {logsData && <Badge variant="secondary">{logsData.total}</Badge>}
          {hasActiveFilters && (
            <Badge variant="outline" className="gap-1 text-xs">
              <FilterIcon className="size-2.5" />
              Filtered
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFilters(!showFilters)}>
            <FilterIcon className="size-3.5" />
            Filters
          </Button>
          <Button size="sm" className="gap-1.5" onClick={onAddLog}>
            <PlusIcon className="size-3.5" />
            Add log
          </Button>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Expenses paid from your personal savings — from recurring splits, family logs, or manual entries.
      </p>

      {showFilters && (
        <div className="mb-4 space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">From date</Label>
              <Input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To date</Label>
              <Input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
            </div>
            {categoryFamilyId && (
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any category</SelectItem>
                    {categoriesData?.items.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.categoryName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={applyFilters}>Apply</Button>
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters} className="gap-1">
                <XIcon className="size-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {logsLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : !logsData?.items.length ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No personal expenses logged yet.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="min-w-[36rem] divide-y divide-border overflow-hidden rounded-xl border border-border">
              <div className="hidden grid-cols-[minmax(0,2fr)_minmax(5rem,1fr)_minmax(6rem,1fr)_minmax(5rem,1fr)_auto] items-center gap-x-3 bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground md:grid">
                <span>Name</span>
                <span className="text-right">Amount</span>
                <span className="text-center">Source</span>
                <span>Date</span>
                <span className="w-20" />
              </div>
              {logsData.items.map((log) => (
                <PersonalExpenseLogRow
                  key={log.id}
                  log={log}
                  format={format}
                  currentUserId={currentUserId}
                  onEdit={onEditLog}
                />
              ))}
            </div>
          </div>

          {logsData.total_pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {logsData.page} of {logsData.total_pages} ({logsData.total} total)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={logsPage <= 1} onClick={() => setLogsPage(logsPage - 1)}>
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logsPage >= logsData.total_pages}
                  onClick={() => setLogsPage(logsPage + 1)}
                >
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </BentoCard>
  )
}

function PersonalExpenseLogRow({
  log,
  format,
  currentUserId,
  onEdit,
}: {
  log: PersonalExpenseLogListItem
  format: (v: number) => string
  currentUserId: string
  onEdit: (id: string) => void
}) {
  const canViewDoc = !!log.document_id && checkLogDocAccess(
    { document_id: log.document_id, show_doc_to_all: log.show_doc_to_all, added_by_user_id: currentUserId },
    currentUserId,
  )

  const actions = (
    <span className="flex items-center justify-end gap-1">
      {canViewDoc && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            title="View document"
            onClick={() => viewLogDocument(log.family_id, log.document_id!)}
          >
            <ExternalLinkIcon className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            title="Download document"
            onClick={() => downloadLogDocument(log.family_id, log.document_id!)}
          >
            <DownloadIcon className="size-3.5" />
          </Button>
        </>
      )}
      {log.can_edit && (
        <Button variant="ghost" size="sm" className="size-8 p-0" onClick={() => onEdit(log.id)}>
          <PencilIcon className="size-3.5" />
        </Button>
      )}
    </span>
  )

  return (
    <>
      <div className="flex items-start justify-between gap-3 px-4 py-3 text-sm transition hover:bg-muted/20 md:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{log.expense_name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {log.category_name && (
              <span className="text-xs text-muted-foreground">{log.category_name}</span>
            )}
            <Badge
              variant="secondary"
              className={`text-xs ${SOURCE_COLORS[log.source_type] ?? ''}`}
            >
              {sourceTypeLabel(log.source_type)}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatDate(log.expense_date)}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="font-semibold text-negative">-{format(log.amount)}</span>
          {actions}
        </div>
      </div>

      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(5rem,1fr)_minmax(6rem,1fr)_minmax(5rem,1fr)_auto] items-center gap-x-3 px-4 py-3 text-sm transition hover:bg-muted/20 md:grid">
        <span className="min-w-0">
          <span className="block truncate font-medium">{log.expense_name}</span>
          {log.category_name && (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">{log.category_name}</span>
          )}
        </span>
        <span className="text-right font-semibold text-negative">-{format(log.amount)}</span>
        <span className="text-center">
          <Badge
            variant="secondary"
            className={`text-xs ${SOURCE_COLORS[log.source_type] ?? ''}`}
          >
            {sourceTypeLabel(log.source_type)}
          </Badge>
        </span>
        <span className="text-xs text-muted-foreground">{formatDate(log.expense_date)}</span>
        <span className="w-20">{actions}</span>
      </div>
    </>
  )
}

function PersonalExpenseLogModal({
  isOpen,
  logDetail,
  isLoadingDetail,
  currentUserId,
  categoryFamilyId,
  onSubmit,
  isPending,
  onClose,
}: {
  isOpen: boolean
  logDetail?: {
    id: string
    family_id: string | null
    expense_name: string
    amount: number
    expense_date: string
    document_id: string | null
    can_edit: boolean
    source_type: string
    category_id?: string | null
  } | null
  isLoadingDetail?: boolean
  currentUserId?: string
  categoryFamilyId?: string
  onSubmit: (fd: FormData) => void
  isPending: boolean
  onClose: () => void
}) {
  const isEdit = !!logDetail
  const PERSONAL_LOG_STEPS = ['Basics', 'Docs & privacy'] as const
  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    expense_name: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
  })
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [isCreatingCat, setIsCreatingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const { data: categoriesData } = useExpenseCategories(categoryFamilyId ?? '')
  const createCategoryMutation = useCreateExpenseCategory(categoryFamilyId ?? '')

  useEffect(() => {
    if (!isOpen) {
      setStep(0)
      setFile(null)
      setForm({
        expense_name: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
      })
      setSelectedCategoryId('')
      setIsCreatingCat(false)
      setNewCatName('')
    }
  }, [isOpen])

  useEffect(() => {
    if (logDetail) {
      setForm({
        expense_name: logDetail.expense_name,
        amount: String(logDetail.amount),
        expense_date: logDetail.expense_date.split('T')[0],
      })
      setSelectedCategoryId(logDetail.category_id || '')
      setFile(null)
    }
  }, [logDetail])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('expense_name', form.expense_name)
    fd.append('amount', form.amount)
    fd.append('expense_date', form.expense_date)
    fd.append('show_doc_to_all', 'false')
    if (selectedCategoryId) fd.append('category_id', selectedCategoryId)
    if (file) fd.append('document', file)
    onSubmit(fd)
  }

  const readOnly = isEdit && logDetail && !logDetail.can_edit

  const goNext = () => {
    if (!form.expense_name.trim()) {
      toast.error('Enter an expense name')
      return
    }
    if (Number(form.amount) <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setStep(1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Expense log detail' : 'Add personal expense'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? readOnly
                ? 'This entry was created from a recurring expense or family log and cannot be edited here.'
                : 'Update this personal expense entry.'
              : 'Record an expense paid from your personal savings.'}
          </DialogDescription>
        </DialogHeader>
        <FormWizardProgress steps={PERSONAL_LOG_STEPS} currentStep={step} />

        {isEdit && isLoadingDetail ? (
          <div className="space-y-3 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        ) : isEdit && !logDetail ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Log not found.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {(step === 0 || readOnly) && (
              <>
            <div className="space-y-1">
              <Label>Expense name *</Label>
              <Input
                value={form.expense_name}
                onChange={(e) => setForm({ ...form, expense_name: e.target.value })}
                required
                disabled={readOnly}
              />
            </div>

            {categoryFamilyId && (
              <div className="space-y-1">
                <Label>Category</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={(val) => {
                    if (val === 'NEW') setIsCreatingCat(true)
                    else setSelectedCategoryId(val)
                  }}
                  disabled={!!readOnly}
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
                    {!readOnly && (
                      <SelectItem value="NEW" className="text-brand font-medium">
                        + Create new category...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {isCreatingCat && !readOnly && (
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

            <div className="space-y-1">
              <Label>Personal amount *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                disabled={readOnly}
              />
            </div>

            <div className="space-y-1">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                required
                disabled={readOnly}
              />
            </div>
              </>
            )}

            {(step === 1 || readOnly) && !readOnly && (
              <>
            <div className="space-y-1">
              <Label>Supporting document</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {isEdit && logDetail?.document_id && !file && (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileTextIcon className="size-3" /> Document attached.
                  </p>
                  {currentUserId && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => viewLogDocument(logDetail.family_id, logDetail.document_id!)}
                      >
                        <ExternalLinkIcon className="size-3" /> View
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => downloadLogDocument(logDetail.family_id, logDetail.document_id!)}
                      >
                        <DownloadIcon className="size-3" /> Download
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
              </>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {readOnly ? 'Close' : 'Cancel'}
              </Button>
              {!readOnly && step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep(0)}>Back</Button>
              )}
              {!readOnly && step === 0 ? (
                <Button type="button" onClick={goNext}>Next</Button>
              ) : !readOnly ? (
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                  {isEdit ? 'Save' : 'Add log'}
                </Button>
              ) : null}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
