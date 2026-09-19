import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { expensesRecurringApi } from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'
import { invalidateAfterSplitLogMutation } from '#/lib/query/invalidate-split-logs'
import type { ExpenseLogsFilters } from '#/lib/api'

const EXPENSE_STALE_MS = 5 * 60 * 1000

export function useFamilyRecurringExpenses(familyId: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...queryKeys.familyExpense(familyId), 'recurring', page, pageSize] as const,
    queryFn: () => expensesRecurringApi.listRecurring(familyId, page, pageSize),
    enabled: typeof window !== 'undefined' && !!familyId,
    staleTime: EXPENSE_STALE_MS,
  })
}

export function useQuickAddFamilyRecurringExpense(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => expensesRecurringApi.quickAddRecurring(familyId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.familyExpense(familyId) })
      qc.invalidateQueries({ queryKey: queryKeys.personalRecurringExpense })
    },
  })
}

export function useMyRecurringExpenses(page = 1, pageSize = 20, personalOnly = true) {
  return useQuery({
    queryKey: [...queryKeys.personalRecurringExpense, page, pageSize, personalOnly] as const,
    queryFn: () => expensesRecurringApi.listMyRecurringGlobal(page, pageSize, personalOnly),
    enabled: typeof window !== 'undefined',
    staleTime: EXPENSE_STALE_MS,
  })
}

export function useMyFamilyManagedRecurringExpenses(familyId: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...queryKeys.familyExpense(familyId), 'recurring', 'mine', page, pageSize] as const,
    queryFn: () => expensesRecurringApi.listMyFamilyManagedRecurring(familyId, page, pageSize),
    enabled: typeof window !== 'undefined' && !!familyId,
    staleTime: EXPENSE_STALE_MS,
  })
}

export function useCreateRecurringExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => expensesRecurringApi.createRecurringGlobal(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personalRecurringExpense })
      qc.invalidateQueries({ queryKey: ['familyExpense'] })
    },
  })
}

export function useUpdateRecurringExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ expenseId, formData }: { expenseId: string; formData: FormData }) =>
      expensesRecurringApi.updateRecurringGlobal(expenseId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personalRecurringExpense })
      qc.invalidateQueries({ queryKey: ['familyExpense'] })
    },
  })
}

export function useUpdateFamilyManagedRecurringExpense(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ expenseId, formData }: { expenseId: string; formData: FormData }) =>
      expensesRecurringApi.updateFamilyManagedRecurring(familyId, expenseId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.familyExpense(familyId) })
      qc.invalidateQueries({ queryKey: queryKeys.personalRecurringExpense })
    },
  })
}

export function useCancelRecurringExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (expenseId: string) => expensesRecurringApi.cancelRecurringGlobal(expenseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personalRecurringExpense })
      qc.invalidateQueries({ queryKey: ['familyExpense'] })
    },
  })
}

export function useFamilyExpenseLogs(familyId: string, filters: ExpenseLogsFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.familyExpenseLogs(familyId), filters] as const,
    queryFn: () => expensesRecurringApi.listLogs(familyId, filters),
    enabled: typeof window !== 'undefined' && !!familyId,
    staleTime: EXPENSE_STALE_MS,
  })
}

export function useFamilyExpenseLogDetail(familyId: string, logId: string | null) {
  return useQuery({
    queryKey: queryKeys.familyExpenseLogDetail(familyId, logId ?? ''),
    queryFn: () => expensesRecurringApi.getLogDetail(familyId, logId!),
    enabled: typeof window !== 'undefined' && !!familyId && !!logId,
    staleTime: 0,
  })
}

export function useCreateFamilyExpenseLog(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => expensesRecurringApi.createLog(familyId, formData),
    onSuccess: () => {
      invalidateAfterSplitLogMutation(qc, familyId)
    },
  })
}

export function useUpdateFamilyExpenseLog(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ logId, formData }: { logId: string; formData: FormData }) =>
      expensesRecurringApi.updateLog(familyId, logId, formData),
    onSuccess: (_, vars) => {
      invalidateAfterSplitLogMutation(qc, familyId)
      qc.invalidateQueries({
        queryKey: queryKeys.familyExpenseLogDetail(familyId, vars.logId),
      })
    },
  })
}

export function useMyExpenseLogs(filters: ExpenseLogsFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.personalExpenseLogs, filters] as const,
    queryFn: () => expensesRecurringApi.listMyLogs(filters),
    enabled: typeof window !== 'undefined',
    staleTime: EXPENSE_STALE_MS,
  })
}

export function useMyExpenseLogDetail(logId: string | null) {
  return useQuery({
    queryKey: queryKeys.personalExpenseLogDetail(logId ?? ''),
    queryFn: () => expensesRecurringApi.getMyLogDetail(logId!),
    enabled: typeof window !== 'undefined' && !!logId,
    staleTime: 0,
  })
}

export function useCreateMyExpenseLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => expensesRecurringApi.createMyLog(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personalExpenseLogs })
      qc.invalidateQueries({ queryKey: queryKeys.globalSavings() })
    },
  })
}

export function useUpdateMyExpenseLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ logId, formData }: { logId: string; formData: FormData }) =>
      expensesRecurringApi.updateMyLog(logId, formData),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.personalExpenseLogs })
      qc.invalidateQueries({ queryKey: queryKeys.personalExpenseLogDetail(vars.logId) })
      qc.invalidateQueries({ queryKey: ['familyExpenseLogs'] })
      qc.invalidateQueries({ queryKey: queryKeys.globalSavings() })
    },
  })
}
