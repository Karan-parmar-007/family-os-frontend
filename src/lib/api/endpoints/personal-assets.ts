import { apiFetch } from '../client'
import type { AssetListResponse } from '../types'

export const personalAssetsApi = {
  list(page = 1, pageSize = 20) {
    return apiFetch<AssetListResponse>('/api/familyos/personal/assets', {
      params: { page, page_size: pageSize },
    })
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
      document_id?: string
    },
  ) {
    return apiFetch('/api/familyos/personal/assets', {
      method: 'POST',
      params: { family_id: familyId },
      json: body,
    })
  },

  update(
    assetId: string,
    body: {
      asset_name?: string
      type?: string
      value?: number
      quantity?: number
      notes?: string
    },
  ) {
    return apiFetch(`/api/familyos/personal/assets/${assetId}`, {
      method: 'PATCH',
      json: body,
    })
  },

  remove(assetId: string) {
    return apiFetch(`/api/familyos/personal/assets/${assetId}`, { method: 'DELETE' })
  },
}
