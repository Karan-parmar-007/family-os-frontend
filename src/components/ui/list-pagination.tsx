import { Button } from '#/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

export function ListPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  className = '',
}: {
  page: number
  totalPages: number
  total: number
  pageSize?: number
  onPageChange: (page: number) => void
  className?: string
}) {
  if (total <= 0) return null

  const safeTotalPages = Math.max(1, totalPages)
  const resolvedPageSize = pageSize ?? (Math.ceil(total / safeTotalPages) || 1)
  const from = (page - 1) * resolvedPageSize + 1
  const to = Math.min(page * resolvedPageSize, total)

  return (
    <div
      className={`mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {total}
        {safeTotalPages > 1 ? ` · Page ${page} of ${safeTotalPages}` : ''}
      </p>
      {safeTotalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="border-border"
          >
            <ChevronLeftIcon className="mr-1 size-3.5" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= safeTotalPages}
            onClick={() => onPageChange(page + 1)}
            className="border-border"
          >
            Next
            <ChevronRightIcon className="ml-1 size-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
