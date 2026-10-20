import { apiFetch } from '../client'
import type { InsuranceListResponse } from '../types'

export const insuranceApi = {
  list(
    familyId: string,
    page = 1,
    pageSize = 20,
    filters: Record<string, string> = {},
  ) {
    return apiFetch<InsuranceListResponse>(
      `/api/familyos/families/${familyId}/insurance`,
      { params: { page, page_size: pageSize, ...filters } },
    )
  },

  create(
    familyId: string,
    body: {
      insurance_name: string
      type: string
      premium_amount: number
      coverage_amount: number
      provider?: string
      policy_number?: string
      premium_every?: string
      next_premium_date?: string
      schedule_mode?: 'NONE' | 'INTERVAL' | 'CUSTOM'
      annual_premium?: number
      category_id?: string | null
      let_everyone_edit?: boolean
      installments?: { dueDate: string; amount: number }[]
      is_personal?: boolean
      access_level?: string
      document_id?: string
    },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/insurance`, {
      method: 'POST',
      json: body,
    })
  },

  update(
    familyId: string,
    insuranceId: string,
    body: Record<string, unknown>,
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/insurance/${insuranceId}`, {
      method: 'PATCH',
      json: body,
    })
  },

  remove(familyId: string, insuranceId: string) {
    return apiFetch(`/api/familyos/families/${familyId}/insurance/${insuranceId}`, {
      method: 'DELETE',
    })
  },

  payNow(
    familyId: string,
    insuranceId: string,
    body: { paidExternally?: boolean },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/insurance/${insuranceId}/pay-now`, {
      method: 'POST',
      json: body,
    })
  },
}
