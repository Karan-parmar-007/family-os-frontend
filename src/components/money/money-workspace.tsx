import { useMemo, useState, useEffect } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { useFamilyMembers } from '#/hooks/api/use-families'
import { apiFetch } from '#/lib/api/client'
import { documentsApi } from '#/lib/api/endpoints/documents'
import { FrequencySelector } from '#/components/common/frequency-selector'
import { DocumentUploader } from '#/components/common/document-uploader'
import { CategoryPicker } from '#/components/common/category-picker'
import { FosModalOverlay } from '#/components/ui/fos-modal'
import { ListPagination } from '#/components/ui/list-pagination'
import { toast } from 'sonner'
import {
  TrendingUpIcon,
  ReceiptIcon,
  PlusIcon,
  Trash2Icon,
  Edit2Icon,
  RepeatIcon,
  ClockIcon,
  UsersIcon,
  PaperclipIcon,
  ExternalLinkIcon,
  CalendarIcon,
  DownloadIcon,
  FilterIcon,
} from 'lucide-react'

interface Party {
  id: string
  partyType: 'MEMBER' | 'FAMILY'
  userId?: string
}

interface MoneyRule {
  id: string
  scope: 'FAMILY' | 'PERSONAL'
  familyId?: string
  ownerUserId?: string
  kind: 'INCOME' | 'EXPENSE'
  name: string
  amount: number
  categoryId?: string | null
  frequency: string
  nextRunAt: string
  documentId?: string | null
  letEveryoneEdit: boolean
  createdBy: string
  status: string
  debtId?: string | null
  insuranceId?: string | null
  parties: Party[]
  createdAt: string
  updatedAt: string
}

interface MoneyEvent {
  id: string
  ruleId?: string | null
  scope: 'FAMILY' | 'PERSONAL'
  familyId?: string
  ownerUserId?: string
  kind: 'INCOME' | 'EXPENSE'
  name: string
  amount: number
  categoryId?: string | null
  documentId?: string | null
  letEveryoneEdit: boolean
  occurredAt: string
  createdBy: string
  parties: Party[]
  createdAt: string
}

interface MoneyWorkspaceProps {
  kind: 'INCOME' | 'EXPENSE'
  familyId?: string
  isPersonal?: boolean
}

type LogSourceFilter = 'all' | 'one_time' | 'recurring'
type TimelinePreset = 'all' | '7d' | '30d' | '90d' | 'month' | 'custom'

const LOG_PAGE_SIZE = 10

function formatFrequencyLabel(freq: string) {
  if (!freq) return 'Monthly'
  const upper = freq.toUpperCase()
  const customMatch = upper.match(/^(?:EVERY_|CUSTOM_)?(\d+)[_\s]*(DAY|DAYS|WEEK|WEEKS|MONTH|MONTHS|YEAR|YEARS)$/i)
  if (customMatch) {
    const count = customMatch[1]
    const unit = customMatch[2].toLowerCase()
    return `Every ${count} ${unit}`
  }
  if (upper === 'DAILY') return 'Daily'
  if (upper === 'WEEKLY') return 'Weekly'
  if (upper === 'BIWEEKLY') return 'Bi-Weekly'
  if (upper === 'MONTHLY') return 'Monthly'
  if (upper === 'YEARLY') return 'Yearly'
  return freq
}

