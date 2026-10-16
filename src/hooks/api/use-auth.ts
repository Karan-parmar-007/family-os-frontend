// hooks/api/familyos/use-auth.ts
// Sign-in, refresh and logout are owned by SSO (`sso` from '#/lib/sso').
import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { sso } from '#/lib/sso'

/** Log out of SSO (all apps on this session), clear cached data, go home. */
export function useLogout() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => sso.logout(),
    onSuccess: () => {
      qc.clear()
      void navigate({ to: '/' })
    },
  })
}

/**
 * Keep this tab in step with SSO: when the session changes (logout/login in
 * another tab, or a different session noticed here), drop cached user data
 * and re-run route guards. Mount once, inside the QueryClientProvider.
 */
export function useSsoSessionSync() {
  const qc = useQueryClient()
  const router = useRouter()
  useEffect(
    () =>
      sso.onSessionChange((session) => {
        if (session.authenticated) {
          // Signed in (possibly as someone else): drop old data and refetch.
          void qc.resetQueries()
        } else {
          // Signed out: drop data without refetching (refetches would 401 and
          // bounce to SSO login); the guards below send protected pages home.
          qc.clear()
        }
        void router.invalidate()
      }),
    [qc, router],
  )
}
