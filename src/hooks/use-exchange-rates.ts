import { useEffect, useState } from 'react'
import { fetchRatesFromBase } from '#/lib/currency'

export function useExchangeRates(baseCurrency: string | undefined) {
  const [rates, setRates] = useState<Record<string, number>>(() =>
    baseCurrency ? { [baseCurrency]: 1 } : { USD: 1 },
  )

  useEffect(() => {
    if (!baseCurrency) return
    let cancelled = false
    fetchRatesFromBase(baseCurrency).then((next) => {
      if (!cancelled) setRates(next)
    })
    return () => {
      cancelled = true
    }
  }, [baseCurrency])

  return { rates, baseCurrency: baseCurrency ?? 'USD' }
}
