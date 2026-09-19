import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { AppShell } from "#/components/layout/app-shell"
import { BentoCard, BentoGrid } from "#/components/bento/bento"
import { Button } from "#/components/ui/button"
import { Badge } from "#/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "#/components/ui/dialog"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select"
import { Switch } from "#/components/ui/switch"
import { FrequencySelector } from "#/components/common/frequency-selector"
import { DocumentUploader } from "#/components/common/document-uploader"
import { useCreateInsurance, useDeleteInsurance, useInsurance, useUpdateInsurance } from "#/hooks/api/familyos/use-insurance"
import { useScope } from "#/hooks/use-scope"
import { ApiError, familiesApi, isNetworkError, documentsApi } from "#/lib/api"
import type { InsuranceSummary } from "#/lib/api/familyos/types"
import { formatCurrency } from "#/lib/format"
import { toast } from "sonner"
import { ShieldCheckIcon, PaperclipIcon, PlusIcon, PencilIcon, Trash2Icon, CalendarIcon } from "lucide-react"

interface Search {
  scope?: string
}

const INSURANCE_TYPES = [
  { value: "HEALTH", label: "Health / Medical" },
  { value: "LIFE", label: "Life / Term" },
  { value: "VEHICLE", label: "Vehicle (Car / Bike)" },
  { value: "HOME", label: "Home / Property" },
  { value: "TRAVEL", label: "Travel" },
  { value: "CRITICAL_ILLNESS", label: "Critical Illness" },
  { value: "OTHER", label: "Other" },
]

export const Route = createFileRoute("/_authenticated/insurance/$familyId")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    scope: typeof search.scope === "string" ? search.scope : undefined,
  }),
  beforeLoad: async ({ params }) => {
    if (typeof document === "undefined") return
    try {
      const { items } = await familiesApi.list()
      if (!items.some((f) => f.id === params.familyId)) {
        throw redirect({ to: "/families" })
      }
    } catch (error) {
      if (isRedirect(error)) throw error
      if (!isNetworkError(error)) throw error
    }
  },
  component: InsurancePage,
})

