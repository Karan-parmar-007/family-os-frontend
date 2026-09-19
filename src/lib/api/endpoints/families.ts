/** Family endpoints (`/api/familyos/families/*`). */
import { apiFetch } from '../client'
import type {
  FamilyCreateRequest,
  FamilyCreateResponse,
  FamilyListResponse,
  FamilyMemberListResponse,
  FamilyTotalSavingsResponse,
  PersonalTotalSavingsResponse,
  FamilyTotalSavingsCreateRequest,
  PersonalTotalSavingsCreateRequest,
  FamilyTotalSavingsUpdateRequest,
  PersonalTotalSavingsUpdateRequest,
  FamilyTotalSavingsUpdateResponse,
  PersonalTotalSavingsUpdateResponse,
  FamilyUpdateRequest,
  FamilyUpdateResponse,
} from '../types'

export const familiesApi = {
  list() {
    return apiFetch<FamilyListResponse>('/api/familyos/families')
  },

  create(body: FamilyCreateRequest) {
    return apiFetch<FamilyCreateResponse>('/api/familyos/families', {
      method: 'POST',
      json: body,
    })
  },

  getMembers(familyId: string) {
    return apiFetch<FamilyMemberListResponse>(`/api/familyos/families/${familyId}/members`)
  },

  getFamilyTotalSavings(familyId: string) {
    return apiFetch<FamilyTotalSavingsResponse>(`/api/familyos/families/${familyId}/total-savings`)
  },

  /** Initialize family total savings (first time only). */
  addFamilyTotalSavings(familyId: string, body: FamilyTotalSavingsCreateRequest) {
    return apiFetch<FamilyTotalSavingsResponse>(`/api/familyos/families/${familyId}/total-savings`, {
      method: 'POST',
      json: body,
    })
  },

  /** Update family total savings by adding/subtracting an amount. */
  updateFamilyTotalSavings(familyId: string, body: FamilyTotalSavingsUpdateRequest) {
    return apiFetch<FamilyTotalSavingsUpdateResponse>(
      `/api/familyos/families/${familyId}/total-savings`,
      { method: 'PATCH', json: body },
    )
  },

  getPersonalTotalSavings(familyId: string) {
    return apiFetch<PersonalTotalSavingsResponse>(`/api/familyos/families/${familyId}/personal-total-savings`)
  },

  /** Initialize personal total savings (first time only). */
  addPersonalTotalSavings(familyId: string, body: PersonalTotalSavingsCreateRequest) {
    return apiFetch<PersonalTotalSavingsResponse>(`/api/familyos/families/${familyId}/personal-total-savings`, {
      method: 'POST',
      json: body,
    })
  },

  /** Update personal total savings by adding/subtracting an amount. */
  updatePersonalTotalSavings(familyId: string, body: PersonalTotalSavingsUpdateRequest) {
    return apiFetch<PersonalTotalSavingsUpdateResponse>(
      `/api/familyos/families/${familyId}/personal-total-savings`,
      { method: 'PATCH', json: body },
    )
  },

  update(familyId: string, body: FamilyUpdateRequest) {
    return apiFetch<FamilyUpdateResponse>(`/api/familyos/families/${familyId}`, {
      method: 'PUT',
      json: body,
    })
  },

  submitJoinRequest(membershipCode: string) {
    return apiFetch<{ message: string; id: string; status: string }>('/api/familyos/families/join-request', {
      method: 'POST',
      json: { membershipCode },
    })
  },

  listJoinRequests(familyId: string) {
    return apiFetch<{ items: import('../types').FamilyJoinRequestItem[] }>(`/api/familyos/families/${familyId}/join-requests`)
  },

  acceptJoinRequest(familyId: string, requestId: string) {
    return apiFetch<{ message: string; id: string; status: string }>(`/api/familyos/families/${familyId}/join-requests/${requestId}/accept`, {
      method: 'POST',
    })
  },

  declineJoinRequest(familyId: string, requestId: string) {
    return apiFetch<{ message: string; id: string; status: string }>(`/api/familyos/families/${familyId}/join-requests/${requestId}/decline`, {
      method: 'POST',
    })
  },

  createInvite(familyId: string, email: string) {
    return apiFetch<import('../types').FamilyInviteResponse>(`/api/familyos/families/${familyId}/invites`, {
      method: 'POST',
      json: { email },
    })
  },
}
