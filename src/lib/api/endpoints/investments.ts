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

export const investmentsApi = {
  list(familyId: string, params?: { status?: string }) {
    return apiFetch<FamilyInvestmentListResponse>(
      `/api/familyos/families/${familyId}/investments`,
      { params },
    )
  },

  create(familyId: string, data: CreateInvestmentRequest) {
    return apiFetch<FamilyInvestmentResponse>(
      `/api/familyos/families/${familyId}/investments`,
      { method: 'POST', json: data },
    )
  },

  get(familyId: string, investmentId: string) {
    return apiFetch<FamilyInvestmentResponse>(
      `/api/familyos/families/${familyId}/investments/${investmentId}`,
    )
  },

  update(familyId: string, investmentId: string, data: UpdateInvestmentRequest) {
    return apiFetch<FamilyInvestmentResponse>(
      `/api/familyos/families/${familyId}/investments/${investmentId}`,
      { method: 'PATCH', json: data },
    )
  },

  remove(familyId: string, investmentId: string) {
    return apiFetch(`/api/familyos/families/${familyId}/investments/${investmentId}`, {
      method: 'DELETE',
    })
  },

  contribute(familyId: string, investmentId: string, data: ContributeToInvestmentRequest) {
    return apiFetch<FamilyInvestmentResponse>(
      `/api/familyos/families/${familyId}/investments/${investmentId}/contribute`,
      { method: 'POST', json: data },
    )
  },

  redeem(familyId: string, investmentId: string, data: RedeemInvestmentRequest) {
    return apiFetch<FamilyInvestmentResponse>(
      `/api/familyos/families/${familyId}/investments/${investmentId}/redeem`,
      { method: 'POST', json: data },
    )
  },

  updateValue(familyId: string, investmentId: string, data: UpdateInvestmentValueRequest) {
    return apiFetch<FamilyInvestmentResponse>(
      `/api/familyos/families/${familyId}/investments/${investmentId}/value`,
      { method: 'POST', json: data },
    )
  },

  history(familyId: string) {
    return apiFetch<FamilyInvestmentListResponse>(
      `/api/familyos/families/${familyId}/investments/history`,
    )
  },

  txns(familyId: string, investmentId: string) {
    return apiFetch<InvestmentTxnListResponse>(
      `/api/familyos/families/${familyId}/investments/${investmentId}/txns`,
    )
  },

  splitPlan(
    familyId: string,
    investmentId: string,
    body: { splitLines: { poolType: string; amount: number; familyId?: string }[] },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/investments/${investmentId}/split-plan`, {
      method: 'POST',
      json: body,
    })
  },
}
