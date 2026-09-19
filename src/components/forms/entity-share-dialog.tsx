import { useEffect, useState } from 'react'
import { Button } from '#/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'

export function EntityShareDialog({
  open,
  onOpenChange,
  title,
  description,
  subFamilies,
  defaultSubFamilyId,
  defaultAmount,
  onSubmit,
  pending = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  subFamilies: Array<{ id: string; name: string }>
  defaultSubFamilyId?: string
  defaultAmount?: number | null
  onSubmit: (payload: { subFamilyId: string; shareAmount: number | null }) => void
  pending?: boolean
}) {
  const [subFamilyId, setSubFamilyId] = useState('')
  const [shareAmount, setShareAmount] = useState('')

  useEffect(() => {
    if (!open) return
    setSubFamilyId(defaultSubFamilyId ?? '')
    setShareAmount(defaultAmount != null ? String(defaultAmount) : '')
  }, [open, defaultSubFamilyId, defaultAmount])

  const submit = () => {
    const parsed = shareAmount.trim() ? Number(shareAmount) : null
    if (!subFamilyId) return
    if (shareAmount.trim() && (Number.isNaN(parsed) || (parsed ?? 0) < 0)) return
    onSubmit({ subFamilyId, shareAmount: parsed })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Sub-family</Label>
            <Select value={subFamilyId} onValueChange={setSubFamilyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select sub-family" />
              </SelectTrigger>
              <SelectContent>
                {subFamilies.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Shared amount (optional)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Leave empty for full visibility"
              value={shareAmount}
              onChange={(e) => setShareAmount(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!subFamilyId || pending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
