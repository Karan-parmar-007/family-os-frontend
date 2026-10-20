import { useEffect } from 'react'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { PAGE_SIZES, type PaginationState } from '#/lib/api/pagination'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

export function ListPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = '',
}: {
  page: number
  totalPages: number
  total: number
  pageSize?: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  className?: string
}) {
  const safeTotalPages = Math.max(1, totalPages)

  useEffect(() => {
    if (total > 0 && page > safeTotalPages) onPageChange(safeTotalPages)
  }, [page, safeTotalPages, total, onPageChange])

  if (total <= 0) return null

  const resolvedPageSize = pageSize ?? (Math.ceil(total / safeTotalPages) || 1)
  const from = (page - 1) * resolvedPageSize + 1
  const to = Math.min(page * resolvedPageSize, total)
  const showSizePicker = onPageSizeChange && total > PAGE_SIZES[0]

  return (
    <div
      className={`mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-muted-foreground">
          Showing {from}–{to} of {total}
          {safeTotalPages > 1 ? ` · Page ${page} of ${safeTotalPages}` : ''}
        </p>
        {showSizePicker && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page</span>
            <Select
              value={String(resolvedPageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger size="sm" className="h-8 w-[76px] border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
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

/** Pagination bar wired to a `usePagination` state and a server page. */
export function PageBar({
  state,
  data,
  className,
}: {
  state: PaginationState
  data: { total: number; totalPages: number } | undefined
  className?: string
}) {
  if (!data) return null
  return (
    <ListPagination
      page={state.page}
      pageSize={state.pageSize}
      total={data.total}
      totalPages={data.totalPages}
      onPageChange={state.setPage}
      onPageSizeChange={state.setPageSize}
      className={className}
    />
  )
}
