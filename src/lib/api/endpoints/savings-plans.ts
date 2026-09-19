export interface LinkCandidateListResponse { items: Array<{ id: string; name: string }> }
import { apiFetch } from '../client'
import type { SavingsPlanListResponse } from '../types'

export const savingsPlansApi = {
  list(
    familyId: string,
    page = 1,
    pageSize = 20,
    filters: Record<string, string> = {},
  ) {
    return apiFetch<SavingsPlanListResponse>(
      `/api/familyos/families/${familyId}/savings-plans`,
      { params: { page, page_size: pageSize, ...filters } },
    )
  },

  create(
    familyId: string,
    body: {
      plan_name: string
      target_amount: number
      is_personal?: boolean
      access_level?: string
      contribution_amount?: number
      contribution_every?: string
      confirm_contributions?: boolean
      requires_confirmation?: boolean
      emi_mode?: string
    },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/savings-plans`, {
      method: 'POST',
      json: body,
    })
  },

  update(
    familyId: string,
    planId: string,
    body: {
      plan_name?: string
      target_amount?: number
      accumulated_amount?: number
      status?: string
      contribution_amount?: number
      contribution_every?: string
      next_contribution_date?: string
      confirm_contributions?: boolean
      emi_mode?: string
    },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/savings-plans/${planId}`, {
      method: 'PATCH',
      json: body,
    })
  },

  remove(familyId: string, planId: string) {
    return apiFetch(`/api/familyos/families/${familyId}/savings-plans/${planId}`, {
      method: 'DELETE',
    })
  },

  prepay(
    familyId: string,
    planId: string,
    body: { amount: number; mode?: 'CLEAR_UPCOMING' | 'REDUCE_EMI'; contribution_date?: string },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/savings-plans/${planId}/prepay`, {
      method: 'POST',
      json: body,
    })
  },

  partPayment(
    familyId: string,
    planId: string,
    body: {
      amount: number
      mode?: 'REDUCE_EMI' | 'KEEP_EMI_REDUCE_TENURE'
      paidExternally?: boolean
    },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/savings-plans/${planId}/part-payment`, {
      method: 'POST',
      json: body,
    })
  },

  payout(familyId: string, planId: string, body: { amount: number; note?: string }) {
    return apiFetch(`/api/familyos/families/${familyId}/savings-plans/${planId}/payout`, {
      method: 'POST',
      json: body,
    })
  },

  history(familyId: string, page = 1, pageSize = 20) {
    return apiFetch<SavingsPlanListResponse>(
      `/api/familyos/families/${familyId}/savings-plans/history`,
      { params: { page, page_size: pageSize } },
    )
  },

  addContribution(
    familyId: string,
    planId: string,
    body: { amount: number; direction?: 'IN' | 'OUT'; contribution_date?: string },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/savings-plans/${planId}/contributions`, {
      method: 'POST',
      json: body,
    })
  },

  linkCandidates(familyId: string, purposeType: string) {
    return apiFetch<LinkCandidateListResponse>(
      `/api/familyos/families/${familyId}/savings-plans/link-candidates`,
      { params: { purpose_type: purposeType } },
    )
  },
}
