import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sharesApi } from '#/lib/api'

export function useEntityShares(params: { entityType?: string; entityId?: string; subFamilyId?: string } = {}) {
  return useQuery({
    queryKey: ['shares', params] as const,
    queryFn: () =>
      sharesApi.list({
        entity_type: params.entityType,
        entity_id: params.entityId,
        sub_family_id: params.subFamilyId,
      }),
  })
}

export function useCreateEntityShare() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: sharesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shares'] }),
  })
}

export function useUpdateEntityShare() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ shareId, body }: { shareId: string; body: Parameters<typeof sharesApi.update>[1] }) =>
      sharesApi.update(shareId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shares'] }),
  })
}

export function useDeleteEntityShare() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (shareId: string) => sharesApi.remove(shareId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shares'] }),
  })
}

export function usePersonalSavingsShare(familyId: string, subFamilyId: string, enabled = true) {
  return useQuery({
    queryKey: ['shares', 'personalSavings', familyId, subFamilyId] as const,
    queryFn: () => sharesApi.getPersonalSavingsShare(familyId, subFamilyId),
    enabled: !!familyId && !!subFamilyId && enabled,
    retry: false,
  })
}

export function useCreatePersonalSavingsShare(familyId: string, subFamilyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof sharesApi.createPersonalSavingsShare>[2]) =>
      sharesApi.createPersonalSavingsShare(familyId, subFamilyId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shares', 'personalSavings', familyId, subFamilyId] }),
  })
}

export function useUpdatePersonalSavingsShare(familyId: string, subFamilyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof sharesApi.updatePersonalSavingsShare>[2]) =>
      sharesApi.updatePersonalSavingsShare(familyId, subFamilyId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shares', 'personalSavings', familyId, subFamilyId] }),
  })
}

export function useDeletePersonalSavingsShare(familyId: string, subFamilyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => sharesApi.deletePersonalSavingsShare(familyId, subFamilyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shares', 'personalSavings', familyId, subFamilyId] }),
  })
}
