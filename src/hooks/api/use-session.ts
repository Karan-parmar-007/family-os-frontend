// hooks/api/familyos/use-session.ts
import { useQuery } from '@tanstack/react-query'
import { ANONYMOUS_SESSION, resolveSession } from '#/lib/auth/session'
import type { AppSession } from '#/lib/auth/session'

export const SESSION_QUERY_KEY = ['sso-session'] as const

export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async (): Promise<AppSession> => {
      try {
        return await resolveSession()
      } catch {
        return ANONYMOUS_SESSION
      }
    },
    staleTime: 60_000,
    retry: false,
  })
}
