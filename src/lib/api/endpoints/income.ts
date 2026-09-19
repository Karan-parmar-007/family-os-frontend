import { apiFetch } from '../client'
import type {
  FamilyRecurringIncomeSummaryListResponse,
  FamilyRecurringIncomeMineListResponse,
  FamilyRecurringIncomeCreateResponse,
  FamilyRecurringIncomeUpdateResponse,
  FamilyIncomeLogListResponse,
  FamilyIncomeLogDetailResponse,
  FamilyIncomeLogCreateResponse,
  FamilyIncomeLogUpdateResponse,
  IncomeLogsFilters,
  PersonalIncomeLogListResponse,
  PersonalIncomeLogDetailResponse,
  PersonalIncomeLogCreateResponse,
  PersonalIncomeLogUpdateResponse,
} from '../types'

export const incomeApi = {
  // ── Recurring incomes ───────────────────────────────────────────────

  /** List recurring income splits visible in this family (read-only). */
  listRecurring(familyId: string, page = 1, pageSize = 20) {
    return apiFetch<FamilyRecurringIncomeSummaryListResponse>(
      `/api/familyos/families/${familyId}/incomes`,
      { params: { page, page_size: pageSize } },
    )
  },

  /** Quick-add recurring income for this family + personal (family page only). */
  quickAddRecurring(familyId: string, formData: FormData) {
    return apiFetch<FamilyRecurringIncomeCreateResponse>(
      `/api/familyos/families/${familyId}/incomes/recurring-quick-add`,
      { method: 'POST', body: formData },
    )
  },

  /** List current user's recurring incomes (full detail, personal page). */
  listMyRecurringGlobal(page = 1, pageSize = 20, personalOnly = true) {
    return apiFetch<FamilyRecurringIncomeMineListResponse>(
      `/api/familyos/incomes/recurring/mine`,
      { params: { page, page_size: pageSize, personal_only: personalOnly } },
    )
  },

  /** List current user's family-managed recurring incomes in this family. */
  listMyFamilyManagedRecurring(familyId: string, page = 1, pageSize = 20) {
    return apiFetch<FamilyRecurringIncomeMineListResponse>(
      `/api/familyos/families/${familyId}/incomes/recurring/mine`,
      { params: { page, page_size: pageSize } },
    )
  },

  updateFamilyManagedRecurring(familyId: string, incomeId: string, formData: FormData) {
    return apiFetch<FamilyRecurringIncomeUpdateResponse>(
      `/api/familyos/families/${familyId}/incomes/recurring/${incomeId}`,
      { method: 'PATCH', body: formData },
    )
  },

  createRecurringGlobal(formData: FormData) {
    return apiFetch<FamilyRecurringIncomeCreateResponse>(
      `/api/familyos/incomes/recurring`,
      { method: 'POST', body: formData },
    )
  },

  updateRecurringGlobal(incomeId: string, formData: FormData) {
    return apiFetch<FamilyRecurringIncomeUpdateResponse>(
      `/api/familyos/incomes/recurring/${incomeId}`,
      { method: 'PATCH', body: formData },
    )
  },

  cancelRecurringGlobal(incomeId: string) {
    return apiFetch<FamilyRecurringIncomeUpdateResponse>(
      `/api/familyos/incomes/recurring/${incomeId}/cancel`,
      { method: 'POST' },
    )
  },

  // ── Personal (user-scoped) income logs ─────────────────────────────

  listMyLogs(filters: IncomeLogsFilters = {}) {
    const { page = 1, page_size = 20, start_date, end_date, category_id } = filters
    return apiFetch<PersonalIncomeLogListResponse>(`/api/familyos/incomes/logs`, {
      params: {
        page,
        page_size,
        ...(start_date ? { start_date } : {}),
        ...(end_date ? { end_date } : {}),
        ...(category_id ? { category_id } : {}),
      },
    })
  },

  getMyLogDetail(logId: string) {
    return apiFetch<PersonalIncomeLogDetailResponse>(`/api/familyos/incomes/logs/${logId}`)
  },

  createMyLog(formData: FormData) {
    return apiFetch<PersonalIncomeLogCreateResponse>(`/api/familyos/incomes/logs`, {
      method: 'POST',
      body: formData,
    })
  },

  updateMyLog(logId: string, formData: FormData) {
    return apiFetch<PersonalIncomeLogUpdateResponse>(`/api/familyos/incomes/logs/${logId}`, {
      method: 'PATCH',
      body: formData,
    })
  },

  // ── Income logs ─────────────────────────────────────────────────────

  /** List family income logs (paginated, with optional filters). */
  listLogs(familyId: string, filters: IncomeLogsFilters = {}) {
    const { page = 1, page_size = 20, start_date, end_date, earned_by_user_id, category_id } = filters
    return apiFetch<FamilyIncomeLogListResponse>(
      `/api/familyos/families/${familyId}/incomes/logs`,
      {
        params: {
          page,
          page_size,
          ...(start_date ? { start_date } : {}),
          ...(end_date ? { end_date } : {}),
          ...(earned_by_user_id ? { earned_by_user_id } : {}),
          ...(category_id ? { category_id } : {}),
        },
      },
    )
  },

  /** Fetch full detail of a single income log (for edit modal). */
  getLogDetail(familyId: string, logId: string) {
    return apiFetch<FamilyIncomeLogDetailResponse>(
      `/api/familyos/families/${familyId}/incomes/logs/${logId}`,
    )
  },

  /** Create a manual income log (multipart). */
  createLog(familyId: string, formData: FormData) {
    return apiFetch<FamilyIncomeLogCreateResponse>(
      `/api/familyos/families/${familyId}/incomes/logs`,
      { method: 'POST', body: formData },
    )
  },

  updateLog(familyId: string, logId: string, formData: FormData) {
    return apiFetch<FamilyIncomeLogUpdateResponse>(
      `/api/familyos/families/${familyId}/incomes/logs/${logId}`,
      { method: 'PATCH', body: formData },
    )
  },

  listCategories(familyId: string) {
    return apiFetch<{ items: Array<{ id: string; categoryName: string; familyId: string }> }>(
      `/api/familyos/families/${familyId}/incomes/categories`
    )
  },

  createCategory(familyId: string, categoryName: string) {
    return apiFetch<{ id: string; categoryName: string; familyId: string }>(
      `/api/familyos/families/${familyId}/incomes/categories`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryName }),
      }
    )
  },
}
