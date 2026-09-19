import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'

type ShowFundingBreakdownToggleProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  visible: boolean
}

export function ShowFundingBreakdownToggle({
  checked,
  onCheckedChange,
  visible,
}: ShowFundingBreakdownToggleProps) {
  if (!visible) return null

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3">
      <div>
        <Label htmlFor="show-funding-breakdown">Show funding breakdown to family</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Family members can see which pools funded this entry (labels only, no balances).
        </p>
      </div>
      <Switch
        id="show-funding-breakdown"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}
