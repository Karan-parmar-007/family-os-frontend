import { apiFetch } from '../client'
import type { GoalListResponse } from '../types'

export const goalsApi = {
  list(
    familyId: string,
    page = 1,
    pageSize = 20,
    filters: Record<string, string> = {},
  ) {
    return apiFetch<GoalListResponse>(
      `/api/familyos/families/${familyId}/goals`,
      { params: { page, page_size: pageSize, ...filters } },
    )
  },

  history(familyId: string, page = 1, pageSize = 20) {
    return apiFetch<GoalListResponse>(
      `/api/familyos/families/${familyId}/goals/history`,
      { params: { page, page_size: pageSize } },
    )
  },

  create(
    familyId: string,
    body: {
      goal_name: string
      target_amount: number
      notes?: string
      access_level?: string
      is_personal?: boolean
    },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/goals`, {
      method: 'POST',
      json: body,
    })
  },

  update(
    familyId: string,
    goalId: string,
    body: {
      goal_name?: string
      target_amount?: number
      notes?: string
      status?: string
    },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/goals/${goalId}`, {
      method: 'PATCH',
      json: body,
    })
  },

  remove(familyId: string, goalId: string) {
    return apiFetch(`/api/familyos/families/${familyId}/goals/${goalId}`, {
      method: 'DELETE',
    })
  },

  addContribution(
    familyId: string,
    goalId: string,
    body: { amount: number; note?: string },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/goals/${goalId}/contributions`, {
      method: 'POST',
      json: body,
    })
  },

  withdraw(
    familyId: string,
    goalId: string,
    body: { amount: number; note?: string },
  ) {
    return apiFetch(`/api/familyos/families/${familyId}/goals/${goalId}/withdraw`, {
      method: 'POST',
      json: body,
    })
  },

  achieve(familyId: string, goalId: string) {
    return apiFetch(`/api/familyos/families/${familyId}/goals/${goalId}/achieve`, {
      method: 'POST',
    })
  },

  release(familyId: string, goalId: string) {
    return apiFetch(`/api/familyos/families/${familyId}/goals/${goalId}/release`, {
      method: 'POST',
    })
  },
}
