import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { AppShell } from "#/components/layout/app-shell"
import { Button } from "#/components/ui/button"
import { Badge } from "#/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "#/components/ui/dialog"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select"
import { DocumentUploader } from "#/components/common/document-uploader"
import { CategoryPicker } from "#/components/common/category-picker"
import { useFamilyMembers } from "#/hooks/api/familyos/use-families"
import { useAssets, useCreateAsset, useDeleteAsset, useUpdateAsset } from "#/hooks/api/familyos/use-assets"
import { useScope } from "#/hooks/use-scope"
import { ApiError, familiesApi, isNetworkError, documentsApi } from "#/lib/api"
import type { AssetSummary } from "#/lib/api/familyos/types"
import { formatCurrency } from "#/lib/format"
import { toast } from "sonner"
import { Building2Icon, PaperclipIcon, PlusIcon, PencilIcon, Trash2Icon, CalendarIcon, UserIcon } from "lucide-react"

interface Search {
  scope?: string
}

export const Route = createFileRoute("/_authenticated/assets/$familyId")({
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
  component: AssetsPage,
})

function AssetsPage() {
  const { familyId } = Route.useParams()
  const { scope } = useScope()
  const { data, isLoading, isError, error } = useAssets(familyId, scope)
  const createAsset = useCreateAsset(familyId, scope)
  const updateAsset = useUpdateAsset(familyId, scope)
  const deleteAsset = useDeleteAsset(familyId, scope)
  const { data: membersData } = useFamilyMembers(familyId || "")
  const members = membersData?.items || []

  // Create state
  const [open, setOpen] = useState(false)
  const [assetName, setAssetName] = useState("")
  const [type, setType] = useState("OTHER")
  const [value, setValue] = useState("")
  const [notes, setNotes] = useState("")
  const [acquiredOn, setAcquiredOn] = useState("")
  const [inSomeoneName, setInSomeoneName] = useState("FAMILY")
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [documentName, setDocumentName] = useState<string | null>(null)

  // Edit state
  const [editOpen, setEditOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<AssetSummary | null>(null)
  const [editName, setEditName] = useState("")
  const [editType, setEditType] = useState("OTHER")
  const [editValue, setEditValue] = useState("")
  const [editNotes, setEditNotes] = useState("")

  const startEdit = (asset: AssetSummary) => {
    setEditingAsset(asset)
    setEditName(asset.assetName || "")
    setEditType(asset.type || "OTHER")
    setEditValue(String(asset.value ?? ""))
    setEditNotes(asset.notes || "")
    setEditOpen(true)
  }

  const submitCreate = () => {
    const parsedValue = Number(value || 0)
    if (!assetName.trim() || parsedValue < 0) {
      toast.error("Enter valid asset name and value.")
      return
    }
    createAsset.mutate(
      {
        asset_name: assetName.trim(),
        type,
        value: parsedValue,
        notes: notes.trim() || undefined,
        acquired_on: acquiredOn || undefined,
        document_id: documentId || undefined,
        in_someone_name: inSomeoneName && inSomeoneName !== "FAMILY" ? inSomeoneName : undefined,
        is_personal: scope.kind === "personal",
      },
      {
        onSuccess: () => {
          toast.success("Asset created")
          setOpen(false)
          setAssetName("")
          setType("OTHER")
          setValue("")
          setNotes("")
          setAcquiredOn("")
          setInSomeoneName("FAMILY")
          setDocumentId(null)
          setDocumentName(null)
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create asset"),
      },
    )
  }

  const submitEdit = () => {
    if (!editingAsset) return
    const parsedValue = Number(editValue || 0)
    if (!editName.trim() || parsedValue < 0) {
      toast.error("Enter valid asset name and value.")
      return
    }
    updateAsset.mutate(
      {
        assetId: editingAsset.id,
        body: {
          asset_name: editName.trim(),
          value: parsedValue,
          type: editType,
          notes: editNotes.trim() || undefined,
        } as any,
      },
      {
        onSuccess: () => {
          toast.success("Asset updated")
          setEditOpen(false)
          setEditingAsset(null)
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Failed to update asset"),
      },
    )
  }

  const getDocUrl = (docId: string) => {
    if (scope.kind === "personal") {
      return documentsApi.userContentUrl(docId)
    }
    return documentsApi.contentUrl(familyId, docId)
  }

  const getMemberName = (id?: string | null) => {
    if (!id || id === "FAMILY") return null
    const m = members.find((item) => item.id === id)
    return m ? m.name : null
  }

  const items = data?.items ?? []

  return (
    <AppShell familyId={familyId}>
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#e6f1ff] sm:text-3xl">
              {scope.kind === "personal" ? "Personal Assets" : "Family Assets"}
            </h1>
            <p className="mt-1 text-sm text-[#8892b0]">
              {data?.totalValue != null ? (
                <>
                  Total portfolio:{" "}
                  <strong className="font-mono text-[#64ffda]">
                    {formatCurrency(Number(data.totalValue))}
                  </strong>
                </>
              ) : (
                "Track properties, vehicles, jewelry, gold, and other holdings."
              )}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setAssetName("")
              setType("OTHER")
              setValue("")
              setNotes("")
              setAcquiredOn("")
              setInSomeoneName("FAMILY")
              setDocumentId(null)
              setDocumentName(null)
              setOpen(true)
            }}
            className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold shadow"
          >
            <PlusIcon className="mr-1.5 h-4 w-4" /> Add Asset
          </Button>
        </div>

        {isLoading && <p className="text-sm text-[#8892b0]">Loading assets…</p>}

        {isError && (
          <p className="text-sm text-[#f87171]">
            {error instanceof ApiError ? error.message : "Could not load assets."}
          </p>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[#233554] bg-[#112240]/50 p-10 text-center">
            <div className="mb-3 rounded-full bg-[#0a192f] p-3 text-[#64ffda]">
              <Building2Icon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-[#ccd6f6]">No assets recorded yet</h3>
            <p className="mt-1 max-w-md text-sm text-[#8892b0]">
              Track physical properties, vehicles, jewelry, gold, or electronics with ownership deeds and estimated values.
            </p>
            <Button
              size="sm"
              onClick={() => setOpen(true)}
              className="mt-4 bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold"
            >
              <PlusIcon className="mr-1.5 h-4 w-4" /> Add Your First Asset
            </Button>
          </div>
        )}

        <ul className="grid gap-3">
          {items.map((asset) => {
            const assignedName = getMemberName(asset.inSomeoneName)
            return (
              <li
                key={asset.id}
                className="rounded-2xl border border-[#233554]/90 bg-[#112240]/90 p-4 shadow transition hover:border-[#64ffda]/30 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-[#ccd6f6]">{asset.assetName}</span>
                      <Badge variant="outline" className="border-[#233554] bg-[#0a192f] text-[#64ffda] text-xs">
                        {asset.type}
                      </Badge>
                      {asset.isPersonal && (
                        <Badge variant="secondary" className="bg-[#233554] text-[#ccd6f6] text-xs">
                          Personal
                        </Badge>
                      )}
                      {asset.documentId && (
                        <a
                          href={getDocUrl(asset.documentId)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-[#64ffda]/10 px-2.5 py-0.5 text-xs font-semibold text-[#64ffda] hover:bg-[#64ffda]/20 transition"
                          title="View Attached Deed / Document"
                        >
                          <PaperclipIcon className="h-3 w-3" /> Deed
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8892b0]">
                      {assignedName && (
                        <span className="inline-flex items-center gap-1">
                          <UserIcon className="h-3 w-3 text-[#64ffda]" />
                          <span>Assigned: {assignedName}</span>
                        </span>
                      )}
                      {asset.acquiredOn && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3 text-[#8892b0]" />
                          <span>Acquired: {String(asset.acquiredOn).slice(0, 10)}</span>
                        </span>
                      )}
                    </div>

                    {asset.notes && (
                      <p className="text-xs text-[#8892b0]/90 italic">{asset.notes}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
                    <span className="whitespace-nowrap font-mono text-xl font-bold text-[#ccd6f6]">
                      {formatCurrency(Number(asset.value))}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#233554] text-[#8892b0] hover:text-[#ccd6f6]"
                        onClick={() => startEdit(asset)}
                      >
                        <PencilIcon className="mr-1 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-[#f87171]/20 text-[#f87171] hover:bg-[#f87171]/30 border-0"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${asset.assetName}"?`)) {
                            deleteAsset.mutate(asset.id, {
                              onSuccess: () => toast.success("Asset deleted"),
                              onError: (err) =>
                                toast.error(err instanceof ApiError ? err.message : "Failed to delete asset"),
                            })
                          }
                        }}
                      >
                        <Trash2Icon className="mr-1 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* CREATE ASSET MODAL - SINGLE COLUMN */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Asset</DialogTitle>
            <DialogDescription>Track physical assets — home, vehicle, gold, real estate with ownership deeds.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Asset Name</Label>
              <Input
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="e.g. Primary Residence, Tesla Model 3, Gold Bar"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
              />
            </div>

            <div className="space-y-1">
              <CategoryPicker
                scope={scope.kind === "personal" ? "PERSONAL" : "FAMILY"}
                categoryType="ASSET"
                familyId={familyId}
                value={type}
                onSelect={(cat) => setType(cat.name)}
                label="Asset Category"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Estimated Value</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] font-mono focus:border-[#64ffda]"
              />
            </div>

            {scope.kind !== "personal" && (
              <div className="space-y-1">
                <Label className="text-xs text-[#8892b0]">Ownership / Assigned Person</Label>
                <Select value={inSomeoneName} onValueChange={setInSomeoneName}>
                  <SelectTrigger className="bg-[#0a192f] border-[#233554] text-[#ccd6f6]">
                    <SelectValue placeholder="Entire Household" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#112240] border-[#233554] text-[#ccd6f6]">
                    <SelectItem value="FAMILY">Entire Household</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Acquisition Date (optional)</Label>
              <Input
                type="date"
                value={acquiredOn}
                onChange={(e) => setAcquiredOn(e.target.value)}
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Notes (optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Model, serial, deed registration number..."
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
              />
            </div>

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
              label="Asset Deed / Invoice / Valuation"
              hint="Attach deed, bill, or valuation certificate"
            />

            {scope.kind === "family" && (
              <p className="text-xs text-[#8892b0]">
                This creates a family asset. Manage personal assets under Personal → Assets.
              </p>
            )}
          </div>
          <DialogFooter className="border-t border-[#233554]/60 pt-3">
            <Button variant="outline" onClick={() => setOpen(false)} className="border-[#233554] text-[#8892b0] hover:text-[#ccd6f6]">
              Cancel
            </Button>
            <Button
              onClick={submitCreate}
              disabled={createAsset.isPending}
              className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold shadow"
            >
              Save Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT ASSET MODAL - SINGLE COLUMN */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update the details or valuation of this asset.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Asset Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Asset name"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
              />
            </div>

            <div className="space-y-1">
              <CategoryPicker
                scope={scope.kind === "personal" ? "PERSONAL" : "FAMILY"}
                categoryType="ASSET"
                familyId={familyId}
                value={editType}
                onSelect={(cat) => setEditType(cat.name)}
                label="Asset Category"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Estimated Value</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="0.00"
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] font-mono focus:border-[#64ffda]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#8892b0]">Notes (optional)</Label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Additional details..."
                className="bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
              />
            </div>
          </div>
          <DialogFooter className="border-t border-[#233554]/60 pt-3">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="border-[#233554] text-[#8892b0] hover:text-[#ccd6f6]">
              Cancel
            </Button>
            <Button
              onClick={submitEdit}
              disabled={updateAsset.isPending}
              className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold shadow"
            >
              Update Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
