import type { DebtSummary } from '#/lib/api/familyos/types'

/** True when the viewer is the user who added / owns the debt. */
export function isDebtOwner(debt: DebtSummary, userId?: string | null): boolean {
  if (!userId) return false
  if (debt.isOwner === true || debt.canPartPayment === true) return true
  if (debt.isOwner === false) return false
  return debt.userId === userId || debt.debtInTheNameOf === userId
}

/** Owner-only apply part payment on an active debt. */
export function canApplyPartPayment(
  debt: DebtSummary,
  userId?: string | null,
): boolean {
  if (debt.status !== 'ACTIVE') return false
  if (debt.canPartPayment === true) return true
  if (debt.canPartPayment === false) return false
  return isDebtOwner(debt, userId)
}

/** Full loan numbers vs EMI-share-only view. */
export function hasFullDebtView(
  debt: DebtSummary,
  userId?: string | null,
): boolean {
  if (isDebtOwner(debt, userId)) return true
  if (debt.showBreakdown) return true
  return !debt.isMasked
}
