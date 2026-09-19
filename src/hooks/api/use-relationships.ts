import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  relationshipsApi,
  type FamilyRelationshipCreateRequest,
} from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'

export function useRelationships(familyId: string) {
  return useQuery({
    queryKey: queryKeys.relationships(familyId),
    queryFn: () => relationshipsApi.list(familyId),
    enabled: !!familyId,
  })
}

export function useJoinCode(familyId: string) {
  return useQuery({
    queryKey: queryKeys.relationshipJoinCode(familyId),
    queryFn: () => relationshipsApi.joinCode(familyId),
    enabled: !!familyId,
  })
}

export function useConnectByCode(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof relationshipsApi.connectByCode>[1]) =>
      relationshipsApi.connectByCode(familyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.relationships(familyId) })
    },
  })
}

export function useCreateRelationship(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: FamilyRelationshipCreateRequest) =>
      relationshipsApi.create(familyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.relationships(familyId) })
    },
  })
}

export function useAcceptRelationship(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (relationshipId: string) =>
      relationshipsApi.accept(familyId, relationshipId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.relationships(familyId) })
    },
  })
}

export function useRejectRelationship(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (relationshipId: string) =>
      relationshipsApi.reject(familyId, relationshipId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.relationships(familyId) })
    },
  })
}

export function useRemoveRelationship(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (relationshipId: string) =>
      relationshipsApi.remove(familyId, relationshipId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.relationships(familyId) })
    },
  })
}
