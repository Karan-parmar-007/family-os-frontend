// lib/auth/session.ts
import { authApi } from '#/lib/api/endpoints/auth'
import type { SessionResponse } from '#/lib/api/endpoints/auth'
import { sso } from '#/lib/sso'
import type { SsoUser } from '#/lib/sso/sso-client'

/** Family OS session view plus the live SSO user (role/app_roles from SSO's DB). */
export interface AppSession extends SessionResponse {
  ssoUser: SsoUser | null
}

export const ANONYMOUS_SESSION: Readonly<AppSession> = Object.freeze({
  authenticated: false,
  isOwner: false,
  isAdmin: false,
  email: null,
  userId: null,
  roleName: null,
  name: null,
  profile: null,
  ssoUser: null,
})

let inflight: Promise<AppSession> | null = null

/**
 * Who is signed in, plus their Family OS profile.
 *
 * `sso.getSession()` asks SSO directly (same-origin `/api/auth/session`, so the
 * refresh cookie is sent and an expired access token is renewed server-side).
 * Only a signed-in user costs a second request, to the Family OS session
 * endpoint, for profile data.
 *
 * Single-flight: guards and hooks that resolve at the same time share one
 * lookup (the SDK also single-flights the SSO call).
 */
export function resolveSession(): Promise<AppSession> {
  if (!inflight) {
    inflight = (async (): Promise<AppSession> => {
      const ssoSession = await sso.getSession()
      if (!ssoSession.authenticated) return ANONYMOUS_SESSION
      const session = await authApi.session()
      return { ...session, ssoUser: session.authenticated ? ssoSession.user : null }
    })().finally(() => {
      inflight = null
    })
  }
  return inflight
}
