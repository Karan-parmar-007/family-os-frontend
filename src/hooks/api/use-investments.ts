import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { investmentsApi, personalInvestmentsApi } from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'
import { scopeListParams, type AppScope } from '#/lib/scope'
import type {
  CreateInvestmentRequest,
  UpdateInvestmentRequest,
  ContributeToInvestmentRequest,
  RedeemInvestmentRequest,
  UpdateInvestmentValueRequest,
} from '#/lib/api/types'

export function useInvestments(familyId: string, scope: AppScope, status?: string) {
  const filters = scopeListParams(scope)
  return useQuery({
    queryKey: [...queryKeys.investments(familyId), scope, status, filters] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalInvestmentsApi.list({ status })
        : investmentsApi.list(familyId, { status }),
    enabled: !!familyId,
  })
}

export function useInvestment(familyId: string, scope: AppScope, investmentId: string) {
  return useQuery({
    queryKey: [...queryKeys.investments(familyId), scope, investmentId] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalInvestmentsApi.get(investmentId)
        : investmentsApi.get(familyId, investmentId),
    enabled: !!familyId && !!investmentId,
  })
}

export function useInvestmentHistory(familyId: string, scope: AppScope) {
  return useQuery({
    queryKey: [...queryKeys.investmentHistory(familyId), scope] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalInvestmentsApi.history()
        : investmentsApi.history(familyId),
    enabled: !!familyId,
  })
}

export function useInvestmentTxns(familyId: string, scope: AppScope, investmentId: string) {
  return useQuery({
    queryKey: [...queryKeys.investmentTxns(familyId, investmentId), scope] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalInvestmentsApi.txns(investmentId)
        : investmentsApi.txns(familyId, investmentId),
    enabled: !!familyId && !!investmentId,
  })
}

export function useCreateInvestment(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateInvestmentRequest) =>
      scope.kind === 'personal'
        ? personalInvestmentsApi.create(familyId, data)
        : investmentsApi.create(familyId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.investments(familyId) })
    },
  })
}

export function useUpdateInvestment(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      investmentId,
      data,
    }: {
      investmentId: string
      data: UpdateInvestmentRequest
    }) =>
      scope.kind === 'personal'
        ? personalInvestmentsApi.update(investmentId, data)
        : investmentsApi.update(familyId, investmentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.investments(familyId) })
    },
  })
}

export function useDeleteInvestment(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (investmentId: string) =>
      scope.kind === 'personal'
        ? personalInvestmentsApi.remove(investmentId)
        : investmentsApi.remove(familyId, investmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.investments(familyId) })
    },
  })
}

export function useContributeToInvestment(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      investmentId,
      data,
    }: {
      investmentId: string
      data: ContributeToInvestmentRequest
    }) =>
      scope.kind === 'personal'
        ? personalInvestmentsApi.contribute(investmentId, data)
        : investmentsApi.contribute(familyId, investmentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.investments(familyId) })
      qc.invalidateQueries({ queryKey: queryKeys.familySavingsLedger(familyId) })
    },
  })
}

export function useRedeemInvestment(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      investmentId,
      data,
    }: {
      investmentId: string
      data: RedeemInvestmentRequest
    }) =>
      scope.kind === 'personal'
        ? personalInvestmentsApi.redeem(investmentId, data)
        : investmentsApi.redeem(familyId, investmentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.investments(familyId) })
      qc.invalidateQueries({ queryKey: queryKeys.familySavingsLedger(familyId) })
    },
  })
}

export function useUpdateInvestmentValue(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      investmentId,
      data,
    }: {
      investmentId: string
      data: UpdateInvestmentValueRequest
    }) =>
      scope.kind === 'personal'
        ? personalInvestmentsApi.updateValue(investmentId, data)
        : investmentsApi.updateValue(familyId, investmentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.investments(familyId) })
    },
  })
}
