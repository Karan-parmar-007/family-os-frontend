import { apiFetch } from '../client'
import type { HistoryListResponse } from '../types'

export const historyApi = {
  family(familyId: string, type?: string, page = 1, pageSize = 50) {
    return apiFetch<HistoryListResponse>(`/api/familyos/families/${familyId}/history`, {
      params: { type, page, page_size: pageSize },
    })
  },

  personal(type?: string, page = 1, pageSize = 50) {
    return apiFetch<HistoryListResponse>('/api/familyos/personal/history', {
      params: { type, page, page_size: pageSize },
    })
  },
}
