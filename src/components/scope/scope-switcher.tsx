import { ChevronDownIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { useScope } from '#/hooks/use-scope'
import { scopeLabel, type AppScope } from '#/lib/scope'

export function ScopeSwitcher({ familyId }: { familyId?: string }) {
  const { scope, setScope } = useScope()

  const options: { scope: AppScope; label: string }[] = [
    { scope: { kind: 'family' }, label: 'Family' },
    { scope: { kind: 'personal' }, label: 'Personal' },
  ]
  const activeLabel = scopeLabel(scope)

  if (!familyId) {
    return (
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {activeLabel}
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden gap-1 rounded-full sm:inline-flex"
        >
          {activeLabel}
          <ChevronDownIcon className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
        <DropdownMenuLabel>Scope</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.scope.kind}
            onSelect={() => setScope(opt.scope)}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
