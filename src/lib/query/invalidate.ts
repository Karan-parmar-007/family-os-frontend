import type { QueryClient } from '@tanstack/react-query'

/**
 * Anything that moves money changes balances, ledgers, upcoming items and the
 * dashboards, which are all cached under these roots.
 */
export function invalidateMoneyViews(qc: QueryClient) {
  for (const key of ['money', 'simple-debts', 'families', 'personal', 'globalSavings', 'upcoming', 'notifications']) {
    void qc.invalidateQueries({ queryKey: [key] })
  }
}
