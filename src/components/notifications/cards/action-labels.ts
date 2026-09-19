export const ACTION_LABELS: Record<string, { label: string; sub?: string }> = {
  ACCEPT: { label: 'Confirm', sub: 'Apply as planned' },
  ADJUST_AMOUNT: { label: 'Adjust amount', sub: 'Different amount this time' },
  ACCEPT_WITH_SPLITS: { label: 'Pay from other sources', sub: 'Choose which pools pay' },
  PAID_EXTERNALLY: { label: 'Paid outside the app', sub: "Don't deduct from any pool" },
  DECLINE_DELAY: { label: 'Remind me later', sub: 'Delay by N days' },
  SKIP_PERIOD: { label: 'Skip this time' },
  SKIP_INCREASE: { label: 'Skip — increase future EMIs', sub: 'Recalculated over remaining months' },
  SKIP_DEFAULT: { label: 'Skip — move to defaults', sub: 'Pay later (fine may apply)' },
  REMOVE_RECURRING: { label: 'Stop this recurring item' },
  DISMISS: { label: 'Dismiss' },
}
