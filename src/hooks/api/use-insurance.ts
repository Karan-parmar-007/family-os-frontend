import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { insuranceApi, personalInsuranceApi } from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'
import { scopeListParams, type AppScope } from '#/lib/scope'

export function useInsurance(
  familyId: string,
  scope: AppScope,
  page = 1,
  pageSize = 20,
) {
  const filters = scopeListParams(scope)
  return useQuery({
    queryKey: [...queryKeys.insurance(familyId), scope, page, filters] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalInsuranceApi.list(page, pageSize)
        : insuranceApi.list(familyId, page, pageSize, filters),
    enabled: !!familyId,
  })
}

export function useCreateInsurance(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof insuranceApi.create>[1]) =>
      scope.kind === 'personal'
        ? personalInsuranceApi.create(familyId, body)
        : insuranceApi.create(familyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.insurance(familyId) })
    },
  })
}

export function useUpdateInsurance(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      insuranceId,
      body,
    }: {
      insuranceId: string
      body: Parameters<typeof insuranceApi.update>[2]
    }) =>
      scope.kind === 'personal'
        ? personalInsuranceApi.update(insuranceId, body)
        : insuranceApi.update(familyId, insuranceId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.insurance(familyId) })
    },
  })
}

export function useDeleteInsurance(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (insuranceId: string) =>
      scope.kind === 'personal'
        ? personalInsuranceApi.remove(insuranceId)
        : insuranceApi.remove(familyId, insuranceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.insurance(familyId) })
    },
  })
}

export function usePayNowInsurance(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      insuranceId,
      body,
    }: {
      insuranceId: string
      body: { paidExternally?: boolean }
    }) =>
      scope.kind === 'personal'
        ? personalInsuranceApi.payNow(insuranceId, body)
        : insuranceApi.payNow(familyId, insuranceId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.insurance(familyId) })
    },
  })
}
