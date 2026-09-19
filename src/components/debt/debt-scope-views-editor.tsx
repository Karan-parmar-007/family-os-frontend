import type { SplitLinePayload } from '#/lib/api/endpoints/funding'
import type { DebtScopeViewSummary } from '#/lib/api/types'

export type ScopeViewDraft = {
  scopeKind: 'PERSONAL' | 'FAMILY'
  familyId?: string | null
  familyName?: string
  userId?: string | null
  userName?: string
  enabled: boolean
  isMasked: boolean
  showBreakdown: boolean
  displayTotalAmount?: string
  displayRemainingAmount?: string
  displayEmiAmount?: string
  displayInterestRate?: string
  customized?: boolean
}

export type MemberOption = { id: string; name: string }

type FamilyOption = { id: string; name: string }

function draftKey(d: {
  scopeKind: 'PERSONAL' | 'FAMILY'
  familyId?: string | null
  userId?: string | null
}) {
  if (d.scopeKind === 'PERSONAL') return `PERSONAL:${d.userId ?? ''}`
  return `FAMILY:${d.familyId ?? ''}`
}

export function draftsFromScopeViews(
  views: DebtScopeViewSummary[] | undefined,
  opts: {
    showPersonal: boolean
    families: FamilyOption[]
    relatedFamilies?: FamilyOption[]
    members?: MemberOption[]
    currentUserId?: string
  },
): ScopeViewDraft[] {
  const related = opts.relatedFamilies ?? []
  const allFamilies = [...opts.families, ...related]
  const members = opts.members ?? []
  const byKey = new Map(
    (views ?? []).map((v) => [
      draftKey({
        scopeKind: v.scopeKind,
        familyId: v.familyId,
        userId: v.userId,
      }),
      v,
    ]),
  )
  const drafts: ScopeViewDraft[] = []

  if (opts.showPersonal) {
    const personalViews = (views ?? []).filter((v) => v.scopeKind === 'PERSONAL')
    if (personalViews.length > 0) {
      for (const existing of personalViews) {
        const userId = existing.userId ?? opts.currentUserId ?? null
        const isOwner = !!opts.currentUserId && userId === opts.currentUserId
        drafts.push({
          scopeKind: 'PERSONAL',
          familyId: null,
          userId,
          userName:
            members.find((m) => m.id === userId)?.name ??
            (isOwner ? 'You' : 'Personal'),
          enabled: true,
          isMasked: isOwner ? false : !!existing.isMasked,
          showBreakdown: isOwner ? true : !!existing.showBreakdown,
          displayTotalAmount:
            existing.displayTotalAmount != null ? String(existing.displayTotalAmount) : '',
          displayRemainingAmount:
            existing.displayRemainingAmount != null
              ? String(existing.displayRemainingAmount)
              : '',
          displayEmiAmount:
            existing.displayEmiAmount != null ? String(existing.displayEmiAmount) : '',
          displayInterestRate:
            existing.displayInterestRate != null ? String(existing.displayInterestRate) : '',
          customized: !isOwner && !!existing.isMasked,
        })
      }
    } else {
      drafts.push({
        scopeKind: 'PERSONAL',
        familyId: null,
        userId: opts.currentUserId ?? null,
        userName: 'You',
        enabled: false,
        isMasked: false,
        showBreakdown: true,
      })
    }
  }

  for (const f of allFamilies) {
    const existing = byKey.get(`FAMILY:${f.id}`)
    drafts.push({
      scopeKind: 'FAMILY',
      familyId: f.id,
      familyName: f.name,
      enabled: !!existing,
      isMasked: !!existing?.isMasked,
      showBreakdown: !!existing?.showBreakdown,
      displayTotalAmount:
        existing?.displayTotalAmount != null ? String(existing.displayTotalAmount) : '',
      displayRemainingAmount:
        existing?.displayRemainingAmount != null
          ? String(existing.displayRemainingAmount)
          : '',
      displayEmiAmount:
        existing?.displayEmiAmount != null ? String(existing.displayEmiAmount) : '',
      displayInterestRate:
        existing?.displayInterestRate != null ? String(existing.displayInterestRate) : '',
      customized: !!existing?.isMasked,
    })
  }
  return drafts
}

