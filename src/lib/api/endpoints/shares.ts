import { apiFetch } from '../client'
import type {
  EntityShare,
  EntityShareCreateRequest,
  EntityShareListResponse,
  EntityShareUpdateRequest,
  PersonalSavingsShare,
  PersonalSavingsShareCreateRequest,
  PersonalSavingsShareUpdateRequest,
} from '../types'

export const sharesApi = {
  list(params: { entity_type?: string; entity_id?: string; sub_family_id?: string } = {}) {
    return apiFetch<EntityShareListResponse>('/api/familyos/shares', { params })
  },

  create(body: EntityShareCreateRequest) {
    return apiFetch<EntityShare>('/api/familyos/shares', { method: 'POST', json: body })
  },

  update(shareId: string, body: EntityShareUpdateRequest) {
    return apiFetch<EntityShare>(`/api/familyos/shares/${shareId}`, { method: 'PATCH', json: body })
  },

  remove(shareId: string) {
    return apiFetch(`/api/familyos/shares/${shareId}`, { method: 'DELETE' })
  },

  getPersonalSavingsShare(familyId: string, subFamilyId: string) {
    return apiFetch<PersonalSavingsShare>(
      `/api/familyos/families/${familyId}/sub-families/${subFamilyId}/savings-share`,
    )
  },

  createPersonalSavingsShare(
    familyId: string,
    subFamilyId: string,
    body: PersonalSavingsShareCreateRequest,
  ) {
    return apiFetch<PersonalSavingsShare>(
      `/api/familyos/families/${familyId}/sub-families/${subFamilyId}/savings-share`,
      { method: 'POST', json: body },
    )
  },

  updatePersonalSavingsShare(
    familyId: string,
    subFamilyId: string,
    body: PersonalSavingsShareUpdateRequest,
  ) {
    return apiFetch<PersonalSavingsShare>(
      `/api/familyos/families/${familyId}/sub-families/${subFamilyId}/savings-share`,
      { method: 'PATCH', json: body },
    )
  },

  deletePersonalSavingsShare(familyId: string, subFamilyId: string) {
    return apiFetch(`/api/familyos/families/${familyId}/sub-families/${subFamilyId}/savings-share`, {
      method: 'DELETE',
    })
  },
}
