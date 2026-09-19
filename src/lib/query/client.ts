import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '#/lib/api'

/** Factory so SSR and the browser each get an isolated cache. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          // Don't retry auth/client errors.
          if (error instanceof ApiError && error.status < 500) return false
          return failureCount < 2
        },
        refetchOnWindowFocus: false,
        enabled: typeof window !== 'undefined',
      },
      mutations: {
        retry: false,
      },
    },
  })
}
