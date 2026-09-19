import { apiFetch } from '../client'
import type { ScheduledJobListResponse, ScheduledJobResponse } from '../types'

export const schedulerApi = {
  list(
    familyId: string,
    page = 1,
    pageSize = 20,
    filters: { status?: string; assigned_user_id?: string } = {},
  ) {
    return apiFetch<ScheduledJobListResponse>(`/api/familyos/families/${familyId}/jobs`, {
      params: { page, page_size: pageSize, ...filters },
    })
  },

  listMine(familyId: string, page = 1, pageSize = 20) {
    return apiFetch<ScheduledJobListResponse>(`/api/familyos/families/${familyId}/jobs/mine`, {
      params: { page, page_size: pageSize },
    })
  },

  get(familyId: string, jobId: string) {
    return apiFetch<ScheduledJobResponse>(`/api/familyos/families/${familyId}/jobs/${jobId}`)
  },

  action(
    familyId: string,
    jobId: string,
    body: { action: string; delay_days?: number },
  ) {
    return apiFetch<ScheduledJobResponse>(`/api/familyos/families/${familyId}/jobs/${jobId}/action`, {
      method: 'POST',
      json: body,
    })
  },

  runNow(force = false) {
    return apiFetch<{
      moneyRulesApplied: number
      transferOffers: number
      forced: boolean
    }>('/api/familyos/cron/run', {
      method: 'POST',
      params: { force },
    })
  },
}
