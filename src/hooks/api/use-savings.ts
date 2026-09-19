import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { savingsApi } from '#/lib/api'
import { meApi } from '#/lib/api/endpoints/me'
import { queryKeys } from '#/lib/query/keys'

const STALE_MS = 5 * 60 * 1000

export function useFamilySavingsLedger(
  familyId: string,
  page = 1,
  pageSize = 20,
  enabled = true,
) {
  return useQuery({
    queryKey: [...queryKeys.familySavingsLedger(familyId), page, pageSize] as const,
    queryFn: () => savingsApi.listFamilyLedger(familyId, page, pageSize),
    enabled: !!familyId && enabled,
    staleTime: STALE_MS,
  })
}

export function useGlobalSavings(enabled = true) {
  return useQuery({
    queryKey: queryKeys.globalSavings(),
    queryFn: () => meApi.getSavings(),
    enabled,
    staleTime: STALE_MS,
  })
}

export function usePersonalSavingsLedger(page = 1, pageSize = 20, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.globalSavings(), 'ledger', page, pageSize] as const,
    queryFn: () => meApi.listSavingsLedger(page, pageSize),
    enabled,
    staleTime: STALE_MS,
  })
}

export function useToggleKeepInFamily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      familyId,
      keepInFamilyOnly,
    }: {
      familyId: string
      keepInFamilyOnly: boolean
    }) =>
      savingsApi.toggleKeepInFamilyOnly(familyId, {
        keep_in_family_only: keepInFamilyOnly,
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: queryKeys.personalTotalSavings(variables.familyId),
      })
      qc.invalidateQueries({ queryKey: queryKeys.globalSavings() })
    },
  })
}
