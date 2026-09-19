import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { AppShell } from "#/components/layout/app-shell"
import { BentoCard, BentoGrid } from "#/components/bento/bento"
import { Button } from "#/components/ui/button"
import { Badge } from "#/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select"
import { Switch } from "#/components/ui/switch"
import {
  useAcceptPersonalTransfer,
  useCancelPersonalTransfer,
  useCreatePersonalTransfer,
  useDeclinePersonalTransfer,
  usePersonalTransfers,
} from "#/hooks/api/use-transfers"
import { useActiveFriends } from "#/hooks/api/use-friends"
import { useFamilies } from "#/hooks/api/use-families"
import { ApiError } from "#/lib/api"
import { formatCurrency } from "#/lib/format"
import { toast } from "sonner"
import { ArrowLeftRightIcon, ArrowUpRightIcon, ArrowDownLeftIcon, PlusIcon, CalendarIcon, RepeatIcon } from "lucide-react"

export const Route = createFileRoute("/_authenticated/personal/transfers")({
  component: PersonalTransfersPage,
})

function PersonalTransfersPage() {
  const { data, isLoading, isError } = usePersonalTransfers()
  const { data: friendsData } = useActiveFriends()
  const { data: familiesData } = useFamilies()
  const createTransfer = useCreatePersonalTransfer()
  const cancelTransfer = useCancelPersonalTransfer()
  const acceptTransfer = useAcceptPersonalTransfer()
  const declineTransfer = useDeclinePersonalTransfer()

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"all" | "sent" | "received">("all")
  const [transferKind, setTransferKind] = useState<"myFamily" | "friend" | "personalCode" | "familyCode">("myFamily")
  const [toUserId, setToUserId] = useState("")
  const [toFamilyId, setToFamilyId] = useState("")
  const [destCode, setDestCode] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringEvery, setRecurringEvery] = useState("MONTHLY")
  const [nextRunDate, setNextRunDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const familyOptions = familiesData?.items ?? []
  const friendOptions = friendsData?.items ?? []

  const resetForm = () => {
    setTransferKind("myFamily")
    setToUserId("")
    setToFamilyId("")
    setDestCode("")
    setAmount("")
    setNote("")
    setIsRecurring(false)
    setRecurringEvery("MONTHLY")
    setNextRunDate("")
    setEndDate("")
  }

  const submit = () => {
    if (transferKind === "myFamily" && !toFamilyId) {
      toast.error("Please select one of your families.")
      return
    }
    if (transferKind === "friend" && !toUserId) {
      toast.error("Please select a connected friend.")
      return
    }
    if (transferKind === "personalCode" && !destCode.trim()) {
      toast.error("Please enter the 8-digit personal code.")
      return
    }
    if (transferKind === "familyCode" && !destCode.trim()) {
      toast.error("Please enter the target family code.")
      return
    }
    const parsed = Number(amount || 0)
    if (parsed <= 0) {
      toast.error("Enter a valid transfer amount.")
      return
    }
    if (isRecurring && !nextRunDate) {
      toast.error("Enter the first run date for recurring transfer.")
      return
    }

    createTransfer.mutate(
      {
        fromScope: "PERSONAL",
        toScope: transferKind === "myFamily" || transferKind === "familyCode" ? "FAMILY" : "PERSONAL",
        toFamilyId: transferKind === "myFamily" ? toFamilyId : undefined,
        toUserId: transferKind === "friend" ? toUserId : undefined,
        destPersonalCode: transferKind === "personalCode" ? destCode.trim() : undefined,
        destLinkCode: transferKind === "familyCode" ? destCode.trim() : undefined,
        amount: parsed,
        note: note.trim() || undefined,
        isRecurring,
        recurringEvery: isRecurring ? recurringEvery : undefined,
        nextRunDate: isRecurring && nextRunDate ? new Date(nextRunDate).toISOString() : undefined,
        endDate: isRecurring && endDate ? new Date(endDate).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          toast.success(isRecurring ? "Recurring transfer scheduled" : "Transfer created — waiting for acceptance")
          setOpen(false)
          resetForm()
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Failed to create transfer"),
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
    <AppShell>
      <BentoGrid>
        <BentoCard className="col-span-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-[#ccd6f6]">Personal Transfers</h1>
              <p className="mt-0.5 text-sm text-[#8892b0]">
                Send funds from your personal savings to friends or contribute to your household.
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
              Personal transfers service is temporarily unavailable.
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
                  ? "You have not sent any transfers from your personal savings yet."
                  : tab === "received"
                  ? "No incoming personal transfer offers waiting for your approval."
                  : "Transfer savings to your families, connected friends, or via personal codes."}
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
                          {transfer.toScope === "FAMILY" ? "To Family Pool" : "To Friend"}
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
                              onSuccess: () => toast.success("Accepted"),
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
                              onSuccess: () => toast.success("Declined"),
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
                              toast.error(err instanceof ApiError ? err.message : "Failed to cancel"),
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
            <DialogTitle>Personal Transfer</DialogTitle>
            <DialogDescription>Send from your personal savings to a friend or one of your families.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Transfer Destination</Label>
              <Select
                value={transferKind}
                onValueChange={(v) => {
                  setTransferKind(v as "myFamily" | "friend" | "personalCode" | "familyCode")
                  setToUserId("")
                  setToFamilyId("")
                  setDestCode("")
                }}
              >
                <SelectTrigger className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#112240] border-[#233554] text-[#ccd6f6]">
                  <SelectItem value="myFamily">Personal to My Family (Contribution)</SelectItem>
                  <SelectItem value="friend">Person to Person (Connected Friends)</SelectItem>
                  <SelectItem value="personalCode">Person to Person (via Personal Code)</SelectItem>
                  <SelectItem value="familyCode">Personal to Family (via Family Code)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {transferKind === "myFamily" && (
              <div className="space-y-1">
                <Label className="text-xs text-[#8892b0]">My Family</Label>
                <Select value={toFamilyId} onValueChange={setToFamilyId}>
                  <SelectTrigger className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]">
                    <SelectValue placeholder="Select family" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#112240] border-[#233554] text-[#ccd6f6]">
                    {familyOptions.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {transferKind === "friend" && (
              <div className="space-y-1">
                <Label className="text-xs text-[#8892b0]">Connected Friend</Label>
                <Select value={toUserId} onValueChange={setToUserId}>
                  <SelectTrigger className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]">
                    <SelectValue placeholder={friendOptions.length === 0 ? "No connected friends" : "Select friend"} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#112240] border-[#233554] text-[#ccd6f6]">
                    {friendOptions.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {friendOptions.length === 0 && (
                  <p className="text-xs text-[#8892b0]">
                    No connected friends yet. Add friends first from the Personal → Friends page or use Personal Code.
                  </p>
                )}
              </div>
            )}

            {transferKind === "personalCode" && (
              <div className="space-y-1">
                <Label className="text-xs text-[#8892b0]">8-Digit Personal Code</Label>
                <Input
                  value={destCode}
                  onChange={(e) => setDestCode(e.target.value)}
                  placeholder="e.g. 12345678"
                  className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] font-mono focus:border-[#64ffda]"
                />
              </div>
            )}

            {transferKind === "familyCode" && (
              <div className="space-y-1">
                <Label className="text-xs text-[#8892b0]">Family Link Code</Label>
                <Input
                  value={destCode}
                  onChange={(e) => setDestCode(e.target.value)}
                  placeholder="Enter target family link code"
                  className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] font-mono focus:border-[#64ffda]"
                />
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
                placeholder="e.g. Dinner share, rent portion, gift"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#233554] bg-[#0a192f]/60 p-3">
              <div>
                <p className="text-sm font-semibold text-[#ccd6f6]">Recurring Transfer</p>
                <p className="text-xs text-[#8892b0]">Automatically schedule recurring personal transfers.</p>
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
