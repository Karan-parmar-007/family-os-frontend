const FREQ_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  WEEKLY: 'Weekly',
  DAILY: 'Daily',
  YEARLY: 'Yearly',
  QUARTERLY: 'Quarterly',
}

export type RecurringFrequencyFields = {
  received_every?: string | null
  repeat_interval_days?: number | null
  repeat_interval_months?: number | null
  repeat_interval_years?: number | null
}

export function formatRecurringFrequency(income: RecurringFrequencyFields): string {
  if (income.received_every) {
    return FREQ_LABELS[income.received_every] ?? income.received_every
  }
  const parts: string[] = []
  if (income.repeat_interval_years) {
    parts.push(`${income.repeat_interval_years} year${income.repeat_interval_years === 1 ? '' : 's'}`)
  }
  if (income.repeat_interval_months) {
    parts.push(`${income.repeat_interval_months} month${income.repeat_interval_months === 1 ? '' : 's'}`)
  }
  if (income.repeat_interval_days) {
    parts.push(`${income.repeat_interval_days} day${income.repeat_interval_days === 1 ? '' : 's'}`)
  }
  if (parts.length) return `Every ${parts.join(', ')}`
  return '—'
}

export const RECURRING_SOURCE_TYPES = new Set([
  'RECURRING',
  'RECURRING_INCOME',
  'FAMILY_RECURRING_INCOME',
  'PERSONAL_RECURRING_INCOME',
])

export function isRecurringIncomeSource(sourceType: string | null | undefined): boolean {
  return !!sourceType && RECURRING_SOURCE_TYPES.has(sourceType)
}
