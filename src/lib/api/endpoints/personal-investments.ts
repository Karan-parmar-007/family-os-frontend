import { apiFetch } from '../client'
import type {
  FamilyInvestmentListResponse,
  FamilyInvestmentResponse,
  CreateInvestmentRequest,
  UpdateInvestmentRequest,
  ContributeToInvestmentRequest,
  RedeemInvestmentRequest,
  UpdateInvestmentValueRequest,
  InvestmentTxnListResponse,
} from '../types'

export const personalInvestmentsApi = {
  list(params?: { status?: string }, page = 1, pageSize = 20) {
    return apiFetch<FamilyInvestmentListResponse>('/api/familyos/personal/investments', {
      params: { page, page_size: pageSize, ...params },
    })
  },

  history(page = 1, pageSize = 20) {
    return apiFetch<FamilyInvestmentListResponse>('/api/familyos/personal/investments/history', {
      params: { page, page_size: pageSize },
    })
  },

  create(familyId: string, data: CreateInvestmentRequest) {
    return apiFetch<FamilyInvestmentResponse>('/api/familyos/personal/investments', {
      method: 'POST',
      params: { family_id: familyId },
      json: data,
    })
  },

  get(investmentId: string) {
    return apiFetch<FamilyInvestmentResponse>(`/api/familyos/personal/investments/${investmentId}`)
  },

  update(investmentId: string, data: UpdateInvestmentRequest) {
    return apiFetch<FamilyInvestmentResponse>(`/api/familyos/personal/investments/${investmentId}`, {
      method: 'PATCH',
      json: data,
    })
  },

  remove(investmentId: string) {
    return apiFetch(`/api/familyos/personal/investments/${investmentId}`, { method: 'DELETE' })
  },

  contribute(investmentId: string, data: ContributeToInvestmentRequest) {
    return apiFetch<FamilyInvestmentResponse>(
      `/api/familyos/personal/investments/${investmentId}/contribute`,
      { method: 'POST', json: data },
    )
  },

  redeem(investmentId: string, data: RedeemInvestmentRequest) {
    return apiFetch<FamilyInvestmentResponse>(
      `/api/familyos/personal/investments/${investmentId}/redeem`,
      { method: 'POST', json: data },
    )
  },

  updateValue(investmentId: string, data: UpdateInvestmentValueRequest) {
    return apiFetch<FamilyInvestmentResponse>(
      `/api/familyos/personal/investments/${investmentId}/value`,
      { method: 'POST', json: data },
    )
  },

  txns(investmentId: string) {
    return apiFetch<InvestmentTxnListResponse>(
      `/api/familyos/personal/investments/${investmentId}/txns`,
    )
  },

  splitPlan(
    investmentId: string,
    body: { splitLines: { poolType: string; amount: number; familyId?: string }[] },
  ) {
    return apiFetch(`/api/familyos/personal/investments/${investmentId}/split-plan`, {
      method: 'POST',
      json: body,
    })
  },
}
