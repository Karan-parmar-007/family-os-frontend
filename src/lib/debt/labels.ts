type MemberLike = { id: string; name?: string | null }
type FamilyLike = { id: string; name?: string | null }

type SplitLike = {
  poolType: string
  familyId?: string | null
  userId?: string | null
}

export function memberDisplayName(
  members: MemberLike[],
  userId?: string | null,
  fallback = 'Personal savings',
): string {
  if (!userId) return fallback
  return (
    members.find((m) => m.id === userId)?.name ??
    `Member ${userId.slice(0, 8)}`
  )
}

export function familyDisplayName(
  families: FamilyLike[],
  familyId: string | null | undefined,
  currentFamilyId?: string,
  currentFamilyName = 'This family',
): string {
  if (!familyId) return 'Family'
  if (currentFamilyId && familyId === currentFamilyId) return currentFamilyName
  return (
    families.find((f) => f.id === familyId)?.name ??
    `Family ${familyId.slice(0, 8)}`
  )
}

/** Human label for a payer / split line. */
export function payerLabel(
  line: SplitLike,
  opts: {
    members?: MemberLike[]
    families?: FamilyLike[]
    currentFamilyId?: string
    currentFamilyName?: string
  } = {},
): string {
  const members = opts.members ?? []
  const families = opts.families ?? []
  if (line.poolType === 'PERSONAL') {
    return `${memberDisplayName(members, line.userId)} (personal)`
  }
  if (line.poolType === 'CURRENT_FAMILY') {
    return `${opts.currentFamilyName ?? 'This family'} (this family)`
  }
  return `${familyDisplayName(
    families,
    line.familyId,
    opts.currentFamilyId,
    opts.currentFamilyName,
  )} (other family)`
}
