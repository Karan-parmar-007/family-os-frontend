// lib/api/familyos/endpoints/me.ts
// Family OS profile (fos_profiles) — distinct from SSO identity.
import { apiFetch } from '../client'

export interface ProfileResponse {
  id: string
  ssoUserId: string
  email: string
  displayName: string
  personalCurrency: string
  timezone: string
  personalCode: string
  maxFamilyMemberships: number
  isActive: boolean
  setupCompletedAt: string
  createdAt: string
}

export interface ProfileSetupRequest {
  displayName: string
  currencyCode?: string
  timezone?: string
  personalSavingsOrigin?: string
}

export interface ProfileUpdateRequest {
  displayName?: string
  currencyCode?: string
  timezone?: string
}

export const meApi = {
  get(): Promise<ProfileResponse> {
    return apiFetch<ProfileResponse>('/api/familyos/me', { method: 'GET' })
  },

  setup(body: ProfileSetupRequest): Promise<ProfileResponse> {
    return apiFetch<ProfileResponse>('/api/familyos/me/setup', {
      method: 'POST',
      json: body,
    })
  },

  update(body: ProfileUpdateRequest): Promise<ProfileResponse> {
    return apiFetch<ProfileResponse>('/api/familyos/me', {
      method: 'PATCH',
      json: body,
    })
  },

  getSavings() {
    return apiFetch<{ userId: string; originAmount: number; totalSavings: number }>(
      '/api/familyos/me/savings',
    )
  },

  listSavingsLedger(page = 1, pageSize = 20) {
    return apiFetch<import('../types').SavingsLedgerListResponse>(
      '/api/familyos/me/savings/ledger',
      { params: { page, page_size: pageSize } },
    )
  },
}
