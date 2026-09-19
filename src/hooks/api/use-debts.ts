import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { debtsApi, personalDebtsApi } from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'
import { scopeListParams, type AppScope } from '#/lib/scope'

function invalidateDebtRelated(qc: QueryClient, familyId: string) {
  qc.invalidateQueries({ queryKey: queryKeys.debts(familyId) })
  qc.invalidateQueries({ queryKey: queryKeys.familyTotalSavings(familyId) })
  qc.invalidateQueries({ queryKey: queryKeys.personalTotalSavings(familyId) })
  qc.invalidateQueries({ queryKey: queryKeys.notifications() })
  qc.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount() })
  qc.invalidateQueries({ queryKey: queryKeys.upcoming(familyId) })
  qc.invalidateQueries({ queryKey: queryKeys.history(familyId) })
  qc.invalidateQueries({ queryKey: queryKeys.savingsPlans(familyId) })
}

export function useDebts(
  familyId: string,
  scope: AppScope,
  page = 1,
  pageSize = 20,
) {
  const filters = scopeListParams(scope)
  return useQuery({
    queryKey: [...queryKeys.debts(familyId), scope, page, filters] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalDebtsApi.list(page, pageSize, filters.status ?? 'ACTIVE')
        : debtsApi.list(familyId, page, pageSize, filters),
    enabled: !!familyId,
  })
}

export function useDebt(familyId: string, debtId: string, scope: AppScope) {
  return useQuery({
    queryKey: [...queryKeys.debts(familyId), debtId, scope] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalDebtsApi.get(debtId)
        : debtsApi.get(familyId, debtId),
    enabled: !!familyId && !!debtId,
  })
}

export function useDebtHistory(familyId: string, scope: AppScope, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...queryKeys.debts(familyId), 'history', scope, page] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalDebtsApi.history(page, pageSize)
        : debtsApi.history(familyId, page, pageSize),
    enabled: !!familyId,
  })
}

export function useCreateDebt(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof debtsApi.create>[1]) =>
      scope.kind === 'personal'
        ? personalDebtsApi.create(familyId, body)
        : debtsApi.create(familyId, body),
    onSuccess: () => {
      invalidateDebtRelated(qc, familyId)
    },
  })
}

export function useUpdateDebt(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      debtId,
      body,
    }: {
      debtId: string
      body: Record<string, unknown>
    }) =>
      scope.kind === 'personal'
        ? personalDebtsApi.update(debtId, body)
        : debtsApi.update(familyId, debtId, body),
    onSuccess: () => {
      invalidateDebtRelated(qc, familyId)
    },
  })
}

export function useDeleteDebt(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (debtId: string) =>
      scope.kind === 'personal'
        ? personalDebtsApi.remove(debtId)
        : debtsApi.remove(familyId, debtId),
    onSuccess: () => {
      invalidateDebtRelated(qc, familyId)
    },
  })
}

export function usePartPaymentDebt(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      debtId,
      body,
    }: {
      debtId: string
      body: Parameters<typeof debtsApi.partPayment>[2]
    }) =>
      scope.kind === 'personal'
        ? personalDebtsApi.partPayment(debtId, body)
        : debtsApi.partPayment(familyId, debtId, body),
    onSuccess: () => {
      invalidateDebtRelated(qc, familyId)
    },
  })
}

export function useSimulatePartPayment(familyId: string, scope: AppScope) {
  // Plain async fn (not useMutation): simulate is preview-only and must not
  // flip mutation isPending, which would re-render the parent and cancel the
  // dialog's in-flight auto-simulate effect.
  const kind = scope.kind
  return useCallback(
    (
      debtId: string,
      body: Parameters<typeof debtsApi.simulatePartPayment>[2],
    ) =>
      kind === 'personal'
        ? personalDebtsApi.simulatePartPayment(debtId, body)
        : debtsApi.simulatePartPayment(familyId, debtId, body),
    [familyId, kind],
  )
}

export function useUpsertDebtSplitPlan(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      debtId,
      splitLines,
    }: {
      debtId: string
      splitLines: Parameters<typeof debtsApi.upsertSplitPlan>[2]
    }) =>
      scope.kind === 'personal'
        ? personalDebtsApi.upsertSplitPlan(debtId, splitLines)
        : debtsApi.upsertSplitPlan(familyId, debtId, splitLines),
    onSuccess: () => {
      invalidateDebtRelated(qc, familyId)
    },
  })
}

export function useContributeToDebt(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      debtId,
      amount,
    }: {
      debtId: string
      amount: number
    }) =>
      scope.kind === 'personal'
        ? personalDebtsApi.contribute(debtId, { amount })
        : debtsApi.contribute(familyId, debtId, { amount }),
    onSuccess: () => {
      invalidateDebtRelated(qc, familyId)
    },
  })
}

export function useUpsertDebtScopeViews(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      debtId,
      views,
    }: {
      debtId: string
      views: Parameters<typeof debtsApi.putScopeViews>[2]
    }) =>
      scope.kind === 'personal'
        ? personalDebtsApi.putScopeViews(debtId, views)
        : debtsApi.putScopeViews(familyId, debtId, views),
    onSuccess: () => {
      invalidateDebtRelated(qc, familyId)
    },
  })
}

export function useDebtDefaults(familyId: string, debtId: string, scope: AppScope) {
  return useQuery({
    queryKey: [...queryKeys.debts(familyId), debtId, 'defaults', scope] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalDebtsApi.listDefaults(debtId)
        : debtsApi.listDefaults(familyId, debtId),
    enabled: !!familyId && !!debtId,
  })
}

export function useDebtPaymentEvents(familyId: string, debtId: string, scope: AppScope) {
  return useQuery({
    queryKey: [...queryKeys.debts(familyId), debtId, 'payment-events', scope] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalDebtsApi.listPaymentEvents(debtId)
        : debtsApi.listPaymentEvents(familyId, debtId),
    enabled: !!familyId && !!debtId,
    retry: false,
  })
}

export function useSettleDebtDefault(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      debtId,
      defaultId,
      body,
    }: {
      debtId: string
      defaultId: string
      body: Parameters<typeof debtsApi.settleDefault>[3]
    }) =>
      scope.kind === 'personal'
        ? personalDebtsApi.settleDefault(debtId, defaultId, body)
        : debtsApi.settleDefault(familyId, debtId, defaultId, body),
    onSuccess: () => {
      invalidateDebtRelated(qc, familyId)
    },
  })
}

export function useWaiveDebtDefault(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      debtId,
      defaultId,
      body,
    }: {
      debtId: string
      defaultId: string
      body: Parameters<typeof debtsApi.waiveDefault>[3]
    }) =>
      scope.kind === 'personal'
        ? personalDebtsApi.waiveDefault(debtId, defaultId, body)
        : debtsApi.waiveDefault(familyId, debtId, defaultId, body),
    onSuccess: () => {
      invalidateDebtRelated(qc, familyId)
    },
  })
}
