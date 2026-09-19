import { apiFetch } from '../client'
import type {
  FamilyRecurringExpenseSummaryListResponse,
  FamilyRecurringExpenseMineListResponse,
  FamilyRecurringExpenseCreateResponse,
  FamilyRecurringExpenseUpdateResponse,
  FamilyExpenseLogListResponse,
  FamilyExpenseLogDetailResponse,
  FamilyExpenseLogCreateResponse,
  FamilyExpenseLogUpdateResponse,
  ExpenseLogsFilters,
  PersonalExpenseLogListResponse,
  PersonalExpenseLogDetailResponse,
  PersonalExpenseLogCreateResponse,
  PersonalExpenseLogUpdateResponse,
} from '../types'

export const expensesRecurringApi = {
  listRecurring(familyId: string, page = 1, pageSize = 20) {
    return apiFetch<FamilyRecurringExpenseSummaryListResponse>(
      `/api/familyos/families/${familyId}/expenses`,
      { params: { page, page_size: pageSize } },
    )
  },

  quickAddRecurring(familyId: string, formData: FormData) {
    return apiFetch<FamilyRecurringExpenseCreateResponse>(
      `/api/familyos/families/${familyId}/expenses/recurring-quick-add`,
      { method: 'POST', body: formData },
    )
  },

  listMyRecurringGlobal(page = 1, pageSize = 20, personalOnly = true) {
    return apiFetch<FamilyRecurringExpenseMineListResponse>(
      `/api/familyos/expenses/recurring/mine`,
      { params: { page, page_size: pageSize, personal_only: personalOnly } },
    )
  },

  listMyFamilyManagedRecurring(familyId: string, page = 1, pageSize = 20) {
    return apiFetch<FamilyRecurringExpenseMineListResponse>(
      `/api/familyos/families/${familyId}/expenses/recurring/mine`,
      { params: { page, page_size: pageSize } },
    )
  },

  updateFamilyManagedRecurring(familyId: string, expenseId: string, formData: FormData) {
    return apiFetch<FamilyRecurringExpenseUpdateResponse>(
      `/api/familyos/families/${familyId}/expenses/recurring/${expenseId}`,
      { method: 'PATCH', body: formData },
    )
  },

  createRecurringGlobal(formData: FormData) {
    return apiFetch<FamilyRecurringExpenseCreateResponse>(
      `/api/familyos/expenses/recurring`,
      { method: 'POST', body: formData },
    )
  },

  updateRecurringGlobal(expenseId: string, formData: FormData) {
    return apiFetch<FamilyRecurringExpenseUpdateResponse>(
      `/api/familyos/expenses/recurring/${expenseId}`,
      { method: 'PATCH', body: formData },
    )
  },

  cancelRecurringGlobal(expenseId: string) {
    return apiFetch<FamilyRecurringExpenseUpdateResponse>(
      `/api/familyos/expenses/recurring/${expenseId}/cancel`,
      { method: 'POST' },
    )
  },

  listMyLogs(filters: ExpenseLogsFilters = {}) {
    const { page = 1, page_size = 20, start_date, end_date, category_id } = filters
    return apiFetch<PersonalExpenseLogListResponse>(`/api/familyos/expenses/logs`, {
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
    return apiFetch<PersonalExpenseLogDetailResponse>(`/api/familyos/expenses/logs/${logId}`)
  },

  createMyLog(formData: FormData) {
    return apiFetch<PersonalExpenseLogCreateResponse>(`/api/familyos/expenses/logs`, {
      method: 'POST',
      body: formData,
    })
  },

  updateMyLog(logId: string, formData: FormData) {
    return apiFetch<PersonalExpenseLogUpdateResponse>(`/api/familyos/expenses/logs/${logId}`, {
      method: 'PATCH',
      body: formData,
    })
  },

  listLogs(familyId: string, filters: ExpenseLogsFilters = {}) {
    const { page = 1, page_size = 20, start_date, end_date, logged_by_user_id, category_id } = filters
    return apiFetch<FamilyExpenseLogListResponse>(
      `/api/familyos/families/${familyId}/expenses/logs`,
      {
        params: {
          page,
          page_size,
          ...(start_date ? { start_date } : {}),
          ...(end_date ? { end_date } : {}),
          ...(logged_by_user_id ? { logged_by_user_id } : {}),
          ...(category_id ? { category_id } : {}),
        },
      },
    )
  },

  getLogDetail(familyId: string, logId: string) {
    return apiFetch<FamilyExpenseLogDetailResponse>(
      `/api/familyos/families/${familyId}/expenses/logs/${logId}`,
    )
  },

  createLog(familyId: string, formData: FormData) {
    return apiFetch<FamilyExpenseLogCreateResponse>(
      `/api/familyos/families/${familyId}/expenses/logs`,
      { method: 'POST', body: formData },
    )
  },

  updateLog(familyId: string, logId: string, formData: FormData) {
    return apiFetch<FamilyExpenseLogUpdateResponse>(
      `/api/familyos/families/${familyId}/expenses/logs/${logId}`,
      { method: 'PATCH', body: formData },
    )
  },
}
