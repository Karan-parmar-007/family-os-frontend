import { apiFetch } from '../client'

export interface CurrencyItem {
  code: string
  name: string
  symbol: string
  rateToUsd: number
  logoKey: string | null
  logoUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const currenciesApi = {
  list(): Promise<{ items: CurrencyItem[] }> {
    return apiFetch<{ items: CurrencyItem[] }>('/api/familyos/currencies', { method: 'GET' })
  },
}
