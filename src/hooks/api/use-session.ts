// hooks/api/familyos/use-session.ts
import { useQuery } from '@tanstack/react-query'
import { authApi, type SessionResponse } from '#/lib/api/endpoints/auth'

const EMPTY_SESSION: SessionResponse = {
  authenticated: false,
  isOwner: false,
  isAdmin: false,
  email: null,
  userId: null,
  roleName: null,
  name: null,
  profile: null,
}

export function useSession() {
  return useQuery({
    queryKey: ['sso-session'],
    queryFn: async (): Promise<SessionResponse> => {
      try {
        return await authApi.session()
      } catch {
        return EMPTY_SESSION
      }
    },
    staleTime: 60_000,
    retry: false,
  })
}
