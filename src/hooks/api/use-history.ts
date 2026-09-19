import { useQuery } from '@tanstack/react-query'
import { historyApi } from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'
import { scopeToParam, type AppScope } from '#/lib/scope'

export function useHistory(
  familyId: string,
  scope: AppScope,
  type?: string,
  page = 1,
  pageSize = 50,
) {
  const personal = scope.kind === 'personal'

  return useQuery({
    queryKey: [
      ...queryKeys.history(familyId),
      scopeToParam(scope),
      type,
      page,
      pageSize,
    ] as const,
    queryFn: () =>
      personal
        ? historyApi.personal(type, page, pageSize)
        : historyApi.family(familyId, type, page, pageSize),
    enabled: personal || !!familyId,
    staleTime: 60_000,
  })
}