function csvEscape(value: string | number) {
  const raw = String(value ?? '')
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`
  return raw
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function daysAgo(n: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

export function MoneyWorkspace({ kind, familyId, isPersonal }: MoneyWorkspaceProps) {
  const isIncome = kind === 'INCOME'
  const scope = isPersonal ? 'PERSONAL' : 'FAMILY'

  const { data: membersData } = useFamilyMembers(familyId || '')
  const members = membersData?.items || []

  const [rules, setRules] = useState<MoneyRule[]>([])
  const [events, setEvents] = useState<MoneyEvent[]>([])
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<MoneyRule | null>(null)

  // One-time is the primary add path
  const [entryType, setEntryType] = useState<'recurring' | 'event'>('event')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({})
  const [frequency, setFrequency] = useState('MONTHLY')
  const [nextRunAt, setNextRunAt] = useState(new Date().toISOString().split('T')[0])
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().split('T')[0])
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [documentName, setDocumentName] = useState<string | null>(null)
  const [letEveryoneEdit, setLetEveryoneEdit] = useState(true)
  const [selectedParties, setSelectedParties] = useState<string[]>(['FAMILY'])

  const [logSource, setLogSource] = useState<LogSourceFilter>('all')
  const [logCategoryId, setLogCategoryId] = useState<string>('all')
  const [timelinePreset, setTimelinePreset] = useState<TimelinePreset>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [logPage, setLogPage] = useState(1)

  const fetchData = async () => {
    setLoading(true)
    try {
      const qFam = scope === 'FAMILY' && familyId ? `&family_id=${familyId}` : ''
      const rulesUrl = `/api/familyos/money/rules?scope=${scope}&kind=${kind}${qFam}`
      const eventsUrl = `/api/familyos/money/events?scope=${scope}&kind=${kind}&limit=500${qFam}`
      const catUrl = `/api/familyos/categories?scope=${scope}&category_type=${kind}${qFam}`
      const [rulesRes, eventsRes, catsRes] = await Promise.all([
        apiFetch<{ items: MoneyRule[] }>(rulesUrl),
        apiFetch<{ items: MoneyEvent[] }>(eventsUrl),
        apiFetch<{ items: { id: string; name: string }[] }>(catUrl).catch(() => ({ items: [] })),
      ])
      const cMap: Record<string, string> = {}
      ;(catsRes.items || []).forEach((c) => {
        cMap[c.id] = c.name
      })
      setCategoriesMap(cMap)
      setRules(rulesRes.items || [])
      setEvents(eventsRes.items || [])
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load financial records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [familyId, scope, kind])

  const toggleParty = (partyId: string) => {
    setSelectedParties((prev) => {
      if (prev.includes(partyId)) {
        if (prev.length === 1) return prev
        return prev.filter((p) => p !== partyId)
      }
      return [...prev, partyId]
    })
  }

  const resetForm = () => {
    setEntryType('event')
    setName('')
    setAmount('')
    setCategoryId(null)
    setCategoryName('')
    setFrequency('MONTHLY')
    setNextRunAt(new Date().toISOString().split('T')[0])
    setOccurredAt(new Date().toISOString().split('T')[0])
    setDocumentId(null)
    setDocumentName(null)
    setLetEveryoneEdit(true)
    setSelectedParties(['FAMILY'])
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmt = parseFloat(amount)
    if (!name.trim() || isNaN(parsedAmt) || parsedAmt <= 0) {
      toast.error('Please enter a valid name and amount')
      return
    }

    const partiesPayload = selectedParties.map((p) => {
      if (p === 'FAMILY') return { partyType: 'FAMILY' }
      return { partyType: 'MEMBER', userId: p }
    })

    try {
      if (entryType === 'recurring') {
        await apiFetch('/api/familyos/money/rules', {
          method: 'POST',
          json: {
            scope,
            familyId: scope === 'FAMILY' ? familyId : null,
            kind,
            name: name.trim(),
            amount: parsedAmt,
            categoryId: categoryId || null,
            frequency: frequency.toUpperCase(),
            nextRunAt: new Date(nextRunAt).toISOString(),
            documentId: documentId || null,
            letEveryoneEdit,
            parties: partiesPayload,
          },
        })
        toast.success(`Recurring ${isIncome ? 'income' : 'expense'} rule created`)
      } else {
        await apiFetch('/api/familyos/money/events', {
          method: 'POST',
          json: {
            scope,
            familyId: scope === 'FAMILY' ? familyId : null,
            kind,
            name: name.trim(),
            amount: parsedAmt,
            categoryId: categoryId || null,
            documentId: documentId || null,
            occurredAt: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
            letEveryoneEdit,
            parties: partiesPayload,
          },
        })
        toast.success(`One-time ${isIncome ? 'income' : 'expense'} logged & pool updated`)
      }

      setCreateOpen(false)
      resetForm()
      await fetchData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save entry')
    }
  }

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRule) return
    const parsedAmt = parseFloat(amount)
    if (!name.trim() || isNaN(parsedAmt) || parsedAmt <= 0) {
      toast.error('Please enter a valid name and amount')
      return
    }

    const partiesPayload = selectedParties.map((p) => {
      if (p === 'FAMILY') return { partyType: 'FAMILY' }
      return { partyType: 'MEMBER', userId: p }
    })

    try {
      await apiFetch(`/api/familyos/money/rules/${editingRule.id}`, {
        method: 'PATCH',
        json: {
          name: name.trim(),
          amount: parsedAmt,
          categoryId: categoryId || null,
          frequency: frequency.toUpperCase(),
          nextRunAt: new Date(nextRunAt).toISOString(),
          documentId: documentId || null,
          letEveryoneEdit,
          parties: partiesPayload,
        },
      })
      toast.success('Rule updated')
      setEditingRule(null)
      fetchData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update rule')
    }
  }

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring rule?')) return
    try {
      await apiFetch(`/api/familyos/money/rules/${id}`, { method: 'DELETE' })
      toast.success('Rule deleted')
      fetchData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete rule')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to remove this log entry?')) return
    try {
      await apiFetch(`/api/familyos/money/events/${id}`, { method: 'DELETE' })
      toast.success('Entry removed')
      fetchData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete entry')
    }
  }

  const openEditRule = (r: MoneyRule) => {
    setEditingRule(r)
    setName(r.name)
    setAmount(r.amount.toString())
    setCategoryId(r.categoryId || null)
    setCategoryName(r.categoryId ? categoriesMap[r.categoryId] || '' : '')
    setFrequency(r.frequency)
    setNextRunAt(new Date(r.nextRunAt).toISOString().split('T')[0])
    setDocumentId(r.documentId || null)
    setDocumentName(null)
    setLetEveryoneEdit(r.letEveryoneEdit)
    const pKeys = r.parties.map((p) => (p.partyType === 'FAMILY' ? 'FAMILY' : p.userId || ''))
    setSelectedParties(pKeys.length > 0 ? pKeys : ['FAMILY'])
  }

  const getDocUrl = (docId: string) => {
    if (isPersonal || !familyId) return documentsApi.userContentUrl(docId)
    return documentsApi.contentUrl(familyId, docId)
  }

  const projectedMonthly = rules.reduce((acc, r) => {
    let multiplier = 1
    const upper = (r.frequency || '').toUpperCase()
    const customMatch = upper.match(/^(?:EVERY_|CUSTOM_)?(\d+)[_\s]*(DAY|DAYS|WEEK|WEEKS|MONTH|MONTHS|YEAR|YEARS)$/i)
    if (customMatch) {
      const count = Math.max(1, parseInt(customMatch[1], 10) || 1)
      const unit = customMatch[2].toUpperCase()
      if (unit.startsWith('DAY')) multiplier = 30 / count
      else if (unit.startsWith('WEEK')) multiplier = 4.33 / count
      else if (unit.startsWith('MONTH')) multiplier = 1 / count
      else if (unit.startsWith('YEAR')) multiplier = 1 / (12 * count)
    } else if (upper === 'DAILY') multiplier = 30
    else if (upper === 'WEEKLY') multiplier = 4.33
    else if (upper === 'BIWEEKLY') multiplier = 2.16
    else if (upper === 'YEARLY') multiplier = 1 / 12
    return acc + r.amount * multiplier
  }, 0)

  const timelineBounds = useMemo(() => {
    const now = new Date()
    if (timelinePreset === '7d') return { from: daysAgo(7), to: now }
    if (timelinePreset === '30d') return { from: daysAgo(30), to: now }
    if (timelinePreset === '90d') return { from: daysAgo(90), to: now }
    if (timelinePreset === 'month') return { from: startOfMonth(now), to: now }
    if (timelinePreset === 'custom') {
      const from = customFrom ? new Date(customFrom) : null
      const to = customTo ? new Date(`${customTo}T23:59:59`) : null
      return { from, to }
    }
    return { from: null as Date | null, to: null as Date | null }
  }, [timelinePreset, customFrom, customTo])

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const isRecurring = Boolean(e.ruleId)
      if (logSource === 'one_time' && isRecurring) return false
      if (logSource === 'recurring' && !isRecurring) return false
      if (logCategoryId !== 'all' && e.categoryId !== logCategoryId) return false
      const occurred = new Date(e.occurredAt)
      if (timelineBounds.from && occurred < timelineBounds.from) return false
      if (timelineBounds.to && occurred > timelineBounds.to) return false
      return true
    })
  }, [events, logSource, logCategoryId, timelineBounds])

  useEffect(() => {
    setLogPage(1)
  }, [logSource, logCategoryId, timelinePreset, customFrom, customTo, kind, familyId, scope])

  const logTotalPages = Math.max(1, Math.ceil(filteredEvents.length / LOG_PAGE_SIZE))
  const safeLogPage = Math.min(logPage, logTotalPages)
  const pagedEvents = filteredEvents.slice(
    (safeLogPage - 1) * LOG_PAGE_SIZE,
    safeLogPage * LOG_PAGE_SIZE,
  )

  const eventsTotal = filteredEvents.reduce((acc, e) => acc + e.amount, 0)
  const categoryOptions = Object.entries(categoriesMap).sort((a, b) => a[1].localeCompare(b[1]))

  const exportExcelCsv = () => {
    if (filteredEvents.length === 0) {
      toast.error('No log rows to export for the current filters')
      return
    }
    const headers = ['Date', 'Name', 'Source', 'Category', 'Amount', 'Kind']
    const rows = filteredEvents.map((e) => [
      new Date(e.occurredAt).toLocaleDateString(),
      e.name,
      e.ruleId ? 'Recurring' : 'One-time',
      (e.categoryId && categoriesMap[e.categoryId]) || '',
      e.amount.toFixed(2),
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
    toast.success('Exported logs for Excel')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-[#233554] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isIncome ? (
              <TrendingUpIcon className="h-6 w-6 text-[#64ffda]" />
            ) : (
              <ReceiptIcon className="h-6 w-6 text-[#f87171]" />
            )}
            <h1 className="text-2xl font-bold tracking-tight text-[#ccd6f6]">
              {isPersonal
                ? isIncome
                  ? 'Personal Income'
                  : 'Personal Expenses'
                : isIncome
                  ? 'Family Income'
                  : 'Family Expenses'}
            </h1>
          </div>
          <p className="text-sm text-[#8892b0]">
            {isIncome
              ? 'Numbers first, then recurring streams, then a full activity log.'
              : 'Numbers first, then recurring bills/EMIs, then a full activity log.'}
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm()
            setCreateOpen(true)
          }}
          className={`font-semibold shadow transition ${
            isIncome
              ? 'bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 '
              : 'bg-[#f87171] text-[#0a192f] hover:bg-[#f87171]/90 '
          }`}
        >
          <PlusIcon className="mr-1.5 h-4 w-4" /> Add {isIncome ? 'Income' : 'Expense'}
        </Button>
      </div>

      {/* 1) Numbers */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8892b0]">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#233554]/80 bg-[#112240]/90 p-5">
            <p className="text-xs font-medium text-[#8892b0]">Projected Monthly Recurring</p>
            <p className={`mt-2 text-2xl font-bold font-mono ${isIncome ? 'text-[#64ffda]' : 'text-[#f87171]'}`}>
              ${projectedMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-2xl border border-[#233554]/80 bg-[#112240]/90 p-5">
            <p className="text-xs font-medium text-[#8892b0]">Filtered Log Total</p>
            <p className="mt-2 text-2xl font-bold font-mono text-[#ccd6f6]">
              ${eventsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-2xl border border-[#233554]/80 bg-[#112240]/90 p-5">
            <p className="text-xs font-medium text-[#8892b0]">Active Recurring Rules</p>
            <p className="mt-2 text-2xl font-bold font-mono text-[#ccd6f6]">{rules.length}</p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-[#233554]/80 bg-[#112240]/70 p-12 text-center text-[#8892b0]">
          Loading records…
        </div>
      ) : (
        <>
          {/* 2) Recurring */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[#ccd6f6]">
                <RepeatIcon className="h-5 w-5 text-[#64ffda]" />
                Recurring {isIncome ? 'Income' : 'Expenses'}
              </h2>
              <span className="text-xs text-[#8892b0]">{rules.length} active</span>
            </div>

            {rules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#233554] p-10 text-center text-[#8892b0]">
                <RepeatIcon className="mx-auto mb-3 h-10 w-10 text-[#8892b0]/50" />
                <p className="text-base font-semibold text-[#ccd6f6]">No recurring rules yet</p>
                <p className="mt-1 text-sm">
                  Add salary, rent, subscriptions, or debt EMIs. Cron posts each hit into the log below.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {rules.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#233554]/90 bg-[#112240]/90 p-5 transition-all hover:border-[#64ffda]/30"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-[#ccd6f6]">{r.name}</h3>
                            {r.categoryId && categoriesMap[r.categoryId] && (
                              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                                {categoriesMap[r.categoryId]}
                              </span>
                            )}
                            <span className="rounded-md bg-[#233554] px-2 py-0.5 text-[11px] font-semibold text-[#64ffda]">
                              {formatFrequencyLabel(r.frequency)}
                            </span>
                            {r.debtId && (
                              <span className="rounded-md bg-[#f87171]/15 px-2 py-0.5 text-[11px] font-semibold text-[#f87171]">
                                Debt EMI
                              </span>
                            )}
                            {r.insuranceId && (
                              <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
                                Insurance
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-[#8892b0]">
                            Next run:{' '}
                            <strong className="text-[#ccd6f6]">{new Date(r.nextRunAt).toLocaleDateString()}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          {r.documentId && (
                            <a
                              href={getDocUrl(r.documentId)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg p-1.5 text-[#64ffda] transition hover:bg-[#172a45]"
                              title="View document"
                            >
                              <PaperclipIcon className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditRule(r)}
                            className="rounded-lg p-1.5 text-[#8892b0] transition hover:bg-[#172a45] hover:text-[#64ffda]"
                            title="Edit"
                          >
                            <Edit2Icon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(r.id)}
                            className="rounded-lg p-1.5 text-[#8892b0] transition hover:bg-[#172a45] hover:text-[#f87171]"
                            title="Delete"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {scope === 'FAMILY' && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-[#8892b0]">{isIncome ? 'Earned by:' : 'Used by:'}</span>
                          {r.parties.map((p) => {
                            const m = members.find((x) => x.id === p.userId)
                            return (
                              <span
                                key={p.id}
                                className="inline-flex items-center gap-1 rounded-full border border-[#233554] bg-[#0a192f] px-2 py-0.5 text-[11px] font-medium text-[#ccd6f6]"
                              >
                                <UsersIcon className="h-3 w-3 text-[#64ffda]" />
                                {p.partyType === 'FAMILY' ? 'Household' : m?.name || 'Member'}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[#233554]/60 pt-3">
                      <span className="text-xs text-[#8892b0]">Cadence amount</span>
                      <span className={`font-mono text-xl font-bold ${isIncome ? 'text-[#64ffda]' : 'text-[#f87171]'}`}>
                        {isIncome ? '+' : '-'}${r.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3) Logs */}
          <section className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[#ccd6f6]">
                <ClockIcon className="h-5 w-5 text-[#64ffda]" />
                Activity Log
              </h2>
              <Button
                type="button"
                variant="outline"
                onClick={exportExcelCsv}
                className="border-[#233554] text-[#ccd6f6] hover:border-[#64ffda]/40"
              >
                <DownloadIcon className="mr-1.5 h-4 w-4" />
                Export Excel
              </Button>
            </div>

            <div className="rounded-2xl border border-[#233554]/80 bg-[#112240]/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8892b0]">
                <FilterIcon className="h-3.5 w-3.5" />
                Filters
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <Label className="text-[11px] text-[#8892b0]">Source</Label>
                  <select
                    value={logSource}
                    onChange={(e) => setLogSource(e.target.value as LogSourceFilter)}
                    className="mt-1.5 w-full rounded-xl border border-[#233554] bg-[#0a192f] px-3 py-2 text-sm text-[#ccd6f6]"
                  >
                    <option value="all">All (one-time + recurring)</option>
                    <option value="one_time">One-time only</option>
                    <option value="recurring">Recurring hits only</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[11px] text-[#8892b0]">Category</Label>
                  <select
                    value={logCategoryId}
                    onChange={(e) => setLogCategoryId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#233554] bg-[#0a192f] px-3 py-2 text-sm text-[#ccd6f6]"
                  >
                    <option value="all">All categories</option>
                    {categoryOptions.map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-[11px] text-[#8892b0]">Timeline</Label>
                  <select
                    value={timelinePreset}
                    onChange={(e) => setTimelinePreset(e.target.value as TimelinePreset)}
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
                {timelinePreset === 'custom' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] text-[#8892b0]">From</Label>
                      <Input
                        type="date"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="mt-1.5 bg-[#0a192f] border-[#233554] text-[#ccd6f6] rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-[#8892b0]">To</Label>
                      <Input
                        type="date"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="mt-1.5 bg-[#0a192f] border-[#233554] text-[#ccd6f6] rounded-xl"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end">
                    <p className="text-xs text-[#8892b0] pb-2">
                      Showing {filteredEvents.length} of {events.length} log rows
                    </p>
                  </div>
                )}
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#233554] p-10 text-center text-[#8892b0]">
                <ClockIcon className="mx-auto mb-3 h-10 w-10 text-[#8892b0]/50" />
                <p className="text-base font-semibold text-[#ccd6f6]">No matching log entries</p>
                <p className="mt-1 text-sm">
                  One-time entries appear immediately. Recurring hits (including debt EMIs) appear after the daily cron
                  run.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-3">
                  {pagedEvents.map((e) => {
                    const isRecurringHit = Boolean(e.ruleId)
                    return (
                      <div
                        key={e.id}
                        className="flex items-center justify-between rounded-2xl border border-[#233554]/90 bg-[#112240]/90 p-4 transition-all hover:border-[#64ffda]/30"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-[#ccd6f6]">{e.name}</h4>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                isRecurringHit
                                  ? 'bg-[#64ffda]/15 text-[#64ffda]'
                                  : 'bg-[#233554] text-[#ccd6f6]'
                              }`}
                            >
                              {isRecurringHit ? 'Recurring' : 'One-time'}
                            </span>
                            {e.categoryId && categoriesMap[e.categoryId] && (
                              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                                {categoriesMap[e.categoryId]}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-[#8892b0]">
                              <CalendarIcon className="h-3 w-3" />
                              {new Date(e.occurredAt).toLocaleDateString()}
                            </span>
                            {e.documentId && (
                              <a
                                href={getDocUrl(e.documentId)}
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

                          {scope === 'FAMILY' && e.parties.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#8892b0]">
                              <span>{isIncome ? 'Earned:' : 'For:'}</span>
                              {e.parties.map((p) => {
                                const m = members.find((x) => x.id === p.userId)
                                return (
                                  <span key={p.id} className="font-medium text-[#ccd6f6]">
                                    {p.partyType === 'FAMILY' ? 'Household' : m?.name || 'Member'}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className={`font-mono text-lg font-bold ${isIncome ? 'text-[#64ffda]' : 'text-[#f87171]'}`}>
                            {isIncome ? '+' : '-'}${e.amount.toFixed(2)}
                          </span>
                          {!isRecurringHit && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(e.id)}
                              className="rounded-lg p-1.5 text-[#8892b0] transition hover:bg-[#172a45] hover:text-[#f87171]"
                              title="Delete"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <ListPagination
                  page={safeLogPage}
                  totalPages={logTotalPages}
                  total={filteredEvents.length}
                  pageSize={LOG_PAGE_SIZE}
                  onPageChange={setLogPage}
                  className="text-[#8892b0]"
                />
              </>
            )}
          </section>
        </>
      )}

      {createOpen && (
        <FosModalOverlay>
          <div className="my-auto w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl border border-[#233554]/90 bg-[#112240]/95 p-6 text-[#ccd6f6] shadow-[0_25px_60px_rgba(2,12,27,0.85)] ring-1 ring-white/5 sm:p-7">
            <div className="border-b border-[#233554]/60 pb-3">
              <h2 className="text-xl font-bold tracking-tight text-[#e6f1ff]">
                Add {isIncome ? 'Income' : 'Expense'}
              </h2>
              <p className="mt-0.5 text-xs text-[#8892b0]">
                {isIncome
                  ? 'Record a personal or household income stream'
                  : 'Track expenses, spending attribution, and receipts'}
              </p>

              <div className="mt-3.5 flex rounded-xl border border-[#233554] bg-[#0a192f] p-1">
                <button
                  type="button"
                  onClick={() => setEntryType('event')}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                    entryType === 'event'
                      ? 'bg-[#64ffda] text-[#0a192f] shadow'
                      : 'text-[#8892b0] hover:text-[#ccd6f6]'
                  }`}
                >
                  One-Time Entry (Immediate)
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('recurring')}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                    entryType === 'recurring'
                      ? 'bg-[#64ffda] text-[#0a192f] shadow'
                      : 'text-[#8892b0] hover:text-[#ccd6f6]'
                  }`}
                >
                  Recurring Cadence
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <Label className="text-xs text-[#8892b0]">Name</Label>
                <Input
                  placeholder={
                    isIncome
                      ? 'e.g. Salary, Consulting Retainer, Dividends'
                      : 'e.g. Rent, Groceries, Electricity'
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 rounded-xl border-[#233554] bg-[#0a192f] text-[#ccd6f6] focus:border-[#64ffda]"
                  required
                />
              </div>

              <div>
                <Label className="text-xs text-[#8892b0]">Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5 rounded-xl border-[#233554] bg-[#0a192f] font-mono text-[#ccd6f6] focus:border-[#64ffda]"
                  required
                />
              </div>

              {scope === 'FAMILY' && (
                <div>
                  <Label className="text-xs text-[#8892b0]">
                    {isIncome
                      ? 'Earned By (Labels only, full amount credits pool)'
                      : 'Used By (Labels only, full amount debits pool)'}
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleParty('FAMILY')}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        selectedParties.includes('FAMILY')
                          ? 'border-[#64ffda] bg-[#64ffda]/10 text-[#64ffda]'
                          : 'border-[#233554] bg-[#0a192f] text-[#8892b0] hover:text-[#ccd6f6]'
                      }`}
                    >
                      Entire Household
                    </button>
                    {members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleParty(m.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          selectedParties.includes(m.id)
                            ? 'border-[#64ffda] bg-[#64ffda]/10 text-[#64ffda]'
                            : 'border-[#233554] bg-[#0a192f] text-[#8892b0] hover:text-[#ccd6f6]'
                        }`}
                      >
                        {m.name || m.email}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {entryType === 'recurring' ? (
                <>
                  <FrequencySelector value={frequency} onChange={setFrequency} />
                  <div>
                    <Label className="text-xs text-[#8892b0]">Next Run Date</Label>
                    <Input
                      type="date"
                      value={nextRunAt}
                      onChange={(e) => setNextRunAt(e.target.value)}
                      className="mt-1.5 rounded-xl border-[#233554] bg-[#0a192f] text-[#ccd6f6] focus:border-[#64ffda]"
                      required
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label className="text-xs text-[#8892b0]">Date Occurred</Label>
                  <Input
                    type="date"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                    className="mt-1.5 rounded-xl border-[#233554] bg-[#0a192f] text-[#ccd6f6] focus:border-[#64ffda]"
                    required
                  />
                </div>
              )}

              <div>
                <CategoryPicker
                  scope={scope}
                  categoryType={kind}
                  familyId={familyId}
                  value={categoryName}
                  onSelect={(cat) => {
                    setCategoryId(cat.id)
                    setCategoryName(cat.name)
                  }}
                  label={isIncome ? 'Income Category' : 'Expense Category'}
                />
              </div>

              <div>
                <DocumentUploader
                  documentId={documentId}
                  documentName={documentName}
                  onDocumentChange={(id, docName) => {
                    setDocumentId(id)
                    setDocumentName(docName ?? null)
                  }}
                  familyId={familyId}
                  isPersonal={isPersonal}
                  label={isIncome ? 'Payslip / Income Proof' : 'Receipt / Invoice Attachment'}
                  hint="Attach receipt or proof"
                />
              </div>

              {scope === 'FAMILY' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="letEdit"
                    checked={letEveryoneEdit}
                    onChange={(e) => setLetEveryoneEdit(e.target.checked)}
                    className="h-4 w-4 rounded border-[#233554] bg-[#0a192f] text-[#64ffda] focus:ring-[#64ffda]"
                  />
                  <label htmlFor="letEdit" className="cursor-pointer text-xs text-[#ccd6f6]">
                    Let all household members edit this entry
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2.5 border-t border-[#233554]/60 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  className="border-[#233554] px-5 text-[#8892b0] hover:text-[#ccd6f6]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className={`px-6 font-semibold shadow-md transition ${
                    isIncome
                      ? 'bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 '
                      : 'bg-[#f87171] text-[#0a192f] hover:bg-[#f87171]/90 '
                  }`}
                >
                  Save Entry
                </Button>
              </div>
            </form>
          </div>
        </FosModalOverlay>
      )}

      {editingRule && (
        <FosModalOverlay>
          <div className="my-auto w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl border border-[#233554]/90 bg-[#112240]/95 p-6 text-[#ccd6f6] shadow-[0_25px_60px_rgba(2,12,27,0.85)] ring-1 ring-white/5 sm:p-7">
            <div className="border-b border-[#233554]/60 pb-3">
              <h2 className="text-xl font-bold tracking-tight text-[#e6f1ff]">Edit Recurring Rule</h2>
              <p className="mt-0.5 text-xs text-[#8892b0]">
                Update cadence frequency, attribution, and categorization
              </p>
            </div>
            <form onSubmit={handleUpdateRule} className="mt-4 space-y-4">
              <div>
                <Label className="text-xs text-[#8892b0]">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 rounded-xl border-[#233554] bg-[#0a192f] text-[#ccd6f6] focus:border-[#64ffda]"
                  required
                />
              </div>

              <div>
                <Label className="text-xs text-[#8892b0]">Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5 rounded-xl border-[#233554] bg-[#0a192f] font-mono text-[#ccd6f6] focus:border-[#64ffda]"
                  required
                />
              </div>

              {scope === 'FAMILY' && (
                <div>
                  <Label className="text-xs text-[#8892b0]">Attribution</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleParty('FAMILY')}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        selectedParties.includes('FAMILY')
                          ? 'border-[#64ffda] bg-[#64ffda]/10 text-[#64ffda]'
                          : 'border-[#233554] bg-[#0a192f] text-[#8892b0] hover:text-[#ccd6f6]'
                      }`}
                    >
                      Entire Household
                    </button>
                    {members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleParty(m.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          selectedParties.includes(m.id)
                            ? 'border-[#64ffda] bg-[#64ffda]/10 text-[#64ffda]'
                            : 'border-[#233554] bg-[#0a192f] text-[#8892b0] hover:text-[#ccd6f6]'
                        }`}
                      >
                        {m.name || m.email}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <FrequencySelector value={frequency} onChange={setFrequency} />

              <div>
                <Label className="text-xs text-[#8892b0]">Next Run Date</Label>
                <Input
                  type="date"
                  value={nextRunAt}
                  onChange={(e) => setNextRunAt(e.target.value)}
                  className="mt-1.5 rounded-xl border-[#233554] bg-[#0a192f] text-[#ccd6f6] focus:border-[#64ffda]"
                  required
                />
              </div>

              <div>
                <CategoryPicker
                  scope={scope}
                  categoryType={kind}
                  familyId={familyId}
                  value={categoryName}
                  onSelect={(cat) => {
                    setCategoryId(cat.id)
                    setCategoryName(cat.name)
                  }}
                  label={isIncome ? 'Income Category' : 'Expense Category'}
                />
              </div>

              <div>
                <DocumentUploader
                  documentId={documentId}
                  documentName={documentName}
                  onDocumentChange={(id, docName) => {
                    setDocumentId(id)
                    setDocumentName(docName ?? null)
                  }}
                  familyId={familyId}
                  isPersonal={isPersonal}
                  label={isIncome ? 'Payslip / Income Proof' : 'Receipt / Invoice Attachment'}
                  hint="Attach receipt or proof"
                />
              </div>

              {scope === 'FAMILY' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="letEditRule"
                    checked={letEveryoneEdit}
                    onChange={(e) => setLetEveryoneEdit(e.target.checked)}
                    className="h-4 w-4 rounded border-[#233554] bg-[#0a192f] text-[#64ffda] focus:ring-[#64ffda]"
                  />
                  <label htmlFor="letEditRule" className="cursor-pointer text-xs text-[#ccd6f6]">
                    Let all household members edit this entry
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2.5 border-t border-[#233554]/60 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingRule(null)}
                  className="border-[#233554] px-5 text-[#8892b0] hover:text-[#ccd6f6]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#64ffda] px-6 font-semibold text-[#0a192f] shadow-md hover:bg-[#64ffda]/90"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </FosModalOverlay>
      )}
    </div>
  )
}
