import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { expensesApi } from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'
import { scopeListParams, type AppScope } from '#/lib/scope'

export function useExpenseLogs(
  familyId: string,
  scope: AppScope,
  page = 1,
  pageSize = 20,
) {
  const filters = scopeListParams(scope)
  return useQuery({
    queryKey: [...queryKeys.expenses(familyId), 'logs', scope, page, filters] as const,
    queryFn: () => expensesApi.listLogs(familyId, page, pageSize, filters),
    enabled: !!familyId,
  })
}

export function useRecurringExpenses(
  familyId: string,
  scope: AppScope,
  page = 1,
  pageSize = 20,
) {
  const filters = scopeListParams(scope)
  return useQuery({
    queryKey: [...queryKeys.expenses(familyId), 'recurring', scope, page, filters] as const,
    queryFn: () => expensesApi.listRecurring(familyId, page, pageSize, filters),
    enabled: !!familyId,
  })
}

export function useCreateExpenseLog(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof expensesApi.createLog>[1]) =>
      expensesApi.createLog(familyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses(familyId) })
      qc.invalidateQueries({ queryKey: queryKeys.familyTotalSavings(familyId) })
    },
  })
}

const EXPENSE_STALE_MS = 5 * 60 * 1000

export function useExpenseCategories(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.expenses(familyId), 'categories'] as const,
    queryFn: () => expensesApi.listCategories(familyId),
    enabled: typeof window !== 'undefined' && !!familyId,
    staleTime: EXPENSE_STALE_MS,
  })
}

export function useCreateExpenseCategory(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (categoryName: string) => expensesApi.createCategory(familyId, categoryName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...queryKeys.expenses(familyId), 'categories'] })
    },
  })
}
