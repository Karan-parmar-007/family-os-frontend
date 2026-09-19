/**
 * Placeholder dashboard data.
 *
 * The backend currently only exposes auth & user endpoints, so the finance
 * widgets render from this mock until those APIs land. Swap these for real
 * queries when the endpoints are available.
 */

export const netWorth = {
  total: 148500.22,
  changePct: 12.4,
  savings: 112000,
  debt: 31500,
  trend: [82, 88, 86, 94, 101, 99, 108, 112, 118, 121, 130, 148.5],
}

export const expenses = {
  budget: 4500,
  spent: 2875,
  breakdown: [
    { label: 'Housing', value: 1450, color: 'var(--chart-2)' },
    { label: 'Food', value: 620, color: 'var(--chart-1)' },
    { label: 'Transport', value: 340, color: 'var(--chart-3)' },
    { label: 'Lifestyle', value: 465, color: 'var(--chart-4)' },
  ],
}

export const savingsGoals = [
  {
    label: 'Emergency Fund',
    current: 22000,
    target: 25000,
    color: 'var(--positive)',
  },
  { label: 'New Car', current: 18000, target: 45000, color: 'var(--info)' },
  {
    label: 'Family Vacation',
    current: 4200,
    target: 8000,
    color: 'var(--violet)',
  },
]

export const taxChecklist = [
  { label: 'W-2 uploaded', done: true },
  { label: '1099 forms collected', done: true },
  { label: 'Deductions reviewed', done: false },
  { label: 'File 2025 return', done: false },
]

export const documents = [
  { label: 'Birth Certificates', meta: 'Shared · 4 files' },
  { label: 'Family Ledger', meta: 'Updated 5 mins ago' },
  { label: 'Insurance Policies', meta: '3 active' },
  { label: 'Property Deeds', meta: 'Secured' },
]

export const upcoming = [
  { label: 'Family Dinner', when: 'Friday · 7:00 PM' },
  { label: 'Mortgage Payment', when: 'Jun 28 · Auto' },
  { label: 'Tax Filing Deadline', when: 'Jul 15' },
]
