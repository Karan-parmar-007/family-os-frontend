// lib/auth/guards.ts
import { isRedirect, redirect } from '@tanstack/react-router'
import { ApiError, isNetworkError } from '#/lib/api/client'
import { resolveSession } from '#/lib/auth/session'

/** SSO or the API is down/unreachable — let the page render instead of bouncing to '/'. */
function isServiceUnavailable(error: unknown): boolean {
  return isNetworkError(error) || (error instanceof ApiError && error.status >= 500)
}

/**
 * Redirect unauthenticated visitors to the public home page.
 * If authenticated but no Family OS profile, redirect to /setup.
 */
export async function requireAuth() {
  if (typeof document === 'undefined') return null
  try {
    const session = await resolveSession()
    if (!session.authenticated) {
      throw redirect({ to: '/' })
    }
    if (session.profile === null) {
      throw redirect({ to: '/setup' })
    }
    return session
  } catch (error) {
    if (isRedirect(error)) throw error
    if (isServiceUnavailable(error)) return null
    throw redirect({ to: '/' })
  }
}

/**
 * Only signed-in users without a Family OS profile may see /setup.
 */
export async function requireSetupPending() {
  if (typeof document === 'undefined') return null
  try {
    const session = await resolveSession()
    if (!session.authenticated) {
      throw redirect({ to: '/' })
    }
    if (session.profile !== null) {
      throw redirect({ to: '/personal/dashboard' })
    }
    return session
  } catch (error) {
    if (isRedirect(error)) throw error
    if (isServiceUnavailable(error)) return null
    throw redirect({ to: '/' })
  }
}

/**
 * Redirect already-authenticated users away from guest pages
 * (to /setup when they still need a Family OS profile).
 */
export async function redirectIfAuthenticated() {
  if (typeof document === 'undefined') return null
  try {
    const session = await resolveSession()
    if (session.authenticated) {
      throw redirect({
        to: session.profile === null ? '/setup' : '/personal/dashboard',
      })
    }
  } catch (error) {
    if (isRedirect(error)) throw error
  }
}
