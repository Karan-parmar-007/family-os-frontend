import { apiFetch } from '../client'
import type { SavingsPlanListResponse } from '../types'

export const personalSavingsPlansApi = {
  list(page = 1, pageSize = 20, status = 'ACTIVE') {
    return apiFetch<SavingsPlanListResponse>('/api/familyos/personal/savings-plans', {
      params: { page, page_size: pageSize, status },
    })
  },

  history(page = 1, pageSize = 20) {
    return apiFetch<SavingsPlanListResponse>('/api/familyos/personal/savings-plans/history', {
      params: { page, page_size: pageSize },
    })
  },

  create(
    familyId: string,
    body: Parameters<typeof import('./savings-plans').savingsPlansApi.create>[1],
  ) {
    return apiFetch('/api/familyos/personal/savings-plans', {
      method: 'POST',
      params: { family_id: familyId },
      json: body,
    })
  },

  update(planId: string, body: Record<string, unknown>) {
    return apiFetch(`/api/familyos/personal/savings-plans/${planId}`, {
      method: 'PATCH',
      json: body,
    })
  },

  remove(planId: string) {
    return apiFetch(`/api/familyos/personal/savings-plans/${planId}`, { method: 'DELETE' })
  },

  partPayment(
    planId: string,
    body: {
      amount: number
      mode?: 'REDUCE_EMI' | 'KEEP_EMI_REDUCE_TENURE'
      paidExternally?: boolean
    },
  ) {
    return apiFetch(`/api/familyos/personal/savings-plans/${planId}/part-payment`, {
      method: 'POST',
      json: body,
    })
  },

  payout(planId: string, body: { amount: number; note?: string }) {
    return apiFetch(`/api/familyos/personal/savings-plans/${planId}/payout`, {
      method: 'POST',
      json: body,
    })
  },
}
