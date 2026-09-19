/** Whether "let everyone edit" is allowed on family-managed recurring items. */
export function canEnableEveryoneEdit(opts: {
  personalAmount: number
  familySplitCount: number
}): boolean {
  if (opts.personalAmount > 0) return false
  if (opts.familySplitCount > 1) return false
  return true
}

export type FamilyFundingRow = { familyId: string; amount: string }
export type PersonalFundingRow = { userId: string; amount: string }

export type FundingSourcePayload = {
  pool_type: 'FAMILY' | 'PERSONAL'
  family_id?: string | null
  user_id?: string | null
  amount: number
}

export function buildFundingSourcesPayload(
  familyRows: FamilyFundingRow[],
  personalRows: PersonalFundingRow[] = [],
): FundingSourcePayload[] {
  const parsed: FundingSourcePayload[] = familyRows
    .map((row) => ({
      pool_type: 'FAMILY' as const,
      family_id: row.familyId,
      amount: Number(row.amount || 0),
    }))
    .filter((row) => row.amount > 0)

  for (const row of personalRows) {
    const amount = Number(row.amount || 0)
    if (amount > 0 && row.userId) {
      parsed.push({
        pool_type: 'PERSONAL',
        user_id: row.userId,
        amount,
      })
    }
  }

  return parsed
}

export function sumFundingSources(
  sources: Array<{ amount: number }>,
): number {
  return sources.reduce((acc, row) => acc + row.amount, 0)
}

export function activeOtherFamilyRows(
  rows: FamilyFundingRow[],
): FamilyFundingRow[] {
  return rows.filter((row) => Number(row.amount) > 0)
}

export function activePersonalRows(
  rows: PersonalFundingRow[],
): PersonalFundingRow[] {
  return rows.filter((row) => Number(row.amount) > 0)
}

export function sumPersonalRows(rows: PersonalFundingRow[]): number {
  return activePersonalRows(rows).reduce(
    (acc, row) => acc + (Number(row.amount) || 0),
    0,
  )
}

export function sumAllocatedParts(opts: {
  familyAmount: number
  personalAmount: number
  otherFamilyAmounts: Array<{ amount: string }>
  personalRows?: PersonalFundingRow[]
}): number {
  const other = opts.otherFamilyAmounts.reduce(
    (acc, row) => acc + (Number(row.amount) || 0),
    0,
  )
  const personalFromRows = opts.personalRows
    ? sumPersonalRows(opts.personalRows)
    : opts.personalAmount
  return opts.familyAmount + personalFromRows + other
}

export function amountRemaining(total: number, allocated: number): number {
  return Math.round((total - allocated) * 100) / 100
}

/** Validate family/personal split fields on income and expense log forms. */
export function validateFamilyPersonalLogSplit(opts: {
  total: number
  familyAmount: number
  personalAmount: number
  familyFieldFilled: boolean
  personalFieldFilled: boolean
  hasOtherFamilies: boolean
  useMultiPersonal?: boolean
}): string | null {
  const {
    total,
    familyAmount,
    personalAmount,
    familyFieldFilled,
    personalFieldFilled,
    hasOtherFamilies,
    useMultiPersonal,
  } = opts

  if (useMultiPersonal) return null

  if (!familyFieldFilled && !personalFieldFilled) {
    return null
  }

  if (!hasOtherFamilies) {
    if (familyAmount <= 0 || personalAmount <= 0) {
      return 'When splitting, both family and personal amounts must be greater than zero.'
    }
    if (familyAmount === total || personalAmount === total) {
      return 'Family and personal amounts must each be less than the total when splitting.'
    }
  }

  return null
}

export type FundingSourceDetail = {
  pool_type: 'FAMILY' | 'PERSONAL'
  family_id?: string | null
  user_id?: string | null
  amount: number
}

/** Split API funding sources into current-family amount, personal, and other-family rows. */
export function parseFundingSourcesForForm(
  sources: FundingSourceDetail[] | undefined,
  currentFamilyId: string,
  currentUserId?: string,
): {
  useFundingSplit: boolean
  otherFamilyRows: FamilyFundingRow[]
  personalRows: PersonalFundingRow[]
  personalAmount: number
} {
  if (!sources?.length) {
    return {
      useFundingSplit: false,
      otherFamilyRows: [],
      personalRows: [],
      personalAmount: 0,
    }
  }

  const otherFamilyRows = sources
    .filter(
      (s) =>
        s.pool_type === 'FAMILY' &&
        s.family_id &&
        s.family_id !== currentFamilyId,
    )
    .map((s) => ({ familyId: s.family_id!, amount: String(s.amount) }))

  const personalSources = sources.filter((s) => s.pool_type === 'PERSONAL')
  const personalRows = personalSources
    .filter((s) => s.user_id)
    .map((s) => ({ userId: s.user_id!, amount: String(s.amount) }))

  const selfPersonal = personalSources.find(
    (s) => s.user_id && currentUserId && s.user_id === currentUserId,
  )
  const personalAmount = selfPersonal
    ? Number(selfPersonal.amount)
    : personalSources.length === 1 && !personalSources[0].user_id
      ? Number(personalSources[0].amount)
      : personalSources.length === 1
        ? Number(personalSources[0].amount)
        : 0

  const useFundingSplit =
    otherFamilyRows.length > 0 ||
    personalRows.length > 1 ||
    (personalRows.length === 1 &&
      !!currentUserId &&
      personalRows[0].userId !== currentUserId)

  return {
    useFundingSplit,
    otherFamilyRows,
    personalRows,
    personalAmount,
  }
}
