// lib/api/familyos/endpoints/auth.ts
// Family OS view of the current session. Sign-in, refresh and logout belong
// to SSO — use `sso` from '#/lib/sso' for those.
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
  /** App-scoped SSO roles from the access token, e.g. `{ familyos: ['admin'] }`. */
  appRoles?: Record<string, string[]>
  name: string | null
  profile: ProfileSummary | null
}

export const authApi = {
  /** Always 200; never refreshes (call `sso.getSession()` first for that). */
  session(): Promise<SessionResponse> {
    return apiFetch<SessionResponse>('/api/familyos/auth/session', {
      method: 'GET',
      skipAuthRefresh: true,
    })
  },
}
