// hooks/api/familyos/use-auth.ts
// SSO-based auth hooks. Legacy local-login hooks have been removed.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '#/lib/api/endpoints/auth'

/** Logout via SSO proxy. Clears all cached data. */
export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.clear()
      window.location.href = '/'
    },
  })
}
