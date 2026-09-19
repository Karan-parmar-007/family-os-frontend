import { apiFetch } from '../client'
import type {
  DebtListResponse,
  DebtPaymentEventListResponse,
  DebtScopeViewSummary,
  DebtSummary,
  PartPaymentResponse,
} from '../types'
import type { DebtUpsertBody, PartPaymentBody, SplitLineBody } from './debts'

export type { DebtUpsertBody }

export const personalDebtsApi = {
  list(page = 1, pageSize = 20, status = 'ACTIVE') {
    return apiFetch<DebtListResponse>('/api/familyos/personal/debts', {
      params: { page, page_size: pageSize, status },
    })
  },

  history(page = 1, pageSize = 20) {
    return apiFetch<DebtListResponse>('/api/familyos/personal/debts/history', {
      params: { page, page_size: pageSize },
    })
  },

  get(debtId: string) {
    return apiFetch<DebtSummary>(`/api/familyos/personal/debts/${debtId}`)
  },

  create(familyId: string, body: DebtUpsertBody) {
    return apiFetch<DebtSummary>('/api/familyos/personal/debts', {
      method: 'POST',
      params: { family_id: familyId },
      json: body,
    })
  },

  update(debtId: string, body: Record<string, unknown>) {
    return apiFetch<DebtSummary>(`/api/familyos/personal/debts/${debtId}`, {
      method: 'PATCH',
      json: body,
    })
  },

  remove(debtId: string) {
    return apiFetch(`/api/familyos/personal/debts/${debtId}`, { method: 'DELETE' })
  },

  partPayment(debtId: string, body: PartPaymentBody) {
    return apiFetch<PartPaymentResponse>(`/api/familyos/personal/debts/${debtId}/part-payment`, {
      method: 'POST',
      json: body,
    })
  },

  simulatePartPayment(debtId: string, body: PartPaymentBody) {
    return apiFetch<PartPaymentResponse>(
      `/api/familyos/personal/debts/${debtId}/part-payment/simulate`,
      { method: 'POST', json: body },
    )
  },

  listPaymentEvents(debtId: string) {
    return apiFetch<DebtPaymentEventListResponse>(
      `/api/familyos/personal/debts/${debtId}/payment-events`,
    )
  },

  getScopeViews(debtId: string) {
    return apiFetch<{ items: DebtScopeViewSummary[] }>(
      `/api/familyos/personal/debts/${debtId}/scope-views`,
    )
  },

  putScopeViews(
    debtId: string,
    views: Array<Partial<DebtScopeViewSummary> & { scopeKind: string }>,
  ) {
    return apiFetch<{ items: DebtScopeViewSummary[] }>(
      `/api/familyos/personal/debts/${debtId}/scope-views`,
      { method: 'PUT', json: { scopeViews: views } },
    )
  },

  upsertSplitPlan(debtId: string, splitLines: SplitLineBody[]) {
    return apiFetch(`/api/familyos/personal/debts/${debtId}/split-plan`, {
      method: 'POST',
      json: { splitLines },
    })
  },

  contribute(
    debtId: string,
    body: {
      amount: number
      poolType?: string
      familyId?: string | null
      userId?: string | null
    },
  ) {
    return apiFetch<{
      amount: number
      balanceForPartPayment: number
      obligationRemaining?: number | null
    }>(`/api/familyos/personal/debts/${debtId}/contributions`, {
      method: 'POST',
      json: body,
    })
  },

  listDefaults(debtId: string) {
    return apiFetch<{
      items: Array<{
        id: string
        reason: string
        amount: number
        fineAmount: number
        status: string
        periodKey: string
        settledAt: string | null
        createdAt: string
      }>
      totalOpen: number
    }>(`/api/familyos/personal/debts/${debtId}/defaults`)
  },

  settleDefault(
    debtId: string,
    defaultId: string,
    body: { splitLines?: SplitLineBody[]; note?: string },
  ) {
    return apiFetch(
      `/api/familyos/personal/debts/${debtId}/defaults/${defaultId}/settle`,
      { method: 'POST', json: body },
    )
  },

  waiveDefault(debtId: string, defaultId: string, body: { note?: string }) {
    return apiFetch(`/api/familyos/personal/debts/${debtId}/defaults/${defaultId}/waive`, {
      method: 'POST',
      json: body,
    })
  },
}