function InsurancePage() {
  const { familyId } = Route.useParams()
  const { scope } = useScope()
  const { data, isLoading } = useInsurance(familyId, scope)
  const createInsurance = useCreateInsurance(familyId, scope)
  const updateInsurance = useUpdateInsurance(familyId, scope)
  const deleteInsurance = useDeleteInsurance(familyId, scope)

  // Create state
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("HEALTH")
  const [provider, setProvider] = useState("")
  const [policyNumber, setPolicyNumber] = useState("")
  const [coverage, setCoverage] = useState("")
  const [recurring, setRecurring] = useState(false)
  const [totalToPay, setTotalToPay] = useState("")
  const [emiCount, setEmiCount] = useState("12")
  const [frequency, setFrequency] = useState("MONTHLY")
  const [nextDate, setNextDate] = useState("")
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [documentName, setDocumentName] = useState<string | null>(null)

  // Edit state
  const [editOpen, setEditOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<InsuranceSummary | null>(null)
  const [editName, setEditName] = useState("")
  const [editType, setEditType] = useState("HEALTH")
  const [editProvider, setEditProvider] = useState("")
  const [editPolicyNumber, setEditPolicyNumber] = useState("")
  const [editCoverage, setEditCoverage] = useState("")
  const [editPremium, setEditPremium] = useState("")
  const [editNextDate, setEditNextDate] = useState("")

  const emiPreview = (() => {
    const total = Number(totalToPay || 0)
    const n = Number(emiCount || 0)
    if (!recurring || total <= 0 || n < 1) return 0
    return Math.round((total / n) * 100) / 100
  })()

  const startEdit = (policy: InsuranceSummary) => {
    setEditingPolicy(policy)
    setEditName(policy.insuranceName || "")
    setEditType(policy.type || "HEALTH")
    setEditProvider(policy.provider || "")
    setEditPolicyNumber(policy.policyNumber || "")
    setEditCoverage(String(policy.coverageAmount ?? ""))
    setEditPremium(String(policy.premiumAmount ?? ""))
    setEditNextDate(policy.nextPremiumDate ? String(policy.nextPremiumDate).slice(0, 10) : "")
    setEditOpen(true)
  }

  const submitCreate = () => {
    const c = Number(coverage || 0)
    if (!name.trim()) {
      toast.error("Enter policy name.")
      return
    }
    const n = Number(emiCount || 0)
    const total = Number(totalToPay || 0)
    if (recurring && (total <= 0 || n < 1 || !nextDate)) {
      toast.error("Enter total to pay, EMI count, and first payment date.")
      return
    }
    createInsurance.mutate(
      {
        insurance_name: name.trim(),
        type,
        provider: provider.trim() || undefined,
        policy_number: policyNumber.trim() || undefined,
        coverage_amount: c,
        premium_amount: recurring ? total : 0,
        premium_every: recurring ? frequency.toUpperCase() : undefined,
        next_premium_date: recurring && nextDate ? new Date(nextDate).toISOString() : undefined,
        emi_count: recurring ? n : undefined,
        document_id: documentId || undefined,
        is_personal: scope.kind === "personal",
      } as any,
      {
        onSuccess: () => {
          toast.success("Insurance policy created")
          setOpen(false)
          setName("")
          setType("HEALTH")
          setProvider("")
          setPolicyNumber("")
          setCoverage("")
          setRecurring(false)
          setTotalToPay("")
          setEmiCount("12")
          setFrequency("MONTHLY")
          setNextDate("")
          setDocumentId(null)
          setDocumentName(null)
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create insurance"),
      },
    )
  }

  const submitEdit = () => {
    if (!editingPolicy) return
    if (!editName.trim()) {
      toast.error("Enter policy name.")
      return
    }
    const cov = Number(editCoverage || 0)
    const prem = Number(editPremium || 0)
    if (cov < 0 || prem < 0) {
      toast.error("Enter valid cover and premium amounts.")
      return
    }
    updateInsurance.mutate(
      {
        insuranceId: editingPolicy.id,
        body: {
          insurance_name: editName.trim(),
          type: editType,
          provider: editProvider.trim() || undefined,
          policy_number: editPolicyNumber.trim() || undefined,
          coverage_amount: cov,
          premium_amount: prem,
          next_premium_date: editNextDate ? new Date(editNextDate).toISOString() : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Policy updated")
          setEditOpen(false)
          setEditingPolicy(null)
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Failed to update insurance"),
      },
    )
  }

  const getDocUrl = (docId: string) => {
    if (scope.kind === "personal") {
      return documentsApi.userContentUrl(docId)
    }
    return documentsApi.contentUrl(familyId, docId)
  }

  const items = data?.items ?? []

  return (
    <AppShell familyId={familyId}>
      <BentoGrid>
        <BentoCard className="col-span-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-[#ccd6f6]">
                {scope.kind === "personal" ? "Personal Insurance Policies" : "Family Insurance Policies"}
              </h1>
              <p className="mt-0.5 text-sm text-[#8892b0]">
                Active health, life, vehicle, and property cover policies with premium tracking.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setName("")
                setType("HEALTH")
                setProvider("")
                setPolicyNumber("")
                setCoverage("")
                setRecurring(false)
                setTotalToPay("")
                setEmiCount("12")
                setFrequency("MONTHLY")
                setNextDate("")
                setDocumentId(null)
                setDocumentName(null)
                setOpen(true)
              }}
              className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold shadow"
            >
              <PlusIcon className="mr-1.5 h-4 w-4" /> Add Policy
            </Button>
          </div>

          {isLoading && <p className="mt-4 text-sm text-[#8892b0]">Loading policies…</p>}

          {!isLoading && items.length === 0 && (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#233554] p-8 text-center bg-[#0a192f]/40">
              <div className="rounded-full bg-[#112240] p-3 text-[#64ffda] mb-3">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-[#ccd6f6]">No insurance policies yet</h3>
              <p className="mt-1 max-w-sm text-xs text-[#8892b0]">
                Add health cover, term life, vehicle insurance, or property policies to keep track of renewal schedules and documents.
              </p>
              <Button
                size="sm"
                onClick={() => setOpen(true)}
                className="mt-4 bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold"
              >
                <PlusIcon className="mr-1.5 h-4 w-4" /> Add Your First Policy
              </Button>
            </div>
          )}

          <ul className="mt-4 space-y-2.5">
            {items.map((policy) => (
              <li
                key={policy.id}
                className="rounded-2xl border border-[#233554]/90 bg-[#112240]/80 p-4 text-sm shadow transition hover:border-[#64ffda]/30"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#ccd6f6]">{policy.insuranceName}</span>
                      <Badge variant="outline" className="border-[#233554] bg-[#0a192f] text-[#64ffda] text-xs">
                        {policy.type}
                      </Badge>
                      {policy.isPersonal && (
                        <Badge variant="secondary" className="bg-[#233554] text-[#ccd6f6] text-xs">
                          Personal
                        </Badge>
                      )}
                      {policy.documentId && (
                        <a
                          href={getDocUrl(policy.documentId)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-[#64ffda]/10 px-2.5 py-0.5 text-xs font-semibold text-[#64ffda] hover:bg-[#64ffda]/20 transition"
                          title="View Policy Document"
                        >
                          <PaperclipIcon className="h-3 w-3" /> Policy Doc
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8892b0]">
                      {policy.provider && (
                        <span>Provider: <strong className="text-[#ccd6f6] font-medium">{policy.provider}</strong></span>
                      )}
                      {policy.policyNumber && (
                        <span>Policy #: <strong className="text-[#ccd6f6] font-mono">{policy.policyNumber}</strong></span>
                      )}
                      {policy.nextPremiumDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3 text-[#64ffda]" />
                          <span>Next premium: {String(policy.nextPremiumDate).slice(0, 10)}</span>
                          {policy.premiumEvery && (
                            <span className="text-[#8892b0]">({policy.premiumEvery.toLowerCase()})</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-0.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#233554]/50">
                    <span className="font-mono text-base font-bold text-[#ccd6f6]">
                      {formatCurrency(Number(policy.coverageAmount))} cover
                    </span>
                    {Number(policy.premiumAmount) > 0 && (
                      <span className="text-xs text-[#8892b0]">
                        Premium: <strong className="text-[#64ffda] font-mono">{formatCurrency(Number(policy.premiumAmount))}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2 border-t border-[#233554]/60 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#233554] text-[#8892b0] hover:text-[#ccd6f6]"
                    onClick={() => startEdit(policy)}
                  >
                    <PencilIcon className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="bg-[#f87171]/20 text-[#f87171] hover:bg-[#f87171]/30 border-0"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete policy "${policy.insuranceName}"?`)) {
                        deleteInsurance.mutate(policy.id, {
                          onSuccess: () => toast.success("Insurance deleted"),
                          onError: (err) =>
                            toast.error(err instanceof ApiError ? err.message : "Failed to delete insurance"),
                        })
                      }
                    }}
                  >
                    <Trash2Icon className="mr-1 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </BentoCard>
      </BentoGrid>

      {/* CREATE INSURANCE MODAL - SINGLE COLUMN */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Insurance</DialogTitle>
            <DialogDescription>Add a family or personal insurance policy with premium schedule and policy bond attachment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Policy Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Star Health Comprehensive, HDFC Life Term Plan"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Insurance Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#112240] border-[#233554] text-[#ccd6f6]">
                  {INSURANCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Provider / Insurer (optional)</Label>
              <Input
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. Star Health, HDFC ERGO, ICICI Lombard, LIC"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Policy / Certificate Number (optional)</Label>
              <Input
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="e.g. POL-99201948"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] font-mono focus:border-[#64ffda]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Total Cover Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={coverage}
                onChange={(e) => setCoverage(e.target.value)}
                placeholder="1000000.00"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] font-mono focus:border-[#64ffda]"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#233554] bg-[#0a192f]/60 p-3">
              <div>
                <p className="text-sm font-semibold text-[#ccd6f6]">Recurring Policy Premium</p>
                <p className="text-xs text-[#8892b0]">Maps recurring schedule for premium payments.</p>
              </div>
              <Switch checked={recurring} onCheckedChange={setRecurring} />
            </div>

            {recurring && (
              <div className="rounded-xl border border-[#233554] bg-[#0a192f]/40 p-3.5 space-y-3.5">
                <div className="space-y-1">
                  <Label className="text-xs text-[#8892b0]">Total Annual Premium</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalToPay}
                    onChange={(e) => setTotalToPay(e.target.value)}
                    className="bg-[#112240] border-[#233554] text-[#ccd6f6] font-mono"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-[#8892b0]">Number of Payments</Label>
                  <Input
                    type="number"
                    min="1"
                    value={emiCount}
                    onChange={(e) => setEmiCount(e.target.value)}
                    className="bg-[#112240] border-[#233554] text-[#ccd6f6]"
                  />
                </div>

                {emiPreview > 0 && (
                  <p className="text-xs text-[#8892b0]">
                    Payment per cycle: <strong className="text-[#64ffda] font-mono">{formatCurrency(emiPreview)}</strong>
                  </p>
                )}

                <div className="space-y-1">
                  <FrequencySelector
                    value={frequency}
                    onChange={setFrequency}
                    label="Premium Payment Cadence"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-[#8892b0]">First Payment Date</Label>
                  <Input
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="bg-[#112240] border-[#233554] text-[#ccd6f6]"
                  />
                </div>
              </div>
            )}

            {/* Document Uploader */}
            <DocumentUploader
              documentId={documentId}
              documentName={documentName}
              onDocumentChange={(id, name) => {
                setDocumentId(id)
                setDocumentName(name ?? null)
              }}
              familyId={familyId}
              isPersonal={scope.kind === "personal"}
              label="Policy Document / Certificate"
              hint="Attach policy schedule, bond, or health card"
            />

            {scope.kind === "family" && (
              <p className="text-xs text-[#8892b0]">
                This creates a family policy. Manage personal insurance under Personal → Insurance.
              </p>
            )}
          </div>
          <DialogFooter className="border-t border-[#233554]/60 pt-3">
            <Button variant="outline" onClick={() => setOpen(false)} className="border-[#233554] text-[#8892b0] hover:text-[#ccd6f6]">
              Cancel
            </Button>
            <Button
              onClick={submitCreate}
              disabled={createInsurance.isPending}
              className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold shadow"
            >
              Save Insurance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT INSURANCE MODAL - SINGLE COLUMN */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>Update the details and premium schedule of this policy.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Policy Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Policy name"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Insurance Type</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#112240] border-[#233554] text-[#ccd6f6]">
                  {INSURANCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Provider / Insurer (optional)</Label>
              <Input
                value={editProvider}
                onChange={(e) => setEditProvider(e.target.value)}
                placeholder="Provider name"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Policy Number (optional)</Label>
              <Input
                value={editPolicyNumber}
                onChange={(e) => setEditPolicyNumber(e.target.value)}
                placeholder="Policy number"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] font-mono focus:border-[#64ffda]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Total Cover Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editCoverage}
                onChange={(e) => setEditCoverage(e.target.value)}
                placeholder="0.00"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] font-mono focus:border-[#64ffda]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Premium Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editPremium}
                onChange={(e) => setEditPremium(e.target.value)}
                placeholder="0.00"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] font-mono focus:border-[#64ffda]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Next Premium Date (optional)</Label>
              <Input
                type="date"
                value={editNextDate}
                onChange={(e) => setEditNextDate(e.target.value)}
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6]"
              />
            </div>
          </div>
          <DialogFooter className="border-t border-[#233554]/60 pt-3">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="border-[#233554] text-[#8892b0] hover:text-[#ccd6f6]">
              Cancel
            </Button>
            <Button
              onClick={submitEdit}
              disabled={updateInsurance.isPending}
              className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold shadow"
            >
              Update Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
