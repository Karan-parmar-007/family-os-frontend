import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { FundingBreakdown } from '#/components/forms/funding-breakdown'
import { fundingApi } from '#/lib/api'

type LogFundingBreakdownRowProps = {
  familyId: string
  entityType: 'FAMILY_INCOME_LOG' | 'FAMILY_EXPENSE_LOG'
  entityId: string
  hasBreakdown?: boolean
}

export function LogFundingBreakdownRow({
  familyId,
  entityType,
  entityId,
  hasBreakdown = false,
}: LogFundingBreakdownRowProps) {
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['fundingBreakdown', familyId, entityType, entityId],
    queryFn: () => fundingApi.getEntityBreakdown(familyId, entityType, entityId),
    enabled: open && hasBreakdown,
  })

  if (!hasBreakdown) return null

  return (
    <div className="col-span-full border-t border-border/60 bg-muted/10 px-4 py-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-0 text-xs text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDownIcon className="size-3.5" /> : <ChevronRightIcon className="size-3.5" />}
        Funding breakdown
      </Button>
      {open && (
        <div className="mt-2 pl-1">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : (
            <FundingBreakdown entries={data?.entries ?? []} />
          )}
        </div>
      )}
    </div>
  )
}
