import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { PageBar } from '#/components/ui/list-pagination'
import { FosModalOverlay } from '#/components/ui/fos-modal'
import { CategoryManageButton } from '#/components/common/category-manager'
import { MoneyEntryDialog, type EntryDialogMode } from '#/components/money/money-entry-dialog'
import { frequencyLabel, perMonth } from '#/components/common/frequency-selector'
import { useFamilyMembers } from '#/hooks/api/use-families'
import { useCategories } from '#/hooks/api/use-categories'
import {
  useMoneyEvents,
  useMoneyMutations,
  useMoneyRules,
  type MoneyEvent,
  type MoneyKind,
  type MoneyRule,
  type MoneyScope,
} from '#/hooks/api/use-money'
import { apiFetch } from '#/lib/api/client'
import { documentsApi } from '#/lib/api/endpoints/documents'
import type { Page } from '#/lib/api/pagination'
import { usePagination } from '#/lib/api/pagination'
import { formatDate, inputToEndOfDayIso, inputToIso } from '#/lib/dates'
import { formatCurrency } from '#/lib/format'
import { useDebounced } from '#/hooks/use-debounced'
import {
  CalendarIcon,
  ClockIcon,
  DownloadIcon,
  Edit2Icon,
  ExternalLinkIcon,
  FilterIcon,
  HistoryIcon,
  PaperclipIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ReceiptIcon,
  RepeatIcon,
  Trash2Icon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react'

interface MoneyWorkspaceProps {
  kind: MoneyKind
  familyId?: string
  isPersonal?: boolean
}

type Timeline = 'all' | '7d' | '30d' | '90d' | 'month' | 'custom'
type SourceFilter = '' | 'ONE_TIME' | 'RECURRING'

function daysAgoIso(days: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function startOfMonthIso() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

function csvEscape(value: string | number) {
  const raw = String(value ?? '')
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`
  return raw
}

export function MoneyWorkspace({ kind, familyId, isPersonal }: MoneyWorkspaceProps) {
  const isIncome = kind === 'INCOME'
  const scope: MoneyScope = isPersonal ? 'PERSONAL' : 'FAMILY'
  const { data: membersData } = useFamilyMembers(familyId || '')
  const members = membersData?.items ?? []

  const [search, setSearch] = useState('')
  const q = useDebounced(search.trim())
  const [source, setSource] = useState<SourceFilter>('')
  const [categoryId, setCategoryId] = useState('')
  const [timeline, setTimeline] = useState<Timeline>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [dialog, setDialog] = useState<EntryDialogMode | null>(null)
  const [historyRule, setHistoryRule] = useState<MoneyRule | null>(null)
  const [exporting, setExporting] = useState(false)

  const rulesPage = usePagination([scope, familyId, kind, q])
  const eventsPage = usePagination([scope, familyId, kind, q, source, categoryId, timeline, customFrom, customTo])

  const dateBounds = useMemo(() => {
    if (timeline === '7d') return { fromDate: daysAgoIso(7), toDate: undefined as string | undefined }
    if (timeline === '30d') return { fromDate: daysAgoIso(30), toDate: undefined }
    if (timeline === '90d') return { fromDate: daysAgoIso(90), toDate: undefined }
    if (timeline === 'month') return { fromDate: startOfMonthIso(), toDate: undefined }
    if (timeline === 'custom') {
      return {
        fromDate: customFrom ? inputToIso(customFrom) : undefined,
        toDate: customTo ? inputToEndOfDayIso(customTo) : undefined,
      }
    }
    return { fromDate: undefined, toDate: undefined }
  }, [timeline, customFrom, customTo])

  const rulesQuery = useMoneyRules(scope, familyId, kind, rulesPage.params, q)
  const overviewQuery = useMoneyRules(scope, familyId, kind, { page: 1, page_size: 100 })
  const eventsQuery = useMoneyEvents(scope, familyId, kind, eventsPage.params, {
    source: source || undefined,
    categoryId: categoryId || undefined,
    q,
    ...dateBounds,
  })
  const historyQuery = useMoneyEvents(scope, familyId, kind, { page: 1, page_size: 50 }, {
    ruleId: historyRule?.id ?? '',
  })
  const { data: categories } = useCategories({ scope, categoryType: kind, familyId, pageSize: 100 })
  const { updateRule, deleteRule, deleteEvent } = useMoneyMutations()

  const categoryName = (id?: string | null) => categories?.items.find((c) => c.id === id)?.name
  const memberName = (userId?: string | null) => members.find((m) => m.id === userId)?.name || 'Member'

  const rules = rulesQuery.data?.items ?? []
  const events = eventsQuery.data?.items ?? []
  const activeRules = (overviewQuery.data?.items ?? []).filter((r) => r.status === 'ACTIVE')
  const projected = activeRules.reduce((sum, r) => sum + r.amount * perMonth(r.frequency, r.everyN), 0)
  const projectionCapped = (overviewQuery.data?.total ?? 0) > 100

  const docUrl = (docId: string) =>
    isPersonal || !familyId ? documentsApi.userContentUrl(docId) : documentsApi.contentUrl(familyId, docId)

  const confirmDelete = async (label: string, run: () => Promise<unknown>) => {
    if (!confirm(label)) return
    try {
      await run()
      toast.success('Removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove it')
    }
  }

  const setStatus = async (rule: MoneyRule, status: 'ACTIVE' | 'PAUSED') => {
    try {
      await updateRule.mutateAsync({ id: rule.id, body: { status } })
      toast.success(status === 'PAUSED' ? 'Paused' : 'Resumed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update it')
    }
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const collected: MoneyEvent[] = []
      let page = 1
      let totalPages = 1
      do {
        const res = await apiFetch<Page<MoneyEvent>>('/api/familyos/money/events', {
          params: {
            scope,
            family_id: scope === 'FAMILY' ? familyId : undefined,
            kind,
            source: source || undefined,
            category_id: categoryId || undefined,
            q: q || undefined,
            from_date: dateBounds.fromDate,
            to_date: dateBounds.toDate,
            page,
            page_size: 100,
          },
        })
        collected.push(...res.items)
        totalPages = res.totalPages
        page += 1
      } while (page <= totalPages && page <= 50)
      if (collected.length === 0) {
        toast.error('Nothing to export for these filters')
        return
      }
      const headers = ['Date', 'Name', 'Source', 'Category', 'Amount', 'Overdrawn', 'Kind']
      const rows = collected.map((e) => [
        formatDate(e.occurredAt),
        e.name,
        e.ruleId ? 'Recurring' : 'One-time',
        categoryName(e.categoryId) || '',
        e.amount.toFixed(2),
        e.isOverdrawn ? 'yes' : '',
        e.kind,
      ])
      const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${isIncome ? 'income' : 'expense'}-logs-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${collected.length} rows`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const accent = isIncome ? 'text-[#64ffda]' : 'text-[#f87171]'
  const buttonClass = isIncome
    ? 'bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90'
    : 'bg-[#f87171] text-[#0a192f] hover:bg-[#f87171]/90'

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div className="flex flex-col gap-3 border-b border-[#233554] pb-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isIncome ? (
              <TrendingUpIcon className="h-6 w-6 text-[#64ffda]" />
            ) : (
              <ReceiptIcon className="h-6 w-6 text-[#f87171]" />
            )}
            <h1 className="text-2xl font-bold tracking-tight text-[#ccd6f6]">
              {isPersonal ? (isIncome ? 'Personal Income' : 'Personal Expenses') : isIncome ? 'Family Income' : 'Family Expenses'}
            </h1>
          </div>
          <p className="text-sm text-[#8892b0]">
            One-time entries post immediately. Recurring ones post at 18:00 on each due date.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryManageButton scope={scope} familyId={familyId} types={[kind]} />
          <Button onClick={() => setDialog({ type: 'create' })} className={`font-semibold shadow ${buttonClass}`}>
            <PlusIcon className="mr-1.5 h-4 w-4" /> Add {isIncome ? 'Income' : 'Expense'}
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#233554]/80 bg-[#112240]/90 p-5">
          <p className="text-xs font-medium text-[#8892b0]">Projected monthly (active)</p>
          <p className={`mt-2 font-mono text-2xl font-bold ${accent}`}>{formatCurrency(projected)}</p>
          {projectionCapped && <p className="mt-1 text-[11px] text-[#8892b0]">From the first 100 rules</p>}
        </div>
        <div className="rounded-2xl border border-[#233554]/80 bg-[#112240]/90 p-5">
          <p className="text-xs font-medium text-[#8892b0]">Matching log entries</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#ccd6f6]">{eventsQuery.data?.total ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-[#233554]/80 bg-[#112240]/90 p-5">
          <p className="text-xs font-medium text-[#8892b0]">Recurring rules</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#ccd6f6]">
            {activeRules.length}
            <span className="ml-2 text-sm font-normal text-[#8892b0]">active</span>
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#ccd6f6]">
            <RepeatIcon className="h-5 w-5 text-[#64ffda]" />
            Recurring {isIncome ? 'income' : 'expenses'}
          </h2>
          <span className="text-xs text-[#8892b0]">{rulesQuery.data?.total ?? 0} total</span>
        </div>

        {rulesQuery.isLoading ? (
          <p className="rounded-2xl border border-[#233554]/80 bg-[#112240]/70 p-8 text-center text-sm text-[#8892b0]">
            Loading…
          </p>
        ) : rules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#233554] p-10 text-center text-[#8892b0]">
            <RepeatIcon className="mx-auto mb-3 h-10 w-10 text-[#8892b0]/50" />
            <p className="text-base font-semibold text-[#ccd6f6]">No recurring rules yet</p>
            <p className="mt-1 text-sm">Salary, rent, and subscriptions post into the log on their due date.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {rules.map((rule) => (
                <article
                  key={rule.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#233554]/90 bg-[#112240]/90 p-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-[#ccd6f6]">{rule.name}</h3>
                          {categoryName(rule.categoryId) && (
                            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                              {categoryName(rule.categoryId)}
                            </span>
                          )}
                          <span className="rounded-md bg-[#233554] px-2 py-0.5 text-[11px] font-semibold text-[#64ffda]">
                            {frequencyLabel(rule.frequency, rule.everyN)}
                          </span>
                          {rule.status === 'PAUSED' && (
                            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                              Paused
                            </span>
                          )}
                          {rule.debtId && (
                            <span className="rounded-md bg-[#f87171]/15 px-2 py-0.5 text-[11px] font-semibold text-[#f87171]">
                              Debt EMI
                            </span>
                          )}
                          {rule.insuranceId && (
                            <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
                              Insurance
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#8892b0]">
                          Next: <strong className="text-[#ccd6f6]">{formatDate(rule.nextRunAt)}</strong>
                          <span className="mx-1">·</span>
                          {rule.runCount} posted
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {rule.documentId && (
                          <a
                            href={docUrl(rule.documentId)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg p-1.5 text-[#64ffda] hover:bg-[#172a45]"
                            title="Document"
                          >
                            <PaperclipIcon className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setHistoryRule(rule)}
                          className="rounded-lg p-1.5 text-[#8892b0] hover:bg-[#172a45] hover:text-[#64ffda]"
                          title="Run history"
                        >
                          <HistoryIcon className="h-4 w-4" />
                        </button>
                        {rule.canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => setStatus(rule, rule.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED')}
                              className="rounded-lg p-1.5 text-[#8892b0] hover:bg-[#172a45] hover:text-[#64ffda]"
                              title={rule.status === 'PAUSED' ? 'Resume' : 'Pause'}
                            >
                              {rule.status === 'PAUSED' ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDialog({ type: 'rule', rule })}
                              className="rounded-lg p-1.5 text-[#8892b0] hover:bg-[#172a45] hover:text-[#64ffda]"
                              title="Edit future runs"
                            >
                              <Edit2Icon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                confirmDelete('Stop this recurring item? Past entries stay in the log.', () =>
                                  deleteRule.mutateAsync(rule.id),
                                )
                              }
                              className="rounded-lg p-1.5 text-[#8892b0] hover:bg-[#172a45] hover:text-[#f87171]"
                              title="Delete"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {scope === 'FAMILY' && rule.parties.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-[#8892b0]">{isIncome ? 'Earned by:' : 'Used by:'}</span>
                        {rule.parties.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 rounded-full border border-[#233554] bg-[#0a192f] px-2 py-0.5 text-[11px] text-[#ccd6f6]"
                          >
                            <UsersIcon className="h-3 w-3 text-[#64ffda]" />
                            {p.partyType === 'FAMILY' ? 'Household' : memberName(p.userId)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-[#233554]/60 pt-3">
                    <span className="text-xs text-[#8892b0]">Each run</span>
                    <span className={`font-mono text-xl font-bold ${accent}`}>
                      {isIncome ? '+' : '−'}
                      {formatCurrency(rule.amount)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <PageBar state={rulesPage} data={rulesQuery.data} />
          </>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#ccd6f6]">
            <ClockIcon className="h-5 w-5 text-[#64ffda]" />
            Activity log
          </h2>
          <Button
            type="button"
            variant="outline"
            disabled={exporting}
            onClick={exportCsv}
            className="border-[#233554] text-[#ccd6f6] hover:border-[#64ffda]/40"
          >
            <DownloadIcon className="mr-1.5 h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export Excel'}
          </Button>
        </div>

        <div className="space-y-3 rounded-2xl border border-[#233554]/80 bg-[#112240]/60 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8892b0]">
            <FilterIcon className="h-3.5 w-3.5" />
            Filters
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <Label className="text-[11px] text-[#8892b0]">Search</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name"
                className="mt-1.5 rounded-xl border-[#233554] bg-[#0a192f] text-[#ccd6f6]"
              />
            </div>
            <div>
              <Label className="text-[11px] text-[#8892b0]">Source</Label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as SourceFilter)}
                className="mt-1.5 w-full rounded-xl border border-[#233554] bg-[#0a192f] px-3 py-2 text-sm text-[#ccd6f6]"
              >
                <option value="">All</option>
                <option value="ONE_TIME">One-time</option>
                <option value="RECURRING">Recurring runs</option>
              </select>
            </div>
            <div>
              <Label className="text-[11px] text-[#8892b0]">Category</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#233554] bg-[#0a192f] px-3 py-2 text-sm text-[#ccd6f6]"
              >
                <option value="">All categories</option>
                {(categories?.items ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-[11px] text-[#8892b0]">Timeline</Label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value as Timeline)}
                className="mt-1.5 w-full rounded-xl border border-[#233554] bg-[#0a192f] px-3 py-2 text-sm text-[#ccd6f6]"
              >
                <option value="all">All time</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="month">This month</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            {timeline === 'custom' && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:col-span-2">
                <div>
                  <Label className="text-[11px] text-[#8892b0]">From</Label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="mt-1.5 rounded-xl border-[#233554] bg-[#0a192f] text-[#ccd6f6]"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-[#8892b0]">To</Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="mt-1.5 rounded-xl border-[#233554] bg-[#0a192f] text-[#ccd6f6]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {eventsQuery.isLoading ? (
          <p className="rounded-2xl border border-[#233554]/80 bg-[#112240]/70 p-8 text-center text-sm text-[#8892b0]">
            Loading…
          </p>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#233554] p-10 text-center text-[#8892b0]">
            <ClockIcon className="mx-auto mb-3 h-10 w-10 text-[#8892b0]/50" />
            <p className="text-base font-semibold text-[#ccd6f6]">No matching entries</p>
            <p className="mt-1 text-sm">One-time entries show up immediately. Recurring ones appear after they post.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-2xl border border-[#233554]/90 bg-[#112240]/90 p-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-[#ccd6f6]">{event.name}</h4>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          event.ruleId ? 'bg-[#64ffda]/15 text-[#64ffda]' : 'bg-[#233554] text-[#ccd6f6]'
                        }`}
                      >
                        {event.ruleId ? 'Recurring' : 'One-time'}
                      </span>
                      {event.isOverdrawn && (
                        <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          Overdrawn
                        </span>
                      )}
                      {categoryName(event.categoryId) && (
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                          {categoryName(event.categoryId)}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-[#8892b0]">
                        <CalendarIcon className="h-3 w-3" />
                        {formatDate(event.occurredAt)}
                      </span>
                      {event.documentId && (
                        <a
                          href={docUrl(event.documentId)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-[#64ffda]/10 px-2 py-0.5 text-[10px] font-semibold text-[#64ffda]"
                        >
                          <PaperclipIcon className="h-2.5 w-2.5" />
                          Document
                          <ExternalLinkIcon className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`font-mono text-lg font-bold ${accent}`}>
                      {isIncome ? '+' : '−'}
                      {formatCurrency(event.amount)}
                    </span>
                    {event.canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => setDialog({ type: 'event', event })}
                          className="rounded-lg p-1.5 text-[#8892b0] hover:bg-[#172a45] hover:text-[#64ffda]"
                          title="Edit"
                        >
                          <Edit2Icon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            confirmDelete('Remove this entry? Its effect on the balance is reversed.', () =>
                              deleteEvent.mutateAsync(event.id),
                            )
                          }
                          className="rounded-lg p-1.5 text-[#8892b0] hover:bg-[#172a45] hover:text-[#f87171]"
                          title="Delete"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <PageBar state={eventsPage} data={eventsQuery.data} />
          </>
        )}
      </section>

      {dialog && (
        <MoneyEntryDialog
          mode={dialog}
          kind={kind}
          scope={scope}
          familyId={familyId}
          members={members}
          onClose={() => setDialog(null)}
        />
      )}

      {historyRule && (
        <FosModalOverlay>
          <div className="my-auto w-full min-w-0 max-w-lg max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-2xl border border-[#233554]/90 bg-[#112240]/95 p-4 text-[#ccd6f6] sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-[#233554]/60 pb-3">
              <div>
                <h2 className="text-lg font-bold text-[#e6f1ff]">{historyRule.name}</h2>
                <p className="text-xs text-[#8892b0]">Posted runs. Deleting one reverses that amount.</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setHistoryRule(null)} className="border-[#233554]">
                Close
              </Button>
            </div>
            <ul className="mt-4 space-y-2">
              {(historyQuery.data?.items ?? []).map((event) => (
                <li key={event.id} className="flex items-center justify-between rounded-xl border border-[#233554] px-3 py-2 text-sm">
                  <span>{formatDate(event.occurredAt)}</span>
                  <span className={`font-mono ${accent}`}>{formatCurrency(event.amount)}</span>
                </li>
              ))}
              {historyQuery.isSuccess && (historyQuery.data?.items.length ?? 0) === 0 && (
                <li className="text-sm text-[#8892b0]">Nothing posted yet.</li>
              )}
            </ul>
          </div>
        </FosModalOverlay>
      )}
    </div>
  )
}
