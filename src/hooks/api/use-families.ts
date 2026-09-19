import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { familiesApi } from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'
import type {
  FamilyCreateRequest,
  FamilyUpdateRequest,
} from '#/lib/api'

const SAVINGS_STALE_MS = 5 * 60 * 1000 // 5 minutes

export function useFamilies() {
  return useQuery({
    queryKey: queryKeys.families,
    queryFn: () => familiesApi.list(),
    staleTime: SAVINGS_STALE_MS,
  })
}

export function useCreateFamily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: FamilyCreateRequest) => familiesApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.families }),
  })
}

export function useFamilyMembers(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.families, familyId, 'members'] as const,
    queryFn: () => familiesApi.getMembers(familyId),
    enabled: typeof window !== 'undefined' && !!familyId,
    staleTime: SAVINGS_STALE_MS,
  })
}

/** Union of members across all of the current user's families (deduped by user id). */
export function useAllFamilyMembers(familyIds: string[]) {
  const queries = useQueries({
    queries: familyIds.map((familyId) => ({
      queryKey: [...queryKeys.families, familyId, 'members'] as const,
      queryFn: () => familiesApi.getMembers(familyId),
      enabled: typeof window !== 'undefined' && !!familyId,
      staleTime: SAVINGS_STALE_MS,
    })),
  })

  const members = useMemo(() => {
    const map = new Map<string, { id?: string; name?: string }>()
    for (const q of queries) {
      for (const m of q.data?.items ?? []) {
        if (m.id && !map.has(m.id)) map.set(m.id, m)
      }
    }
    return [...map.values()]
  }, [queries])

  return {
    members,
    isLoading: queries.some((q) => q.isLoading),
  }
}

export function useFamilyTotalSavings(familyId: string) {
  return useQuery({
    queryKey: queryKeys.familyTotalSavings(familyId),
    queryFn: () => familiesApi.getFamilyTotalSavings(familyId),
    enabled: typeof window !== 'undefined' && !!familyId,
    staleTime: SAVINGS_STALE_MS,
  })
}

export function useAddFamilyTotalSavings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ familyId, totalSavings }: { familyId: string; totalSavings: number }) =>
      familiesApi.addFamilyTotalSavings(familyId, { total_savings: totalSavings }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.familyTotalSavings(variables.familyId) })
    },
  })
}

export function useUpdateFamilyTotalSavings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ familyId, amount }: { familyId: string; amount: number }) =>
      familiesApi.updateFamilyTotalSavings(familyId, { amount }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.familyTotalSavings(variables.familyId) })
    },
  })
}

export function usePersonalTotalSavings(familyId: string) {
  return useQuery({
    queryKey: queryKeys.personalTotalSavings(familyId),
    queryFn: () => familiesApi.getPersonalTotalSavings(familyId),
    enabled: typeof window !== 'undefined' && !!familyId,
    staleTime: SAVINGS_STALE_MS,
  })
}

export function useAddPersonalTotalSavings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ familyId, totalSavings }: { familyId: string; totalSavings: number }) =>
      familiesApi.addPersonalTotalSavings(familyId, { total_savings: totalSavings }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.personalTotalSavings(variables.familyId) })
    },
  })
}

export function useUpdatePersonalTotalSavings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ familyId, amount }: { familyId: string; amount: number }) =>
      familiesApi.updatePersonalTotalSavings(familyId, { amount }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.personalTotalSavings(variables.familyId) })
    },
  })
}

export function useUpdateFamily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ familyId, body }: { familyId: string; body: FamilyUpdateRequest }) =>
      familiesApi.update(familyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.families })
    },
  })
}


export function useFamilyJoinRequests(familyId: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.families, familyId, 'join-requests'] as const,
    queryFn: () => familiesApi.listJoinRequests(familyId),
    enabled: typeof window !== 'undefined' && !!familyId && enabled,
  })
}

export function useSubmitJoinRequest() {
  return useMutation({
    mutationFn: (membershipCode: string) => familiesApi.submitJoinRequest(membershipCode),
  })
}

export function useAcceptJoinRequest(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => familiesApi.acceptJoinRequest(familyId, requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...queryKeys.families, familyId, 'join-requests'] })
      qc.invalidateQueries({ queryKey: [...queryKeys.families, familyId, 'members'] })
      qc.invalidateQueries({ queryKey: queryKeys.families })
    },
  })
}

export function useDeclineJoinRequest(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => familiesApi.declineJoinRequest(familyId, requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...queryKeys.families, familyId, 'join-requests'] })
    },
  })
}

export function useCreateFamilyInvite(familyId: string) {
  return useMutation({
    mutationFn: (email: string) => familiesApi.createInvite(familyId, email),
  })
}
