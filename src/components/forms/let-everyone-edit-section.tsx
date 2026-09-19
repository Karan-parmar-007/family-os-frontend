import { Switch } from '#/components/ui/switch'

type Props = {
  allowed: boolean
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  allowedDescription?: string
  disallowedDescription?: string
}

export function LetEveryoneEditSection({
  allowed,
  checked,
  onCheckedChange,
  allowedDescription = 'Any family member can update this later.',
  disallowedDescription = 'Only available when the full amount goes to this family only.',
}: Props) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
      <div>
        <p className="text-sm font-medium">Let everyone edit this</p>
        <p className="text-xs text-muted-foreground">
          {allowed ? allowedDescription : disallowedDescription}
        </p>
      </div>
      <Switch disabled={!allowed} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
