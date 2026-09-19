import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { AppShell } from "#/components/layout/app-shell"
import { BentoCard, BentoGrid } from "#/components/bento/bento"
import { Button } from "#/components/ui/button"
import { Badge } from "#/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "#/components/ui/dialog"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select"
import { Switch } from "#/components/ui/switch"
import { useAcceptTransfer, useCancelTransfer, useCreateTransfer, useDeclineTransfer, useTransfers } from "#/hooks/api/familyos/use-transfers"
import { useFamilies, useFamilyMembers } from "#/hooks/api/familyos/use-families"
import { useRelationships } from "#/hooks/api/familyos/use-relationships"
import { ApiError, familiesApi, isNetworkError } from "#/lib/api"
import { formatCurrency } from "#/lib/format"
import { toast } from "sonner"
import { ArrowLeftRightIcon, ArrowUpRightIcon, ArrowDownLeftIcon, PlusIcon, CalendarIcon, RepeatIcon } from "lucide-react"

interface Search {
  scope?: string
}

export const Route = createFileRoute("/_authenticated/transfers/$familyId")({
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
  component: TransfersPage,
})

function TransfersPage() {
  const { familyId } = Route.useParams()
  const { data: familiesData } = useFamilies()
  const { data: relData } = useRelationships(familyId)
  const { data: membersData } = useFamilyMembers(familyId)
  const { data, isLoading, isError } = useTransfers(familyId)
  const createTransfer = useCreateTransfer(familyId)
  const cancelTransfer = useCancelTransfer(familyId)
  const acceptTransfer = useAcceptTransfer(familyId)
  const declineTransfer = useDeclineTransfer(familyId)

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"all" | "sent" | "received">("all")
  const [transferKind, setTransferKind] = useState<"family" | "member" | "code" | "personalCode">("family")
  const [toFamilyId, setToFamilyId] = useState("")
  const [toUserId, setToUserId] = useState("")
  const [destCode, setDestCode] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringEvery, setRecurringEvery] = useState("MONTHLY")
  const [nextRunDate, setNextRunDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const allowedTargetFamilyIds = useMemo(() => {
    const active = (relData?.items ?? []).filter((r) => r.status === "ACTIVE")
    return active.map((r) => (r.familyAId === familyId ? r.familyBId : r.familyAId))
  }, [relData?.items, familyId])

  const familyOptions = useMemo(
    () => (familiesData?.items ?? []).filter((f) => allowedTargetFamilyIds.includes(f.id)),
    [familiesData?.items, allowedTargetFamilyIds],
  )
  const memberOptions = membersData?.items ?? []

  const resetForm = () => {
    setTransferKind("family")
    setToFamilyId("")
    setToUserId("")
    setDestCode("")
    setAmount("")
    setNote("")
    setIsRecurring(false)
    setRecurringEvery("MONTHLY")
    setNextRunDate("")
    setEndDate("")
  }

  const submit = () => {
    if (transferKind === "family" && !toFamilyId) {
      toast.error("Please select a target linked family.")
      return
    }
    if (transferKind === "member" && !toUserId) {
      toast.error("Please select a family member.")
      return
    }
    if ((transferKind === "code" || transferKind === "personalCode") && !destCode.trim()) {
      toast.error("Please enter the destination code.")
      return
    }
    const parsed = Number(amount || 0)
    if (parsed <= 0) {
      toast.error("Enter a valid amount.")
      return
    }
    if (isRecurring && !nextRunDate) {
      toast.error("Enter the first payment date for recurring transfers.")
      return
    }

    createTransfer.mutate(
      {
        fromScope: "FAMILY",
        toScope: transferKind === "member" || transferKind === "personalCode" ? "PERSONAL" : "FAMILY",
        toFamilyId: transferKind === "family" ? toFamilyId : undefined,
        toUserId: transferKind === "member" ? toUserId : undefined,
        destLinkCode: transferKind === "code" ? destCode.trim() : undefined,
        destPersonalCode: transferKind === "personalCode" ? destCode.trim() : undefined,
        amount: parsed,
        note: note.trim() || undefined,
        isRecurring,
        recurringEvery: isRecurring ? recurringEvery : undefined,
        nextRunDate: isRecurring && nextRunDate ? new Date(nextRunDate).toISOString() : undefined,
        endDate: isRecurring && endDate ? new Date(endDate).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          toast.success(isRecurring ? "Recurring transfer scheduled" : "Transfer offer sent — waiting for accept")
          setOpen(false)
          resetForm()
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create transfer"),
      },
    )
  }

  const filtered = useMemo(() => {
    const items = data?.items ?? []
    if (tab === "sent") return items.filter((t) => t.direction === "SENT")
    if (tab === "received") return items.filter((t) => t.direction === "RECEIVED")
    return items
  }, [data?.items, tab])

  return (
    <AppShell familyId={familyId}>
      <BentoGrid>
        <BentoCard className="col-span-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-[#ccd6f6]">Family Transfers</h1>
              <p className="mt-0.5 text-sm text-[#8892b0]">
                Transfer funds between connected families or disburse to member personal savings.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => { resetForm(); setOpen(true) }}
              className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold shadow"
            >
              <PlusIcon className="mr-1.5 h-4 w-4" /> New Transfer
            </Button>
          </div>

          {isError && (
            <p className="mt-4 text-sm text-[#f87171]">
              Transfers service is temporarily unavailable.
            </p>
          )}
          {isLoading && <p className="mt-4 text-sm text-[#8892b0]">Loading transfers…</p>}

          <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "sent" | "received")} className="mt-4">
            <TabsList className="bg-[#0a192f] border border-[#233554]">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#112240] data-[state=active]:text-[#64ffda]">
                All Transfers
              </TabsTrigger>
              <TabsTrigger value="sent" className="data-[state=active]:bg-[#112240] data-[state=active]:text-[#64ffda]">
                Sent
              </TabsTrigger>
              <TabsTrigger value="received" className="data-[state=active]:bg-[#112240] data-[state=active]:text-[#64ffda]">
                Received
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {!isLoading && filtered.length === 0 && (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#233554] p-8 text-center bg-[#0a192f]/40">
              <div className="rounded-full bg-[#112240] p-3 text-[#64ffda] mb-3">
                <ArrowLeftRightIcon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-[#ccd6f6]">No transfers found</h3>
              <p className="mt-1 max-w-sm text-xs text-[#8892b0]">
                {tab === "sent"
                  ? "You have not sent any transfers from this family yet."
                  : tab === "received"
                  ? "No incoming transfers waiting for acceptance."
                  : "Send money to a linked household, external family code, or a family member."}
              </p>
              {tab === "all" && (
                <Button
                  size="sm"
                  onClick={() => { resetForm(); setOpen(true) }}
                  className="mt-4 bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold"
                >
                  <PlusIcon className="mr-1.5 h-4 w-4" /> Start First Transfer
                </Button>
              )}
            </div>
          )}

          <ul className="mt-4 space-y-2.5">
            {filtered.map((transfer) => {
              const isReceived = transfer.direction === "RECEIVED"
              return (
                <li
                  key={transfer.id}
                  className="rounded-2xl border border-[#233554]/90 bg-[#112240]/80 p-4 text-sm shadow transition hover:border-[#64ffda]/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            isReceived
                              ? "border-[#64ffda]/30 bg-[#64ffda]/10 text-[#64ffda]"
                              : "border-[#60a5fa]/30 bg-[#60a5fa]/10 text-[#60a5fa]"
                          }
                        >
                          {isReceived ? (
                            <ArrowDownLeftIcon className="mr-1 h-3 w-3 inline" />
                          ) : (
                            <ArrowUpRightIcon className="mr-1 h-3 w-3 inline" />
                          )}
                          {transfer.direction ?? "SENT"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            transfer.status === "COMPLETED"
                              ? "border-[#64ffda]/40 text-[#64ffda]"
                              : transfer.status === "PENDING"
                              ? "border-[#fbbf24]/40 text-[#fbbf24]"
                              : "border-[#f87171]/40 text-[#f87171]"
                          }
                        >
                          {transfer.status}
                        </Badge>
                        <span className="font-semibold text-[#ccd6f6]">
                          {transfer.toScope === "PERSONAL" ? "To Member Personal" : "To Family"}
                        </span>
                        {transfer.isRecurring && (
                          <Badge variant="outline" className="border-[#a78bfa]/40 text-[#a78bfa] text-xs">
                            <RepeatIcon className="mr-1 h-3 w-3 inline" />
                            {transfer.recurringEvery?.toLowerCase()}
                          </Badge>
                        )}
                      </div>

                      {transfer.note && (
                        <p className="text-xs text-[#8892b0] italic">{transfer.note}</p>
                      )}

                      {transfer.nextRunDate && (
                        <p className="text-xs text-[#8892b0] flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3 text-[#8892b0]" />
                          <span>Scheduled: {String(transfer.nextRunDate).slice(0, 10)}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#233554]/50">
                      <span className="font-mono text-base font-bold text-[#ccd6f6]">
                        {formatCurrency(Number(transfer.amount))}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-[#233554]/60 pt-3">
                    {transfer.status === "PENDING" && transfer.direction === "RECEIVED" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold"
                          onClick={() =>
                            acceptTransfer.mutate(transfer.id, {
                              onSuccess: () => toast.success("Transfer accepted"),
                              onError: (err) =>
                                toast.error(err instanceof ApiError ? err.message : "Failed to accept"),
                            })
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#233554] text-[#8892b0] hover:text-[#ccd6f6]"
                          onClick={() =>
                            declineTransfer.mutate(transfer.id, {
                              onSuccess: () => toast.success("Offer declined"),
                              onError: (err) =>
                                toast.error(err instanceof ApiError ? err.message : "Failed to decline"),
                            })
                          }
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {transfer.status === "PENDING" && transfer.direction !== "RECEIVED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#f87171]/30 text-[#f87171] hover:bg-[#f87171]/20"
                        onClick={() =>
                          cancelTransfer.mutate(transfer.id, {
                            onSuccess: () => toast.success("Transfer cancelled"),
                            onError: (err) =>
                              toast.error(err instanceof ApiError ? err.message : "Failed to cancel transfer"),
                          })
                        }
                      >
                        Cancel Transfer
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </BentoCard>
      </BentoGrid>

      {/* UNIFIED SINGLE-FORM CREATE MODAL */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Transfer</DialogTitle>
            <DialogDescription>Send family savings to a linked family, personal pool, or via link codes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Transfer Destination</Label>
              <Select
                value={transferKind}
                onValueChange={(v) => {
                  setTransferKind(v as "family" | "member" | "code" | "personalCode")
                  setToFamilyId("")
                  setToUserId("")
                  setDestCode("")
                }}
              >
                <SelectTrigger className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#112240] border-[#233554] text-[#ccd6f6]">
                  <SelectItem value="family">Connected Family (Family to Family)</SelectItem>
                  <SelectItem value="code">External Family (via Family Code)</SelectItem>
                  <SelectItem value="member">Family Member Personal Account</SelectItem>
                  <SelectItem value="personalCode">External Person (via Personal Code)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {transferKind === "family" && (
              <div className="space-y-1">
                <Label className="text-xs text-[#8892b0]">Target Family</Label>
                <Select value={toFamilyId} onValueChange={setToFamilyId}>
                  <SelectTrigger className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]">
                    <SelectValue placeholder={familyOptions.length === 0 ? "No connected families" : "Select linked family"} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#112240] border-[#233554] text-[#ccd6f6]">
                    {familyOptions.map((family) => (
                      <SelectItem key={family.id} value={family.id}>{family.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {familyOptions.length === 0 && (
                  <p className="text-xs text-[#8892b0]">
                    No connected families found. You can transfer using an External Family Code above.
                  </p>
                )}
              </div>
            )}

            {(transferKind === "code" || transferKind === "personalCode") && (
              <div className="space-y-1">
                <Label className="text-xs text-[#8892b0]">
                  {transferKind === "code" ? "Family Link Code" : "Personal Code (8 Digits)"}
                </Label>
                <Input
                  value={destCode}
                  onChange={(e) => setDestCode(e.target.value)}
                  placeholder={transferKind === "code" ? "Enter target family code" : "e.g. 12345678"}
                  className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] font-mono focus:border-[#64ffda]"
                />
              </div>
            )}

            {transferKind === "member" && (
              <div className="space-y-1">
                <Label className="text-xs text-[#8892b0]">Family Member</Label>
                <Select value={toUserId} onValueChange={setToUserId}>
                  <SelectTrigger className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#112240] border-[#233554] text-[#ccd6f6]">
                    {memberOptions.map((member) => (
                      <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Amount</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] font-mono focus:border-[#64ffda]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Note / Purpose (optional)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Monthly contribution, groceries, emergency help"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#233554] bg-[#0a192f]/60 p-3">
              <div>
                <p className="text-sm font-semibold text-[#ccd6f6]">Recurring Transfer</p>
                <p className="text-xs text-[#8892b0]">Automatically schedule ongoing transfers.</p>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>

            {isRecurring && (
              <div className="rounded-xl border border-[#233554] bg-[#0a192f]/40 p-3.5 space-y-3.5">
                <div className="space-y-1">
                  <Label className="text-xs text-[#8892b0]">Cadence</Label>
                  <Select value={recurringEvery} onValueChange={setRecurringEvery}>
                    <SelectTrigger className="bg-[#112240] border-[#233554] text-[#ccd6f6]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#112240] border-[#233554] text-[#ccd6f6]">
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-[#8892b0]">Next Run Date</Label>
                  <Input
                    type="date"
                    value={nextRunDate}
                    onChange={(e) => setNextRunDate(e.target.value)}
                    className="bg-[#112240] border-[#233554] text-[#ccd6f6]"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-[#8892b0]">End Date (optional)</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-[#112240] border-[#233554] text-[#ccd6f6]"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-[#233554]/60 pt-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-[#233554] text-[#8892b0] hover:text-[#ccd6f6]"
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={createTransfer.isPending}
              className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold shadow"
            >
              Send Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
