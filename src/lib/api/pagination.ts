import { useEffect, useMemo, useState } from 'react'

/** Envelope returned by every paginated backend list. */
export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const PAGE_SIZES = [10, 25, 50, 100] as const

export interface PaginationState {
  page: number
  pageSize: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  /** Query params understood by the backend's PaginationDep. */
  params: { page: number; page_size: number }
}

/**
 * Page + page size for one table. Goes back to page 1 whenever `resetKey`
 * changes (search text, filters, scope).
 */
export function usePagination(resetKey?: unknown, initialSize = 10): PaginationState {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(initialSize)
  const key = JSON.stringify(resetKey ?? null)

  useEffect(() => {
    setPage(1)
  }, [key])

  return useMemo(
    () => ({
      page,
      pageSize,
      setPage,
      setPageSize: (size: number) => {
        setPageSizeState(size)
        setPage(1)
      },
      params: { page, page_size: pageSize },
    }),
    [page, pageSize],
  )
}

/** Slice an in-memory list the same way the backend pages its lists. */
export function paginateLocal<T>(items: T[], page: number, pageSize: number): Page<T> {
  const total = items.length
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages))
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  }
}
