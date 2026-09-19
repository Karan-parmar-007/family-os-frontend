import { CalendarIcon, PencilIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Skeleton } from '#/components/ui/skeleton'
import { formatRecurringFrequency } from '#/lib/income/recurring-frequency'
import type { RecurringIncomeDetail } from '#/lib/api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function RecurringIncomeManageModal({
  isOpen,
  items,
  isLoading,
  format,
  onClose,
  onEdit,
}: {
  isOpen: boolean
  items: RecurringIncomeDetail[]
  isLoading: boolean
  format: (value: number) => string
  onClose: () => void
  onEdit: (income: RecurringIncomeDetail) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage my recurring income</DialogTitle>
          <DialogDescription>
            Your recurring incomes added for this family. Edit schedule, amounts, or sharing settings here.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No family recurring income to manage yet.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((income) => {
              const familySplit = income.family_splits[0]
              return (
                <div
                  key={income.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{income.income_name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <RefreshCwIcon className="size-3" />
                        {formatRecurringFrequency(income)}
                      </span>
                      {income.next_receiving_date && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="size-3" />
                          Next {formatDate(income.next_receiving_date)}
                        </span>
                      )}
                    </div>
                    {familySplit && (
                      <p className="text-xs text-muted-foreground">
                        {format(familySplit.amount)} to this family
                        {income.personal_savings_amount
                          ? ` · ${format(income.personal_savings_amount)} personal`
                          : ''}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => onEdit(income)}
                  >
                    <PencilIcon className="size-3.5" />
                    Edit
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
