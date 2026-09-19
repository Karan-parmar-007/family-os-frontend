import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { personalSavingsPlansApi, savingsPlansApi } from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'
import { scopeListParams, type AppScope } from '#/lib/scope'

export function useSavingsPlans(
  familyId: string,
  scope: AppScope,
  page = 1,
  pageSize = 20,
) {
  const filters = scopeListParams(scope)
  return useQuery({
    queryKey: [...queryKeys.savingsPlans(familyId), scope, page, filters] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalSavingsPlansApi.list(page, pageSize, filters.status ?? 'ACTIVE')
        : savingsPlansApi.list(familyId, page, pageSize, filters),
    enabled: !!familyId,
  })
}

export function useLinkCandidates(familyId: string, purposeType: string, enabled = true) {
  return useQuery({
    queryKey: ['families', familyId, 'savingsPlans', 'linkCandidates', purposeType] as const,
    queryFn: () => savingsPlansApi.linkCandidates(familyId, purposeType),
    enabled: !!familyId && !!purposeType && purposeType !== 'NONE' && enabled,
  })
}

export function useSavingsPlanHistory(familyId: string, scope: AppScope, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...queryKeys.savingsPlans(familyId), 'history', scope, page] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalSavingsPlansApi.history(page, pageSize)
        : savingsPlansApi.history(familyId, page, pageSize),
    enabled: !!familyId,
  })
}

export function useCreateSavingsPlan(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof savingsPlansApi.create>[1]) =>
      scope.kind === 'personal'
        ? personalSavingsPlansApi.create(familyId, body)
        : savingsPlansApi.create(familyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.savingsPlans(familyId) })
    },
  })
}

export function useUpdateSavingsPlan(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      planId,
      body,
    }: {
      planId: string
      body: Parameters<typeof savingsPlansApi.update>[2]
    }) =>
      scope.kind === 'personal'
        ? personalSavingsPlansApi.update(planId, body)
        : savingsPlansApi.update(familyId, planId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.savingsPlans(familyId) })
    },
  })
}

export function useDeleteSavingsPlan(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (planId: string) =>
      scope.kind === 'personal'
        ? personalSavingsPlansApi.remove(planId)
        : savingsPlansApi.remove(familyId, planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.savingsPlans(familyId) })
    },
  })
}

export function usePartPaymentSavingsPlan(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      planId,
      body,
    }: {
      planId: string
      body: Parameters<typeof savingsPlansApi.partPayment>[2]
    }) =>
      scope.kind === 'personal'
        ? personalSavingsPlansApi.partPayment(planId, body)
        : savingsPlansApi.partPayment(familyId, planId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.savingsPlans(familyId) })
    },
  })
}

export function usePayoutSavingsPlan(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      planId,
      body,
    }: {
      planId: string
      body: Parameters<typeof savingsPlansApi.payout>[2]
    }) =>
      scope.kind === 'personal'
        ? personalSavingsPlansApi.payout(planId, body)
        : savingsPlansApi.payout(familyId, planId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.savingsPlans(familyId) })
    },
  })
}

export function usePrepaySavingsPlan(familyId: string, _scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      planId,
      amount,
      mode,
    }: {
      planId: string
      amount: number
      mode?: 'CLEAR_UPCOMING' | 'REDUCE_EMI'
    }) => savingsPlansApi.prepay(familyId, planId, { amount, mode }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.savingsPlans(familyId) })
    },
  })
}

export function useAddSavingsPlanContribution(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      planId,
      amount,
      direction,
    }: {
      planId: string
      amount: number
      direction?: 'IN' | 'OUT'
    }) =>
      scope.kind === 'personal'
        ? savingsPlansApi.addContribution(familyId, planId, { amount, direction })
        : savingsPlansApi.addContribution(familyId, planId, { amount, direction }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.savingsPlans(familyId) })
    },
  })
}
