import { apiFetch } from '../client'
import type { CurrencyRateListResponse, CurrencyRate, CreateCurrencyRateRequest, ConvertedAmount } from '../types'

export const currencyApi = {
  list() {
    return apiFetch<CurrencyRateListResponse>('/api/familyos/currency-rates')
  },

  convert(amount: number, base: string, quote: string) {
    return apiFetch<ConvertedAmount>('/api/familyos/currency-rates/convert', {
      params: { amount, base, quote },
    })
  },

  create(body: CreateCurrencyRateRequest) {
    return apiFetch<CurrencyRate>('/api/familyos/currency-rates', {
      method: 'POST',
      json: body,
    })
  },

  finalize(rateId: string) {
    return apiFetch<CurrencyRate>(`/api/familyos/currency-rates/${rateId}/finalize`, {
      method: 'POST',
    })
  },
}
