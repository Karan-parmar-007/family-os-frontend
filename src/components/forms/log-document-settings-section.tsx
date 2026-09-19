import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'

type Member = { id?: string; name?: string }

type Props = {
  showDocToAll: boolean
  onShowDocToAllChange: (value: boolean) => void
  docViewerUserIds: string[]
  onDocViewerUserIdsChange: (ids: string[]) => void
  members: Member[]
  currentUserId: string
  showDocToAllDescription?: string
}

export function LogDocumentSettingsSection({
  showDocToAll,
  onShowDocToAllChange,
  docViewerUserIds,
  onDocViewerUserIdsChange,
  members,
  currentUserId,
  showDocToAllDescription = 'When on, everyone in this family can view the attached document.',
}: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-border p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Document settings
      </p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Show document to all members</p>
          <p className="text-xs text-muted-foreground">{showDocToAllDescription}</p>
        </div>
        <Switch checked={showDocToAll} onCheckedChange={onShowDocToAllChange} />
      </div>

      {!showDocToAll && (
        <div className="space-y-2 border-t border-border/50 pt-2">
          <Label className="text-xs text-muted-foreground">
            Limit document access to specific members
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {members
              .filter((m) => m?.id !== currentUserId)
              .map((m) => {
                const memberId = m?.id || ''
                const checked = docViewerUserIds.includes(memberId)
                return (
                  <label key={memberId} className="flex cursor-pointer select-none items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        let next = [...docViewerUserIds]
                        if (e.target.checked) {
                          if (!next.includes(memberId)) next.push(memberId)
                        } else {
                          next = next.filter((id) => id !== memberId)
                        }
                        onDocViewerUserIdsChange(next)
                      }}
                      className="size-4 rounded border-border bg-background text-brand focus:ring-brand"
                    />
                    <span>{m?.name}</span>
                  </label>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
