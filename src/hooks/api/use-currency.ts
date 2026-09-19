import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { currencyApi } from '#/lib/api'
import type { CreateCurrencyRateRequest } from '#/lib/api/familyos/types'

const KEY = ['currencyRates'] as const

export function useCurrencyRates() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => currencyApi.list(),
  })
}

export function useConvertCurrency(amount: number, base: string, quote: string, enabled = true) {
  return useQuery({
    queryKey: ['currencyConvert', amount, base, quote] as const,
    queryFn: () => currencyApi.convert(amount, base, quote),
    enabled: enabled && !!base && !!quote && Number.isFinite(amount),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCurrencyRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCurrencyRateRequest) => currencyApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
    },
  })
}

export function useFinalizeCurrencyRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rateId: string) => currencyApi.finalize(rateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
    },
  })
}
