import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '#/lib/query/keys'

/** Refresh savings + log lists for all families after a multi-split log create/update. */
export function invalidateAfterSplitLogMutation(qc: QueryClient, primaryFamilyId: string) {
  qc.invalidateQueries({ queryKey: queryKeys.familyIncomeLogs(primaryFamilyId) })
  qc.invalidateQueries({ queryKey: queryKeys.familyExpenseLogs(primaryFamilyId) })
  qc.invalidateQueries({ queryKey: queryKeys.familyTotalSavings(primaryFamilyId) })
  qc.invalidateQueries({ queryKey: queryKeys.globalSavings() })
  qc.invalidateQueries({ queryKey: ['families'] })
  qc.invalidateQueries({ queryKey: queryKeys.personalIncomeLogs })
  qc.invalidateQueries({ queryKey: queryKeys.personalExpenseLogs })
}
