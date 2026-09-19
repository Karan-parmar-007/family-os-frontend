import { apiFetch } from '../client'
import type { InsuranceListResponse } from '../types'

export type InsuranceUpsertBody = {
  insurance_name: string
  type: string
  premium_amount: number
  coverage_amount: number
  premium_every?: string
  next_premium_date?: string
  emi_count?: number
  is_personal?: boolean
  document_id?: string
}

export const personalInsuranceApi = {
  list(page = 1, pageSize = 20) {
    return apiFetch<InsuranceListResponse>('/api/familyos/personal/insurance', {
      params: { page, page_size: pageSize },
    })
  },

  create(familyId: string, body: InsuranceUpsertBody) {
    return apiFetch('/api/familyos/personal/insurance', {
      method: 'POST',
      params: { family_id: familyId },
      json: body,
    })
  },

  update(insuranceId: string, body: Record<string, unknown>) {
    return apiFetch(`/api/familyos/personal/insurance/${insuranceId}`, {
      method: 'PATCH',
      json: body,
    })
  },

  remove(insuranceId: string) {
    return apiFetch(`/api/familyos/personal/insurance/${insuranceId}`, { method: 'DELETE' })
  },

  payNow(
    insuranceId: string,
    body: { paidExternally?: boolean },
  ) {
    return apiFetch(`/api/familyos/personal/insurance/${insuranceId}/pay-now`, {
      method: 'POST',
      json: body,
    })
  },
}
