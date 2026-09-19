import { apiFetch } from '../client'
import type { AssetListResponse } from '../types'

export const assetsApi = {
  list(
    familyId: string,
    page = 1,
    pageSize = 20,
    filters: Record<string, string> = {},
  ) {
    return apiFetch<AssetListResponse>(
      `/api/familyos/families/${familyId}/assets`,
      { params: { page, page_size: pageSize, ...filters } },
    )
  },

  create(
    familyId: string,
    body: {
      asset_name: string
      type: string
      value: number
      quantity?: number
      notes?: string
      acquired_on?: string
      access_level?: string
      is_personal?: boolean
      document_id?: string
      in_someone_name?: string
    },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/assets`, {
      method: 'POST',
      json: body,
    })
  },

  update(
    familyId: string,
    assetId: string,
    body: { asset_name?: string; value?: number; access_level?: string },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/assets/${assetId}`, {
      method: 'PATCH',
      json: body,
    })
  },

  remove(familyId: string, assetId: string) {
    return apiFetch(`/api/familyos/families/${familyId}/assets/${assetId}`, {
      method: 'DELETE',
    })
  },
}
