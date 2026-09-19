import { apiFetch } from '../client'
import type { CurrencyItem } from './currencies'

export interface AdminUserFamilyItem {
  id: string
  name: string
  isFamilyManager: boolean
  joinedAt: string
}

export interface AdminUserSummary {
  id: string
  ssoUserId: string
  email: string
  displayName: string
  personalCurrency: string
  timezone: string
  personalCode: string
  maxFamilyMemberships: number
  familyCount: number
  families: AdminUserFamilyItem[]
  createdAt: string
}

export interface AdminFamilySummary {
  id: string
  name: string
  currency: string
  timezone: string
  memberCount: number
  headName: string | null
  createdAt: string
}

export interface CurrencyCreatePayload {
  code: string
  name: string
  symbol: string
  rateToUsd: number
  isActive?: boolean
}

export interface CurrencyUpdatePayload {
  name?: string
  symbol?: string
  rateToUsd?: number
  isActive?: boolean
}

export const adminApi = {
  // Currencies
  listCurrencies(): Promise<{ items: CurrencyItem[] }> {
    return apiFetch<{ items: CurrencyItem[] }>('/api/familyos/admin/currencies', { method: 'GET' })
  },
  createCurrency(body: CurrencyCreatePayload): Promise<CurrencyItem> {
    return apiFetch<CurrencyItem>('/api/familyos/admin/currencies', {
      method: 'POST',
      json: body,
    })
  },
  updateCurrency(code: string, body: CurrencyUpdatePayload): Promise<CurrencyItem> {
    return apiFetch<CurrencyItem>(`/api/familyos/admin/currencies/${code}`, {
      method: 'PUT',
      json: body,
    })
  },
  deleteCurrency(code: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/familyos/admin/currencies/${code}`, {
      method: 'DELETE',
    })
  },

  // Users
  listUsers(): Promise<{ items: AdminUserSummary[] }> {
    return apiFetch<{ items: AdminUserSummary[] }>('/api/familyos/admin/users', { method: 'GET' })
  },
  updateUserCap(userId: string, maxFamilyMemberships: number): Promise<{ message: string; maxFamilyMemberships: number }> {
    return apiFetch<{ message: string; maxFamilyMemberships: number }>(`/api/familyos/admin/users/${userId}`, {
      method: 'PATCH',
      json: { maxFamilyMemberships },
    })
  },
  deleteUser(userId: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/familyos/admin/users/${userId}`, {
      method: 'DELETE',
    })
  },

  // Families
  listFamilies(): Promise<{ items: AdminFamilySummary[] }> {
    return apiFetch<{ items: AdminFamilySummary[] }>('/api/familyos/admin/families', { method: 'GET' })
  },
  deleteFamily(familyId: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/familyos/admin/families/${familyId}`, {
      method: 'DELETE',
    })
  },
}
