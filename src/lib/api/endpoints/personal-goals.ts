import { apiFetch } from '../client'
import type { GoalListResponse } from '../types'

export const personalGoalsApi = {
  list(page = 1, pageSize = 20, status = 'ACTIVE') {
    return apiFetch<GoalListResponse>('/api/familyos/personal/goals', {
      params: { page, page_size: pageSize, status },
    })
  },

  history(page = 1, pageSize = 20) {
    return apiFetch<GoalListResponse>('/api/familyos/personal/goals/history', {
      params: { page, page_size: pageSize },
    })
  },

  create(
    familyId: string,
    body: {
      goal_name: string
      target_amount: number
      notes?: string
      access_level?: string
    },
  ) {
    return apiFetch('/api/familyos/personal/goals', {
      method: 'POST',
      params: { family_id: familyId },
      json: body,
    })
  },

  update(
    goalId: string,
    body: {
      goal_name?: string
      target_amount?: number
      notes?: string
      status?: string
    },
  ) {
    return apiFetch(`/api/familyos/personal/goals/${goalId}`, {
      method: 'PATCH',
      json: body,
    })
  },

  remove(goalId: string) {
    return apiFetch(`/api/familyos/personal/goals/${goalId}`, { method: 'DELETE' })
  },

  addContribution(goalId: string, body: { amount: number; note?: string }) {
    return apiFetch(`/api/familyos/personal/goals/${goalId}/contributions`, {
      method: 'POST',
      json: body,
    })
  },

  withdraw(goalId: string, body: { amount: number; note?: string }) {
    return apiFetch(`/api/familyos/personal/goals/${goalId}/withdraw`, {
      method: 'POST',
      json: body,
    })
  },

  achieve(goalId: string) {
    return apiFetch(`/api/familyos/personal/goals/${goalId}/achieve`, {
      method: 'POST',
    })
  },

  release(goalId: string) {
    return apiFetch(`/api/familyos/personal/goals/${goalId}/release`, {
      method: 'POST',
    })
  },
}
