import { apiFetch } from '../client'
import type {
  ExpenseCategoryListResponse,
  ExpenseCategoryResponse,
  ExpenseLogListResponse,
  ExpenseRecurringListResponse,
} from '../types'

export const expensesApi = {
  listCategories(familyId: string) {
    return apiFetch<ExpenseCategoryListResponse>(
      `/api/familyos/families/${familyId}/expenses/categories`,
    )
  },

  createCategory(familyId: string, categoryName: string) {
    return apiFetch<ExpenseCategoryResponse>(
      `/api/familyos/families/${familyId}/expenses/categories`,
      {
        method: 'POST',
        json: { category_name: categoryName },
      },
    )
  },

  listLogs(
    familyId: string,
    page = 1,
    pageSize = 20,
    filters: Record<string, string> = {},
  ) {
    return apiFetch<ExpenseLogListResponse>(
      `/api/familyos/families/${familyId}/expenses/logs`,
      { params: { page, page_size: pageSize, ...filters } },
    )
  },

  listRecurring(
    familyId: string,
    page = 1,
    pageSize = 20,
    filters: Record<string, string> = {},
  ) {
    return apiFetch<ExpenseRecurringListResponse>(
      `/api/familyos/families/${familyId}/expenses/recurring`,
      { params: { page, page_size: pageSize, ...filters } },
    )
  },

  createLog(
    familyId: string,
    body: {
      expense_name: string
      amount: number
      expense_date: string
      scope_type?: string
      sub_family_id?: string
      is_personal?: boolean
      access_level?: string
      funding_sources?: Array<{
        pool_type: 'FAMILY' | 'PERSONAL'
        family_id?: string | null
        amount: number
      }>
    },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/expenses/logs`, {
      method: 'POST',
      json: body,
    })
  },
}
