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
import { formatRecurringFrequency } from '#/lib/expense/recurring-frequency'
import type { RecurringExpenseDetail } from '#/lib/api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function RecurringExpenseManageModal({
  isOpen,
  items,
  isLoading,
  format,
  onClose,
  onEdit,
}: {
  isOpen: boolean
  items: RecurringExpenseDetail[]
  isLoading: boolean
  format: (value: number) => string
  onClose: () => void
  onEdit: (expense: RecurringExpenseDetail) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage my recurring expense</DialogTitle>
          <DialogDescription>
            Your recurring expenses added for this family. Edit schedule, amounts, or sharing settings here.
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
            No family recurring expense to manage yet.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((expense) => {
              const familySplit = expense.family_splits[0]
              return (
                <div
                  key={expense.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{expense.expense_name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <RefreshCwIcon className="size-3" />
                        {formatRecurringFrequency(expense)}
                      </span>
                      {expense.next_payment_date && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="size-3" />
                          Next {formatDate(expense.next_payment_date)}
                        </span>
                      )}
                    </div>
                    {familySplit && (
                      <p className="text-xs text-muted-foreground">
                        {format(familySplit.amount)} to this family
                        {expense.personal_savings_amount
                          ? ` · ${format(expense.personal_savings_amount)} personal`
                          : ''}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => onEdit(expense)}
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
