import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { incomeApi } from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'
import { invalidateAfterSplitLogMutation } from '#/lib/query/invalidate-split-logs'
import type { IncomeLogsFilters } from '#/lib/api'

const INCOME_STALE_MS = 5 * 60 * 1000 // 5 minutes

// ── Recurring incomes ──────────────────────────────────────────────────────

export function useFamilyRecurringIncomes(familyId: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...queryKeys.familyIncome(familyId), 'recurring', page, pageSize] as const,
    queryFn: () => incomeApi.listRecurring(familyId, page, pageSize),
    enabled: typeof window !== 'undefined' && !!familyId,
    staleTime: INCOME_STALE_MS,
  })
}

export function useQuickAddFamilyRecurringIncome(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => incomeApi.quickAddRecurring(familyId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.familyIncome(familyId) })
      qc.invalidateQueries({ queryKey: queryKeys.personalRecurringIncome })
    },
  })
}

export function useMyRecurringIncomes(page = 1, pageSize = 20, personalOnly = true) {
  return useQuery({
    queryKey: [...queryKeys.personalRecurringIncome, page, pageSize, personalOnly] as const,
    queryFn: () => incomeApi.listMyRecurringGlobal(page, pageSize, personalOnly),
    enabled: typeof window !== 'undefined',
    staleTime: INCOME_STALE_MS,
  })
}

export function useMyFamilyManagedRecurringIncomes(familyId: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...queryKeys.familyIncome(familyId), 'recurring', 'mine', page, pageSize] as const,
    queryFn: () => incomeApi.listMyFamilyManagedRecurring(familyId, page, pageSize),
    enabled: typeof window !== 'undefined' && !!familyId,
    staleTime: INCOME_STALE_MS,
  })
}

export function useCreateRecurringIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => incomeApi.createRecurringGlobal(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personalRecurringIncome })
      qc.invalidateQueries({ queryKey: ['familyIncome'] })
    },
  })
}

export function useUpdateRecurringIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ incomeId, formData }: { incomeId: string; formData: FormData }) =>
      incomeApi.updateRecurringGlobal(incomeId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personalRecurringIncome })
      qc.invalidateQueries({ queryKey: ['familyIncome'] })
    },
  })
}

export function useUpdateFamilyManagedRecurringIncome(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ incomeId, formData }: { incomeId: string; formData: FormData }) =>
      incomeApi.updateFamilyManagedRecurring(familyId, incomeId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.familyIncome(familyId) })
      qc.invalidateQueries({ queryKey: queryKeys.personalRecurringIncome })
    },
  })
}

export function useCancelRecurringIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (incomeId: string) => incomeApi.cancelRecurringGlobal(incomeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personalRecurringIncome })
      qc.invalidateQueries({ queryKey: ['familyIncome'] })
    },
  })
}

// Legacy hooks (family page)
export function useCreateFamilyRecurringIncome(familyId: string) {
  return useQuickAddFamilyRecurringIncome(familyId)
}

export function useUpdateFamilyRecurringIncome(_familyId: string) {
  return useUpdateRecurringIncome()
}

export function useCancelFamilyRecurringIncome() {
  return useCancelRecurringIncome()
}

export function useMyFamilyRecurringIncomes(familyId: string, page = 1, pageSize = 20) {
  return useMyFamilyManagedRecurringIncomes(familyId, page, pageSize)
}

// ── Income logs ────────────────────────────────────────────────────────────

export function useFamilyIncomeLogs(familyId: string, filters: IncomeLogsFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.familyIncomeLogs(familyId), filters] as const,
    queryFn: () => incomeApi.listLogs(familyId, filters),
    enabled: typeof window !== 'undefined' && !!familyId,
    staleTime: INCOME_STALE_MS,
  })
}

export function useFamilyIncomeLogDetail(familyId: string, logId: string | null) {
  return useQuery({
    queryKey: queryKeys.familyIncomeLogDetail(familyId, logId ?? ''),
    queryFn: () => incomeApi.getLogDetail(familyId, logId!),
    enabled: typeof window !== 'undefined' && !!familyId && !!logId,
    staleTime: 0, // always fresh for edit modal
  })
}

export function useCreateFamilyIncomeLog(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => incomeApi.createLog(familyId, formData),
    onSuccess: () => {
      invalidateAfterSplitLogMutation(qc, familyId)
    },
  })
}

export function useUpdateFamilyIncomeLog(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ logId, formData }: { logId: string; formData: FormData }) =>
      incomeApi.updateLog(familyId, logId, formData),
    onSuccess: (_, vars) => {
      invalidateAfterSplitLogMutation(qc, familyId)
      qc.invalidateQueries({
        queryKey: queryKeys.familyIncomeLogDetail(familyId, vars.logId),
      })
    },
  })
}

// ── Personal (user-scoped) income logs ────────────────────────────────────

export function useMyIncomeLogs(filters: IncomeLogsFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.personalIncomeLogs, filters] as const,
    queryFn: () => incomeApi.listMyLogs(filters),
    enabled: typeof window !== 'undefined',
    staleTime: INCOME_STALE_MS,
  })
}

export function useMyIncomeLogDetail(logId: string | null) {
  return useQuery({
    queryKey: queryKeys.personalIncomeLogDetail(logId ?? ''),
    queryFn: () => incomeApi.getMyLogDetail(logId!),
    enabled: typeof window !== 'undefined' && !!logId,
    staleTime: 0,
  })
}

export function useCreateMyIncomeLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => incomeApi.createMyLog(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personalIncomeLogs })
      qc.invalidateQueries({ queryKey: queryKeys.globalSavings() })
    },
  })
}

export function useUpdateMyIncomeLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ logId, formData }: { logId: string; formData: FormData }) =>
      incomeApi.updateMyLog(logId, formData),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.personalIncomeLogs })
      qc.invalidateQueries({ queryKey: queryKeys.personalIncomeLogDetail(vars.logId) })
      qc.invalidateQueries({ queryKey: ['familyIncomeLogs'] })
      qc.invalidateQueries({ queryKey: queryKeys.globalSavings() })
    },
  })
}

// ── Categories ─────────────────────────────────────────────────────────────

export function useIncomeCategories(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.familyIncome(familyId), 'categories'] as const,
    queryFn: () => incomeApi.listCategories(familyId),
    enabled: typeof window !== 'undefined' && !!familyId,
    staleTime: INCOME_STALE_MS,
  })
}

export function useCreateIncomeCategory(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (categoryName: string) => incomeApi.createCategory(familyId, categoryName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...queryKeys.familyIncome(familyId), 'categories'] })
    },
  })
}
