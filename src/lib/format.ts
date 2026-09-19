/** Display currency from the signed-in user's preferred_currency (synced on auth load). */
let displayCurrency = 'INR'

export function setDisplayCurrency(code: string | null | undefined) {
  if (code && code.trim()) {
    displayCurrency = code.trim().toUpperCase()
  }
}

export function getDisplayCurrency() {
  return displayCurrency
}

function localeForCurrency(currencyCode: string) {
  if (currencyCode === 'INR') return 'en-IN'
  if (currencyCode === 'EUR') return 'en-IE'
  if (currencyCode === 'GBP') return 'en-GB'
  return 'en-US'
}

export function formatCurrency(
  value: number,
  opts: { compact?: boolean; currency?: string } = {},
) {
  const currencyCode = (opts.currency || displayCurrency || 'INR').toUpperCase()
  return new Intl.NumberFormat(localeForCurrency(currencyCode), {
    style: 'currency',
    currency: currencyCode,
    notation: opts.compact ? 'compact' : 'standard',
    maximumFractionDigits: opts.compact ? 1 : 2,
  }).format(value)
}
