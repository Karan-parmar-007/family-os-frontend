const FREQ_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  WEEKLY: 'Weekly',
  DAILY: 'Daily',
  YEARLY: 'Yearly',
  QUARTERLY: 'Quarterly',
}

export type RecurringFrequencyFields = {
  paid_every?: string | null
  repeat_interval_days?: number | null
  repeat_interval_months?: number | null
  repeat_interval_years?: number | null
}

export function formatRecurringFrequency(expense: RecurringFrequencyFields): string {
  if (expense.paid_every) {
    return FREQ_LABELS[expense.paid_every] ?? expense.paid_every
  }
  const parts: string[] = []
  if (expense.repeat_interval_years) {
    parts.push(`${expense.repeat_interval_years} year${expense.repeat_interval_years === 1 ? '' : 's'}`)
  }
  if (expense.repeat_interval_months) {
    parts.push(`${expense.repeat_interval_months} month${expense.repeat_interval_months === 1 ? '' : 's'}`)
  }
  if (expense.repeat_interval_days) {
    parts.push(`${expense.repeat_interval_days} day${expense.repeat_interval_days === 1 ? '' : 's'}`)
  }
  if (parts.length) return `Every ${parts.join(', ')}`
  return '—'
}

export const RECURRING_SOURCE_TYPES = new Set([
  'RECURRING',
  'RECURRING_EXPENSE',
  'FAMILY_RECURRING_EXPENSE',
  'PERSONAL_RECURRING_EXPENSE',
])

export function isRecurringExpenseSource(sourceType: string | null | undefined): boolean {
  return !!sourceType && RECURRING_SOURCE_TYPES.has(sourceType)
}
