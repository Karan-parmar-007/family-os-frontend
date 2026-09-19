import { useState, useEffect } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { useFamilyMembers } from '#/hooks/api/familyos/use-families'
import { apiFetch } from '#/lib/api/familyos/client'
import { documentsApi } from '#/lib/api/familyos/endpoints/documents'
import { FrequencySelector } from '#/components/common/frequency-selector'
import { DocumentUploader } from '#/components/common/document-uploader'
import { CategoryPicker } from '#/components/common/category-picker'
import { FosModalOverlay } from '#/components/ui/fos-modal'
import { toast } from 'sonner'
import {
  LandmarkIcon,
  PlusIcon,
  Trash2Icon,
  CheckCircle2Icon,
  AlertCircleIcon,
  CalendarIcon,
  PaperclipIcon,
} from 'lucide-react'

interface Debt {
  id: string
  scope: 'FAMILY' | 'PERSONAL'
  familyId?: string
  ownerType: 'MEMBER' | 'FAMILY' | 'SELF'
  ownerUserId?: string
  name: string
  amount: number
  categoryId?: string | null
  amountPaid: number
  remainingAmount: number
  hasEmi: boolean
  addEmiToPaid: boolean
  linkedRuleId?: string
  documentId?: string
  letEveryoneEdit: boolean
  createdBy: string
  status: 'OPEN' | 'SETTLED'
  createdAt: string
  updatedAt: string
}

interface DebtListResponse {
  items: Debt[]
  total: number
}

interface DebtsWorkspaceProps {
  familyId: string
  scope?: { kind: 'family' | 'personal'; familyId?: string }
  hideTitle?: boolean
}

