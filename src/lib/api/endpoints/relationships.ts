import { apiFetch } from '../client'
import type {
  FamilyConnectByCodeRequest,
  FamilyRelationship,
  FamilyRelationshipCreateRequest,
  FamilyRelationshipListResponse,
  FamilyJoinCodeResponse,
} from '../types'

export const relationshipsApi = {
  list(familyId: string) {
    return apiFetch<FamilyRelationshipListResponse>(
      `/api/familyos/families/${familyId}/relationships`,
    )
  },

  joinCode(familyId: string) {
    return apiFetch<FamilyJoinCodeResponse>(
      `/api/familyos/families/${familyId}/relationships/join-code`,
    )
  },

  connectByCode(familyId: string, body: FamilyConnectByCodeRequest) {
    return apiFetch<FamilyRelationship>(`/api/familyos/families/${familyId}/relationships/connect`, {
      method: 'POST',
      json: body,
    })
  },

  create(familyId: string, body: FamilyRelationshipCreateRequest) {
    return apiFetch<FamilyRelationship>(
      `/api/familyos/families/${familyId}/relationships`,
      { method: 'POST', json: body },
    )
  },

  accept(familyId: string, relationshipId: string) {
    return apiFetch<FamilyRelationship>(
      `/api/familyos/families/${familyId}/relationships/${relationshipId}/accept`,
      { method: 'POST' },
    )
  },

  reject(familyId: string, relationshipId: string) {
    return apiFetch<FamilyRelationship>(
      `/api/familyos/families/${familyId}/relationships/${relationshipId}/reject`,
      { method: 'POST' },
    )
  },

  remove(familyId: string, relationshipId: string) {
    return apiFetch<FamilyRelationship>(
      `/api/familyos/families/${familyId}/relationships/${relationshipId}`,
      { method: 'DELETE' },
    )
  },
}
