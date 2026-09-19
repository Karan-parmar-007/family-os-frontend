import { apiFetch } from '../client'
import type { UpcomingResponse } from '../types'

export const upcomingApi = {
  list(
    familyId: string,
    options: {
      horizonDays?: number
      scope?: string
      subFamilyId?: string
    } = {},
  ) {
    const params: Record<string, string | number> = {}
    if (options.horizonDays != null) params.horizon_days = options.horizonDays
    if (options.scope) params.scope = options.scope
    if (options.subFamilyId) params.sub_family_id = options.subFamilyId
    return apiFetch<UpcomingResponse>(`/api/familyos/families/${familyId}/upcoming`, {
      params,
    })
  },

  listPersonal(horizonDays = 90) {
    return apiFetch<UpcomingResponse>('/api/familyos/upcoming', {
      params: { horizon_days: horizonDays },
    })
  },
}
