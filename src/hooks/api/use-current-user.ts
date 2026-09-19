import { useQuery } from '@tanstack/react-query'
import { authApi } from '#/lib/api/familyos/endpoints/auth'
import type { UserMeResponse } from '#/lib/api/familyos/types'
import { queryKeys } from '#/lib/query/keys'

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/signup',
  '/forgot-password',
])

/**
 * Loads the signed-in Family OS user from SSO session + profile.
 * Returns `null` when unauthenticated.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async (): Promise<UserMeResponse | null> => {
      const onPublicPage =
        typeof window !== 'undefined' &&
        PUBLIC_PATHS.has(window.location.pathname)

      try {
        const session = await authApi.session()
        if (!session.authenticated) return null
        const profile = session.profile
        return {
          id: profile?.id ?? session.userId ?? '',
          email: session.email ?? '',
          name: profile?.displayName ?? session.name ?? '',
          is_active: true,
          is_email_verified: true,
          is_super_admin: Boolean(session.isOwner || session.isAdmin),
          preferred_currency: profile?.personalCurrency ?? 'USD',
          personal_currency: profile?.personalCurrency ?? 'USD',
          friend_code: profile?.personalCode,
          created_at: '',
        }
      } catch (error) {
        const status =
          error && typeof error === 'object' && 'status' in error
            ? (error as { status: number }).status
            : null
        if (status === 401 || status === 403 || status === 404) {
          return null
        }
        if (onPublicPage) return null
        throw error
      }
    },
    staleTime: 60_000,
    retry: false,
  })
}
