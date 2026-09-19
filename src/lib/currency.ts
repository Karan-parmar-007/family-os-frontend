/** Currency helpers — symbols, formatting, and conversion via Frankfurter (ECB rates). */

const rateCache = new Map<string, Record<string, number>>()

export function getCurrencySymbol(currency: string): string {
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0)
    return parts.find((p) => p.type === 'currency')?.value ?? currency
  } catch {
    return currency
  }
}

export async function fetchRatesFromBase(baseCurrency: string): Promise<Record<string, number>> {
  const base = baseCurrency || 'USD'
  if (rateCache.has(base)) return rateCache.get(base)!

  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}`)
    if (!res.ok) throw new Error('rate fetch failed')
    const data = (await res.json()) as { rates?: Record<string, number> }
    const rates = { ...data.rates, [base]: 1 }
    rateCache.set(base, rates)
    return rates
  } catch {
    return { [base]: 1 }
  }
}

/** Convert amount using rates where 1 `base` = rates[target] target. */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  ratesFromBase: Record<string, number>,
  baseCurrency: string,
): number | null {
  if (fromCurrency === toCurrency) return amount
  const fromRate = ratesFromBase[fromCurrency]
  const toRate = ratesFromBase[toCurrency]
  if (fromRate == null || toRate == null || fromRate === 0) return null

  if (fromCurrency === baseCurrency) return amount * toRate
  if (toCurrency === baseCurrency) return amount / fromRate
  return (amount / fromRate) * toRate
}

export function formatConversionHint(
  amount: number,
  converted: number,
  targetCurrency: string,
  format: (value: number, currency: string) => string,
): string {
  if (!amount || converted == null || Number.isNaN(converted)) return ''
  return `≈ ${format(converted, targetCurrency)}`
}
