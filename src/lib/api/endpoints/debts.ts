import { apiFetch } from '../client'
import type {
  DebtListResponse,
  DebtPaymentEventListResponse,
  DebtScopeViewSummary,
  DebtSummary,
  GetDocumentResponse,
  PartPaymentRequest,
  PartPaymentResponse,
} from '../types'

export interface SplitLineBody {
  poolType: 'CURRENT_FAMILY' | 'PERSONAL' | 'OTHER_FAMILY'
  amount: number
  familyId?: string | null
  userId?: string | null
  expectedTotal?: number | null
  obligationRemaining?: number | null
}

export type DebtUpsertBody = {
  debt_name: string
  type: string
  is_personal?: boolean
  total_amount: number
  remaining_amount?: number
  has_interest?: boolean
  interest_type?: string
  interest_rate?: number
  compounding_frequency?: string
  fixed_fee_amount?: number
  has_emi?: boolean
  emi_amount?: number
  emi_every?: string
  emi_interval_days?: number | null
  emi_interval_months?: number | null
  emi_interval_years?: number | null
  tenure_months?: number
  emi_next_date?: string
  requires_confirmation?: boolean
  bounce_fine_amount?: number
  allow_auto_default?: boolean
  is_masked?: boolean
  real_total_amount?: number
  real_remaining_amount?: number
  real_emi_amount?: number
  real_interest_rate?: number
  show_split_to_family?: boolean
  access_level?: string
  document_id?: string | null
  show_doc_to_all?: boolean
  doc_viewer_user_ids?: string[]
  start_date?: string
  end_date?: string
  splitLines?: SplitLineBody[]
  scopeViews?: Array<Partial<DebtScopeViewSummary> & { scopeKind: string }>
}

export type PartPaymentBody = PartPaymentRequest & {
  splitLines?: SplitLineBody[]
}

export type DebtQuoteBody = {
  principal: number
  interest_type: string
  annual_rate_pct?: number
  compounding_frequency?: string
  emi_amount?: number
  tenure_months?: number
  fixed_fee_amount?: number
}

export type DebtQuoteResponse = {
  emi: number
  tenure_months: number
  annual_rate_pct: number
  total_interest: number
  total_payable: number
  interest_type: string
  compounding_frequency: string
}

export const debtsApi = {
  list(
    familyId: string,
    page = 1,
    pageSize = 20,
    filters: Record<string, string> = {},
  ) {
    return apiFetch<DebtListResponse>(`/api/familyos/families/${familyId}/debts`, {
      params: { page, page_size: pageSize, ...filters },
    })
  },

  get(familyId: string, debtId: string) {
    return apiFetch<DebtSummary>(`/api/familyos/families/${familyId}/debts/${debtId}`)
  },

  create(familyId: string, body: DebtUpsertBody) {
    return apiFetch<DebtSummary>(`/api/familyos/families/${familyId}/debts`, {
      method: 'POST',
      json: body,
    })
  },

  quoteDebt(familyId: string, body: DebtQuoteBody) {
    return apiFetch<DebtQuoteResponse>(
      `/api/familyos/families/${familyId}/debts/quote`,
      {
        method: 'POST',
        json: body,
      },
    )
  },

  /** Upload a document file for a family; returns the document metadata including id. */
  async uploadDocument(
    familyId: string,
    file: File,
  ): Promise<GetDocumentResponse> {
    const formData = new FormData()
    formData.append('file', file)
    // Use apiFetch so the CSRF header is included automatically (double-submit pattern).
    // Do NOT set Content-Type manually — the browser sets the correct multipart boundary.
    return apiFetch<GetDocumentResponse>(
      `/api/familyos/families/${familyId}/documents`,
      {
        method: 'POST',
        body: formData,
      },
    )
  },

  update(familyId: string, debtId: string, body: Record<string, unknown>) {
    return apiFetch<DebtSummary>(`/api/familyos/families/${familyId}/debts/${debtId}`, {
      method: 'PATCH',
      json: body,
    })
  },

  remove(familyId: string, debtId: string) {
    return apiFetch(`/api/familyos/families/${familyId}/debts/${debtId}`, {
      method: 'DELETE',
    })
  },

  partPayment(familyId: string, debtId: string, body: PartPaymentBody) {
    return apiFetch<PartPaymentResponse>(
      `/api/familyos/families/${familyId}/debts/${debtId}/part-payment`,
      { method: 'POST', json: body },
    )
  },

  simulatePartPayment(familyId: string, debtId: string, body: PartPaymentBody) {
    return apiFetch<PartPaymentResponse>(
      `/api/familyos/families/${familyId}/debts/${debtId}/part-payment/simulate`,
      { method: 'POST', json: body },
    )
  },

  listPaymentEvents(familyId: string, debtId: string) {
    return apiFetch<DebtPaymentEventListResponse>(
      `/api/familyos/families/${familyId}/debts/${debtId}/payment-events`,
    )
  },

  getScopeViews(familyId: string, debtId: string) {
    return apiFetch<{ items: DebtScopeViewSummary[] }>(
      `/api/familyos/families/${familyId}/debts/${debtId}/scope-views`,
    )
  },

  putScopeViews(
    familyId: string,
    debtId: string,
    views: Array<Partial<DebtScopeViewSummary> & { scopeKind: string }>,
  ) {
    return apiFetch<{ items: DebtScopeViewSummary[] }>(
      `/api/familyos/families/${familyId}/debts/${debtId}/scope-views`,
      { method: 'PUT', json: { scopeViews: views } },
    )
  },

  listDefaults(familyId: string, debtId: string) {
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
    }>(`/api/familyos/families/${familyId}/debts/${debtId}/defaults`)
  },

  history(familyId: string, page = 1, pageSize = 20) {
    return apiFetch<DebtListResponse>(
      `/api/familyos/families/${familyId}/debts/history`,
      { params: { page, page_size: pageSize } },
    )
  },

  upsertSplitPlan(
    familyId: string,
    debtId: string,
    splitLines: SplitLineBody[],
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/debts/${debtId}/split-plan`, {
      method: 'POST',
      json: { splitLines },
    })
  },

  contribute(
    familyId: string,
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
    }>(`/api/familyos/families/${familyId}/debts/${debtId}/contributions`, {
      method: 'POST',
      json: body,
    })
  },

  settleDefault(
    familyId: string,
    debtId: string,
    defaultId: string,
    body: { splitLines?: SplitLineBody[]; note?: string },
  ) {
    return apiFetch(
      `/api/familyos/families/${familyId}/debts/${debtId}/defaults/${defaultId}/settle`,
      { method: 'POST', json: body },
    )
  },

  waiveDefault(
    familyId: string,
    debtId: string,
    defaultId: string,
    body: { note?: string },
  ) {
    return apiFetch(
      `/api/familyos/families/${familyId}/debts/${debtId}/defaults/${defaultId}/waive`,
      { method: 'POST', json: body },
    )
  },
}
