import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assetsApi, personalAssetsApi } from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'
import { scopeListParams, type AppScope } from '#/lib/scope'

export function useAssets(
  familyId: string,
  scope: AppScope,
  page = 1,
  pageSize = 20,
) {
  const filters = scopeListParams(scope)
  return useQuery({
    queryKey: [...queryKeys.assets(familyId), scope, page, filters] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalAssetsApi.list(page, pageSize)
        : assetsApi.list(familyId, page, pageSize, filters),
    enabled: !!familyId,
  })
}

export function useCreateAsset(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof assetsApi.create>[1]) =>
      scope.kind === 'personal'
        ? personalAssetsApi.create(familyId, body)
        : assetsApi.create(familyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.assets(familyId) })
    },
  })
}

export function useUpdateAsset(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      assetId,
      body,
    }: {
      assetId: string
      body: Parameters<typeof assetsApi.update>[2]
    }) =>
      scope.kind === 'personal'
        ? personalAssetsApi.update(assetId, body)
        : assetsApi.update(familyId, assetId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.assets(familyId) })
    },
  })
}

export function useDeleteAsset(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (assetId: string) =>
      scope.kind === 'personal'
        ? personalAssetsApi.remove(assetId)
        : assetsApi.remove(familyId, assetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.assets(familyId) })
    },
  })
}