export function scopeViewsPayloadFromDrafts(drafts: ScopeViewDraft[]) {
  return drafts
    .filter((d) => d.enabled)
    .map((d) => ({
      scopeKind: d.scopeKind,
      familyId: d.scopeKind === 'FAMILY' ? d.familyId : null,
      userId: d.scopeKind === 'PERSONAL' ? d.userId ?? null : null,
      isMasked: d.isMasked,
      showBreakdown: d.showBreakdown,
      displayTotalAmount:
        d.isMasked && d.displayTotalAmount ? Number(d.displayTotalAmount) : undefined,
      displayRemainingAmount:
        d.isMasked && d.displayRemainingAmount
          ? Number(d.displayRemainingAmount)
          : undefined,
      displayEmiAmount:
        d.isMasked && d.displayEmiAmount ? Number(d.displayEmiAmount) : undefined,
      displayInterestRate:
        d.isMasked && d.displayInterestRate ? Number(d.displayInterestRate) : undefined,
    }))
}

export function scopeViewsFromSplits({
  lines,
  currentFamily,
  otherFamilies,
  members = [],
  currentUserId,
  total = 0,
  remaining = 0,
  emi = 0,
  interestRate = 0,
  previous = [],
}: {
  lines: SplitLinePayload[]
  currentFamily: FamilyOption
  otherFamilies: FamilyOption[]
  members?: MemberOption[]
  currentUserId?: string
  total?: number
  remaining?: number
  emi?: number
  interestRate?: number
  previous?: ScopeViewDraft[]
}): ScopeViewDraft[] {
  const targets = new Map<
    string,
    {
      scopeKind: 'PERSONAL' | 'FAMILY'
      familyId?: string
      familyName?: string
      userId?: string
      userName?: string
      amount: number
    }
  >()

  for (const line of lines) {
    const amount = Number(line.amount)
    const contrib = Number.isFinite(amount) && amount > 0 ? amount : 0
    if (line.poolType === 'PERSONAL') {
      const userId = line.userId || currentUserId
      if (!userId) continue
      const key = `PERSONAL:${userId}`
      const existing = targets.get(key)
      targets.set(key, {
        scopeKind: 'PERSONAL',
        userId,
        userName:
          members.find((m) => m.id === userId)?.name ??
          (userId === currentUserId ? 'You' : 'Member'),
        amount: (existing?.amount ?? 0) + contrib,
      })
      continue
    }
    const familyId =
      line.poolType === 'CURRENT_FAMILY' ? currentFamily.id : line.familyId
    if (!familyId) continue
    const family =
      familyId === currentFamily.id
        ? currentFamily
        : otherFamilies.find((item) => item.id === familyId)
    if (!family) continue
    const key = `FAMILY:${familyId}`
    const existing = targets.get(key)
    targets.set(key, {
      scopeKind: 'FAMILY',
      familyId,
      familyName: family.name,
      amount: (existing?.amount ?? 0) + contrib,
    })
  }

  return [...targets.values()].map((target) => {
    const old = previous.find(
      (draft) =>
        draftKey(draft) ===
        draftKey({
          scopeKind: target.scopeKind,
          familyId: target.familyId,
          userId: target.userId,
        }),
    )
    const isOwnerPersonal =
      target.scopeKind === 'PERSONAL' &&
      !!currentUserId &&
      target.userId === currentUserId

    if (isOwnerPersonal) {
      return {
        scopeKind: 'PERSONAL' as const,
        familyId: null,
        userId: target.userId,
        userName: target.userName ?? 'You',
        enabled: true,
        isMasked: false,
        showBreakdown: true,
      }
    }

    const paymentBase = emi > 0 ? emi : total
    const ratio =
      paymentBase > 0 ? Math.min(1, target.amount / paymentBase) : 0

    return {
      scopeKind: target.scopeKind,
      familyId: target.familyId ?? null,
      familyName: target.familyName,
      userId: target.userId ?? null,
      userName: target.userName,
      enabled: true,
      isMasked: !(old?.showBreakdown ?? false),
      showBreakdown: old?.showBreakdown ?? false,
      displayTotalAmount: old?.customized
        ? old.displayTotalAmount
        : ratio > 0
          ? (total * ratio).toFixed(2)
          : (old?.displayTotalAmount ?? ''),
      displayRemainingAmount: old?.customized
        ? old.displayRemainingAmount
        : ratio > 0
          ? (remaining * ratio).toFixed(2)
          : (old?.displayRemainingAmount ?? ''),
      displayEmiAmount: old?.customized
        ? old.displayEmiAmount
        : target.amount > 0
          ? target.amount.toFixed(2)
          : (old?.displayEmiAmount ?? ''),
      displayInterestRate: old?.customized
        ? old.displayInterestRate
        : interestRate > 0
          ? interestRate.toFixed(2)
          : (old?.displayInterestRate ?? ''),
      customized: old?.customized ?? false,
    }
  })
}
