/** User endpoints (`/api/familyos/users/*`). */
import { apiFetch } from '../client'
import type {
  ChangePasswordRequest,
  GlobalSavingsAdjustRequest,
  GlobalSavingsMutationResponse,
  GlobalSavingsOriginRequest,
  GlobalSavingsResponse,
  GlobalPersonalEntryCreateRequest,
  GlobalPersonalEntry,
  GlobalPersonalEntryListResponse,
  MessageResponse,
  RequestEmailChange,
  UserMeResponse,
  UserMeUpdate,
  VerifyEmailChangeOtp,
} from '../types'

export const usersApi = {
  me() {
    return apiFetch<UserMeResponse>('/api/familyos/users/me')
  },

  updateMe(body: UserMeUpdate) {
    return apiFetch<UserMeResponse>('/api/familyos/users/me', {
      method: 'PUT',
      json: body,
    })
  },

  changePassword(body: ChangePasswordRequest) {
    return apiFetch<MessageResponse>('/api/familyos/users/me/change-password', {
      method: 'POST',
      json: body,
    })
  },

  requestEmailChange(body: RequestEmailChange) {
    return apiFetch<MessageResponse>('/api/familyos/users/me/email', {
      method: 'POST',
      json: body,
    })
  },

  verifyEmailChange(body: VerifyEmailChangeOtp) {
    return apiFetch<MessageResponse>('/api/familyos/users/me/email/verify', {
      method: 'POST',
      json: body,
    })
  },

  getGlobalSavings() {
    return apiFetch<GlobalSavingsResponse>('/api/familyos/users/me/global-savings')
  },

  setGlobalSavingsOrigin(body: GlobalSavingsOriginRequest) {
    return apiFetch<GlobalSavingsMutationResponse>(
      '/api/familyos/users/me/global-savings/origin',
      { method: 'POST', json: body },
    )
  },

  adjustGlobalSavings(body: GlobalSavingsAdjustRequest) {
    return apiFetch<GlobalSavingsMutationResponse>(
      '/api/familyos/users/me/global-savings/adjust',
      { method: 'POST', json: body },
    )
  },

  listGlobalEntries() {
    return apiFetch<GlobalPersonalEntryListResponse>('/api/familyos/users/me/global-entries')
  },

  createGlobalEntry(body: GlobalPersonalEntryCreateRequest) {
    return apiFetch<GlobalPersonalEntry>('/api/familyos/users/me/global-entries', {
      method: 'POST',
      json: body,
    })
  },
}
