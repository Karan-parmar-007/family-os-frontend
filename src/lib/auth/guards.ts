// lib/auth/guards.ts
import { isRedirect, redirect } from '@tanstack/react-router'
import { authApi } from '#/lib/api/familyos/endpoints/auth'
import { isNetworkError } from '#/lib/api/familyos/client'

/**
 * Redirect unauthenticated visitors to the public home page.
 * If authenticated but no Family OS profile, redirect to /setup.
 */
export async function requireAuth() {
  if (typeof document === 'undefined') return null
  try {
    const session = await authApi.session()
    if (!session.authenticated) {
      throw redirect({ to: '/' })
    }
    if (session.profile === null) {
      throw redirect({ to: '/setup' })
    }
    return session
  } catch (error) {
    if (isRedirect(error)) throw error
    if (isNetworkError(error)) return null
    throw redirect({ to: '/' })
  }
}

/**
 * Redirect already-authenticated users (with profile) away from guest pages.
 */
export async function redirectIfAuthenticated() {
  if (typeof document === 'undefined') return null
  try {
    const session = await authApi.session()
    if (session.authenticated && session.profile !== null) {
      throw redirect({ to: '/personal/dashboard' })
    }
  } catch (error) {
    if (isRedirect(error)) throw error
  }
}
