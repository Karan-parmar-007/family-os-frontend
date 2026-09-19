// lib/api/familyos/endpoints/auth.ts
// Auth endpoints backed by the SSO proxy layer.
// Local login/signup/reset endpoints have been removed — SSO owns credentials.
import { apiFetch } from '../client'

export interface ProfileSummary {
  id: string
  displayName: string
  personalCurrency: string
  timezone: string
  personalCode: string
  maxFamilyMemberships: number
}

export interface SessionResponse {
  authenticated: boolean
  isOwner: boolean
  isAdmin: boolean
  email: string | null
  userId: string | null
  roleName: string | null
  name: string | null
  profile: ProfileSummary | null
}

export interface RefreshResponse {
  message: string
  accessTokenExpiresIn: number | null
}

export const authApi = {
  session(): Promise<SessionResponse> {
    return apiFetch<SessionResponse>('/api/familyos/auth/session', {
      method: 'GET',
      skipAuthRefresh: true,
    })
  },

  refresh(): Promise<RefreshResponse> {
    return apiFetch<RefreshResponse>('/api/auth/refresh', { method: 'POST' })
  },

  logout(): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/api/auth/logout', { method: 'POST' })
  },
}
