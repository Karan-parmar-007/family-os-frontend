import { apiFetch } from '../client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SplitLinePayload = {
  poolType: string // CURRENT_FAMILY | PERSONAL | OTHER_FAMILY
  familyId?: string | null
  userId?: string | null
  amount: string
  expectedTotal?: string
  obligationRemaining?: string
}

export type PaymentSplitPlanPayload = {
  entityType: string
  entityId: string
  lines: SplitLinePayload[]
}

export type FundingBreakdownEntry = {
  id: string
  entityType: string
  entityId: string
  jobId?: string | null
  poolType: string
  familyId?: string | null
  userId?: string | null
  amount: string
  direction: string
  createdAt: string
}

export type RescheduleRequest = {
  newDate: string // ISO datetime
  mode: 'ONE_TIME' | 'PERMANENT'
}

export type RescheduleResponse = {
  jobId: string
  scheduledFor: string
  mode: string
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export const fundingApi = {
  /**
   * Save or update the payment split plan for an entity.
   */
  saveSplitPlan(data: PaymentSplitPlanPayload) {
    return apiFetch<{ message: string }>('/api/familyos/funding/split-plan', {
      method: 'POST',
      json: data,
    })
  },

  /**
   * Fetch the stored split plan for an entity.
   */
  getSplitPlan(entityType: string, entityId: string) {
    return apiFetch<{ lines: SplitLinePayload[] }>(
      `/api/familyos/funding/split-plan/${entityType}/${entityId}`,
    )
  },

  /**
   * Fetch funding breakdown entries for a job.
   */
  getBreakdown(jobId: string) {
    return apiFetch<{ entries: FundingBreakdownEntry[] }>(
      `/api/familyos/funding/breakdown/${jobId}`,
    )
  },

  getEntityBreakdown(familyId: string, entityType: string, entityId: string) {
    return apiFetch<{ entries: FundingBreakdownEntry[] }>(
      `/api/familyos/families/${familyId}/funding-breakdown`,
      { params: { entity_type: entityType, entity_id: entityId } },
    )
  },

  /**
   * Reschedule a family-scoped job.
   */
  rescheduleFamilyJob(
    familyId: string,
    jobId: string,
    data: RescheduleRequest,
  ) {
    return apiFetch<RescheduleResponse>(
      `/api/familyos/families/${familyId}/jobs/${jobId}/reschedule`,
      { method: 'POST', json: data },
    )
  },

  /**
   * Reschedule a personal job (no family scope).
   */
  reschedulePersonalJob(jobId: string, data: RescheduleRequest) {
    return apiFetch<RescheduleResponse>(`/api/familyos/jobs/${jobId}/reschedule`, {
      method: 'POST',
      json: data,
    })
  },
}
