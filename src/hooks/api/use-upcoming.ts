import { useQuery } from '@tanstack/react-query'
import { upcomingApi } from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'
import { scopeToParam, type AppScope } from '#/lib/scope'

export function useUpcoming(
  familyId: string,
  scope: AppScope,
  horizonDays = 90,
  page = 1,
  pageSize = 10,
) {
  const scopeParam = scope.kind === 'personal' ? 'personal' : undefined

  return useQuery({
    queryKey: [
      ...queryKeys.upcoming(familyId),
      scopeToParam(scope),
      horizonDays,
      page,
      pageSize,
    ] as const,
    queryFn: () =>
      upcomingApi.list(familyId, {
        horizonDays,
        scope: scopeParam,
        page,
        pageSize,
      }),
    enabled: !!familyId,
    staleTime: 60_000,
  })
}