export function DebtsWorkspace({ familyId, scope: scopeProp, hideTitle }: DebtsWorkspaceProps) {
  const isPersonal = scopeProp?.kind === 'personal'
  const scopeStr = isPersonal ? 'PERSONAL' : 'FAMILY'

  const { data: membersData } = useFamilyMembers(familyId)
  const members = membersData?.items || []

  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false)
  const [editDebt, setEditDebt] = useState<Debt | null>(null)
  const [newAmountPaid, setNewAmountPaid] = useState<string>('')

  // Create Form State
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [amountPaid, setAmountPaid] = useState('0')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({})
  const [ownerType, setOwnerType] = useState<'FAMILY' | 'MEMBER' | 'SELF'>('FAMILY')
  const [ownerUserId, setOwnerUserId] = useState('')
  const [hasEmi, setHasEmi] = useState(false)
  const [emiAmount, setEmiAmount] = useState('')
  const [frequency, setFrequency] = useState('MONTHLY')
  const [nextEmiDate, setNextEmiDate] = useState('')
  const [addEmiToPaid, setAddEmiToPaid] = useState(true)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [documentName, setDocumentName] = useState<string | null>(null)
  const [letEveryoneEdit, setLetEveryoneEdit] = useState(true)

  const fetchDebts = async () => {
    setLoading(true)
    try {
      const url = `/api/familyos/debts?scope=${scopeStr}${scopeStr === 'FAMILY' ? `&family_id=${familyId}` : ''}`
      const catUrl = `/api/familyos/categories?scope=${scopeStr}&category_type=DEBT${scopeStr === 'FAMILY' ? `&family_id=${familyId}` : ''}`
      const [res, catsRes] = await Promise.all([
        apiFetch<DebtListResponse>(url),
        apiFetch<{ items: { id: string; name: string }[] }>(catUrl).catch(() => ({ items: [] })),
      ])
      setDebts(res.items || [])
      const cMap: Record<string, string> = {}
      ;(catsRes.items || []).forEach((c) => { cMap[c.id] = c.name })
      setCategoriesMap(cMap)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load debts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebts()
  }, [familyId, scopeStr])

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmt = parseFloat(amount)
    const parsedPaid = parseFloat(amountPaid || '0')
    if (!name.trim() || isNaN(parsedAmt) || parsedAmt <= 0) {
      toast.error('Please enter a valid debt name and amount')
      return
    }
    if (parsedPaid > parsedAmt) {
      toast.error('Amount paid cannot exceed total debt amount')
      return
    }

    try {
      await apiFetch('/api/familyos/debts', {
        method: 'POST',
        json: {
          scope: scopeStr,
          familyId: scopeStr === 'FAMILY' ? familyId : null,
          ownerType: isPersonal ? 'SELF' : ownerType,
          ownerUserId: !isPersonal && ownerType === 'MEMBER' ? ownerUserId : null,
          categoryId: categoryId || null,
          name: name.trim(),
          amount: parsedAmt,
          amountPaid: parsedPaid,
          hasEmi,
          emiAmount: hasEmi && emiAmount ? parseFloat(emiAmount) : null,
          frequency: hasEmi ? frequency.toUpperCase() : null,
          nextEmiDate: hasEmi && nextEmiDate ? new Date(nextEmiDate).toISOString() : null,
          addEmiToPaid,
          documentId: documentId || null,
          letEveryoneEdit,
        },
      })
      toast.success('Debt tracker created')
      setCreateOpen(false)
      resetForm()
      fetchDebts()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create debt')
    }
  }

  const handleUpdateAmountPaid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editDebt) return
    const parsed = parseFloat(newAmountPaid)
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Please enter a valid amount paid')
      return
    }

    try {
      await apiFetch(`/api/familyos/debts/${editDebt.id}`, {
        method: 'PATCH',
        json: { amountPaid: parsed },
      })
      toast.success('Amount paid updated')
      setEditDebt(null)
      fetchDebts()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update debt')
    }
  }

  const handleDeleteDebt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this debt? If an active EMI rule is linked, it will be removed.')) return
    try {
      await apiFetch(`/api/familyos/debts/${id}`, { method: 'DELETE' })
      toast.success('Debt deleted')
      fetchDebts()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete debt')
    }
  }

  const resetForm = () => {
    setName('')
    setAmount('')
    setCategoryId(null)
    setCategoryName('')
    setAmountPaid('0')
    setOwnerType('FAMILY')
    setOwnerUserId('')
    setHasEmi(false)
    setEmiAmount('')
    setFrequency('MONTHLY')
    setNextEmiDate('')
    setAddEmiToPaid(true)
    setDocumentId(null)
    setDocumentName(null)
    setLetEveryoneEdit(true)
  }

  const getDocUrl = (docId: string) => {
    if (isPersonal || !familyId) {
      return documentsApi.userContentUrl(docId)
    }
    return documentsApi.contentUrl(familyId, docId)
  }

  // Summary Metrics
  const totalDebt = debts.reduce((acc, d) => acc + d.amount, 0)
  const totalPaid = debts.reduce((acc, d) => acc + d.amountPaid, 0)
  const totalRemaining = debts.reduce((acc, d) => acc + d.remainingAmount, 0)

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {!hideTitle && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-[#233554] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <LandmarkIcon className="h-6 w-6 text-[#64ffda]" />
              <h1 className="text-2xl font-bold tracking-tight text-[#ccd6f6]">
                {isPersonal ? 'Personal Debts & Loans' : 'Family Debts & Loans'}
              </h1>
            </div>
            <p className="text-sm text-[#8892b0]">
              {isPersonal
                ? 'Track your individual loans, mortgages, custom payment intervals, and contracts.'
                : 'Centralize household mortgages, car loans, member obligations, and document records.'}
            </p>
          </div>

          <Button
            onClick={() => {
              resetForm()
              setCreateOpen(true)
            }}
            className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold shadow transition "
          >
            <PlusIcon className="mr-1.5 h-4 w-4" /> Add Debt Tracker
          </Button>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#233554]/80 bg-[#112240]/90 backdrop-blur-md p-5 shadow">
          <p className="text-xs font-medium text-[#8892b0]">Total Original Amount</p>
          <p className="mt-2 text-2xl font-bold font-mono text-[#ccd6f6]">
            ${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-[#233554]/80 bg-[#112240]/90 backdrop-blur-md p-5 shadow">
          <p className="text-xs font-medium text-[#8892b0]">Total Amount Paid Off</p>
          <p className="mt-2 text-2xl font-bold font-mono text-[#64ffda]">
            ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-[#233554]/80 bg-[#112240]/90 backdrop-blur-md p-5 shadow">
          <p className="text-xs font-medium text-[#8892b0]">Outstanding Balance</p>
          <p className="mt-2 text-2xl font-bold font-mono text-[#f87171]">
            ${totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Debt Cards List */}
      {loading ? (
        <div className="rounded-2xl border border-[#233554]/80 bg-[#112240]/70 backdrop-blur-md p-12 text-center text-[#8892b0]">
          Loading debts…
        </div>
      ) : debts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#233554] p-12 text-center text-[#8892b0]">
          <LandmarkIcon className="mx-auto h-10 w-10 text-[#8892b0]/50 mb-3" />
          <p className="text-base font-semibold text-[#ccd6f6]">No debts registered</p>
          <p className="mt-1 text-sm">Add mortgages, auto loans, or personal loans to track payoffs.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {debts.map((d) => {
            const percentPaid = d.amount > 0 ? Math.min(100, (d.amountPaid / d.amount) * 100) : 0
            const memberObj = members.find((m) => m.id === d.ownerUserId)

            return (
              <div
                key={d.id}
                className="rounded-2xl border border-[#233554]/90 bg-[#112240]/90 backdrop-blur-md p-5 shadow transition-all hover:border-[#64ffda]/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-[#ccd6f6]">{d.name}</h3>
                        {d.categoryId && categoriesMap[d.categoryId] && (
                          <span className="inline-block rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                            {categoriesMap[d.categoryId]}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            d.status === 'SETTLED'
                              ? 'bg-[#64ffda]/10 text-[#64ffda]'
                              : 'bg-[#f87171]/10 text-[#f87171]'
                          }`}
                        >
                          {d.status === 'SETTLED' ? (
                            <>
                              <CheckCircle2Icon className="h-3 w-3" /> Settled
                            </>
                          ) : (
                            <>
                              <AlertCircleIcon className="h-3 w-3" /> Open
                            </>
                          )}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-[#8892b0]">
                        Obligation:{' '}
                        <strong className="text-[#ccd6f6]">
                          {d.ownerType === 'FAMILY'
                            ? 'Entire Household'
                            : d.ownerType === 'SELF'
                            ? 'Personal'
                            : memberObj?.name || 'Specific Member'}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {d.documentId && (
                        <a
                          href={getDocUrl(d.documentId)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#64ffda] hover:text-[#64ffda]/80 p-1.5 transition rounded-lg hover:bg-[#172a45]"
                          title="View Loan Document"
                        >
                          <PaperclipIcon className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteDebt(d.id)}
                        className="text-[#8892b0] hover:text-[#f87171] p-1.5 transition rounded-lg hover:bg-[#172a45]"
                        title="Delete Debt"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Amounts */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8892b0]">
                        Paid: <strong className="text-[#64ffda] font-mono">${d.amountPaid.toFixed(2)}</strong>
                      </span>
                      <span className="text-[#8892b0]">
                        Remaining: <strong className="text-[#f87171] font-mono">${d.remainingAmount.toFixed(2)}</strong>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#0a192f]">
                      <div
                        className="h-full bg-gradient-to-r from-[#64ffda] to-[#20c997] transition-all duration-500"
                        style={{ width: `${percentPaid}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Badges */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#233554]/60 text-xs text-[#8892b0]">
                  {d.hasEmi ? (
                    <span className="inline-flex items-center gap-1 text-[#64ffda]">
                      <CalendarIcon className="h-3 w-3" /> Auto-Mapped EMI
                    </span>
                  ) : (
                    <span>Manual tracking</span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEditDebt(d)
                      setNewAmountPaid(d.amountPaid.toString())
                    }}
                    className="text-[#64ffda] hover:underline font-medium"
                  >
                    Adjust Paid Amount →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Debt Modal */}
      {createOpen && (
        <FosModalOverlay>
          <div className="w-full max-w-xl rounded-2xl border border-[#233554]/90 bg-[#112240]/95 p-6 sm:p-7 text-[#ccd6f6] shadow-[0_25px_60px_rgba(2,12,27,0.85)] ring-1 ring-white/5 max-h-[88vh] overflow-y-auto my-auto">
            <h2 className="text-xl font-bold text-[#e6f1ff] tracking-tight">Add Debt Tracker</h2>
            <form onSubmit={handleCreateDebt} className="mt-4 space-y-4">
              <div>
                <Label className="text-xs text-[#8892b0]">Debt Name</Label>
                <Input
                  placeholder="e.g. Car Loan, Home Mortgage, Personal Loan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#8892b0]">Full Total Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="10000.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1.5 bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda] font-mono"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#8892b0]">Amount Already Paid</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="mt-1.5 bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda] font-mono"
                  />
                </div>
              </div>

              {!isPersonal && (
                <div>
                  <Label className="text-xs text-[#8892b0]">Debt Owner</Label>
                  <div className="mt-1.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOwnerType('FAMILY')}
                      className={`flex-1 rounded-md border p-2 text-xs font-semibold transition ${
                        ownerType === 'FAMILY'
                          ? 'border-[#64ffda] bg-[#64ffda]/10 text-[#64ffda]'
                          : 'border-[#233554] text-[#8892b0] hover:text-[#ccd6f6]'
                      }`}
                    >
                      Entire Household
                    </button>
                    <button
                      type="button"
                      onClick={() => setOwnerType('MEMBER')}
                      className={`flex-1 rounded-md border p-2 text-xs font-semibold transition ${
                        ownerType === 'MEMBER'
                          ? 'border-[#64ffda] bg-[#64ffda]/10 text-[#64ffda]'
                          : 'border-[#233554] text-[#8892b0] hover:text-[#ccd6f6]'
                      }`}
                    >
                      Specific Member
                    </button>
                  </div>

                  {ownerType === 'MEMBER' && (
                    <select
                      value={ownerUserId}
                      onChange={(e) => setOwnerUserId(e.target.value)}
                      className="mt-2 w-full rounded-md border border-[#233554] bg-[#0a192f] p-2.5 text-sm text-[#ccd6f6] focus:border-[#64ffda]"
                      required
                    >
                      <option value="">Select family member</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Recurring EMI Mapping Toggle */}
              <div className="rounded-xl border border-[#233554] bg-[#0a192f] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#ccd6f6]">Map Recurring EMI Expense</p>
                    <p className="text-xs text-[#8892b0]">
                      Automatically deducts EMI from savings pool on schedule.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasEmi}
                    onChange={(e) => setHasEmi(e.target.checked)}
                    className="h-4 w-4 rounded border-[#233554] bg-[#112240] text-[#64ffda] focus:ring-[#64ffda]"
                  />
                </div>

                {hasEmi && (
                  <div className="space-y-3 pt-2 border-t border-[#233554]">
                    <div>
                      <Label className="text-xs text-[#8892b0]">EMI Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="500.00"
                        value={emiAmount}
                        onChange={(e) => setEmiAmount(e.target.value)}
                        className="mt-1 bg-[#112240] border-[#233554] text-[#ccd6f6] font-mono"
                        required
                      />
                    </div>

                    <FrequencySelector
                      value={frequency}
                      onChange={setFrequency}
                      label="EMI Cadence / Frequency"
                    />

                    <div>
                      <Label className="text-xs text-[#8892b0]">Next EMI Date</Label>
                      <Input
                        type="date"
                        value={nextEmiDate}
                        onChange={(e) => setNextEmiDate(e.target.value)}
                        className="mt-1 bg-[#112240] border-[#233554] text-[#ccd6f6]"
                        required
                      />
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="addEmi"
                        checked={addEmiToPaid}
                        onChange={(e) => setAddEmiToPaid(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-[#233554] bg-[#112240] text-[#64ffda]"
                      />
                      <label htmlFor="addEmi" className="text-xs text-[#8892b0]">
                        <strong className="text-[#ccd6f6]">Add EMI amount to Amount paid</strong> once each time the EMI applies.
                      </label>
                    </div>
                  </div>
                )}
              </div>

                            {/* Debt Category Picker */}
              <CategoryPicker
                scope={scopeStr}
                categoryType="DEBT"
                familyId={familyId}
                value={categoryName}
                onSelect={(cat) => {
                  setCategoryId(cat.id)
                  setCategoryName(cat.name)
                }}
                label="Debt Category"
              />

              {/* Document Attachment */}
              <DocumentUploader
                documentId={documentId}
                documentName={documentName}
                onDocumentChange={(id, docName) => {
                  setDocumentId(id)
                  setDocumentName(docName ?? null)
                }}
                familyId={familyId}
                isPersonal={isPersonal}
                label="Loan Agreement / Sanction Letter"
                hint="Attach contract or statement"
              />

              {!isPersonal && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="letEdit"
                    checked={letEveryoneEdit}
                    onChange={(e) => setLetEveryoneEdit(e.target.checked)}
                    className="h-4 w-4 rounded border-[#233554] bg-[#0a192f] text-[#64ffda]"
                  />
                  <label htmlFor="letEdit" className="text-xs text-[#ccd6f6] cursor-pointer">
                    Let all household members edit this debt
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#233554]/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  className="border-[#233554] text-[#8892b0] hover:text-[#ccd6f6]"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold shadow">
                  Save Debt
                </Button>
              </div>
            </form>
          </div>
        </FosModalOverlay>
      )}

      {/* Quick Edit Amount Paid Modal */}
      {editDebt && (
        <FosModalOverlay>
          <div className="w-full max-w-md rounded-2xl border border-[#233554]/90 bg-[#112240]/95 p-6 text-[#ccd6f6] shadow-[0_25px_60px_rgba(2,12,27,0.85)] ring-1 ring-white/5 max-h-[85vh] overflow-y-auto my-auto">
            <h2 className="text-xl font-bold text-[#e6f1ff] tracking-tight">Update Amount Paid</h2>
            <p className="mt-1 text-sm text-[#8892b0]">
              Updating amount paid for <strong className="text-[#ccd6f6]">{editDebt.name}</strong> (Total: ${editDebt.amount.toFixed(2)}).
            </p>
            <form onSubmit={handleUpdateAmountPaid} className="mt-4 space-y-4">
              <div>
                <Label className="text-xs text-[#8892b0]">Total Amount Paid So Far</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newAmountPaid}
                  onChange={(e) => setNewAmountPaid(e.target.value)}
                  className="mt-1.5 bg-[#0a192f] border-[#233554] text-[#ccd6f6] font-mono focus:border-[#64ffda]"
                  required
                />
                <p className="mt-1 text-[11px] text-[#8892b0]">
                  Remaining will be: ${(Math.max(0, editDebt.amount - parseFloat(newAmountPaid || '0'))).toFixed(2)}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#233554]/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDebt(null)}
                  className="border-[#233554] text-[#8892b0] hover:text-[#ccd6f6]"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold shadow">
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
