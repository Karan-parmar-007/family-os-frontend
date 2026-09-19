import { describe, expect, it } from 'vitest'
import {
  draftsFromScopeViews,
  scopeViewsFromSplits,
  scopeViewsPayloadFromDrafts,
} from './debt-scope-views-editor'

describe('debt scope views drafts', () => {
  it('builds drafts for personal and family targets', () => {
    const drafts = draftsFromScopeViews(undefined, {
      showPersonal: true,
      families: [{ id: 'f1', name: 'Home' }],
      relatedFamilies: [{ id: 'f2', name: 'In-laws' }],
      currentUserId: 'u1',
    })
    expect(drafts.some((d) => d.scopeKind === 'PERSONAL')).toBe(true)
    expect(drafts.some((d) => d.familyId === 'f1')).toBe(true)
    expect(drafts.some((d) => d.familyId === 'f2')).toBe(true)
  })

  it('serializes only enabled drafts including personal userId', () => {
    const drafts = draftsFromScopeViews(undefined, {
      showPersonal: true,
      families: [{ id: 'f1', name: 'Home' }],
      relatedFamilies: [],
      currentUserId: 'u1',
    }).map((d) => ({
      ...d,
      enabled: d.scopeKind === 'PERSONAL' || d.familyId === 'f1',
    }))
    const payload = scopeViewsPayloadFromDrafts(drafts)
    expect(payload.length).toBe(2)
    expect(payload.every((p) => p.scopeKind === 'PERSONAL' || p.familyId === 'f1')).toBe(true)
    expect(payload.find((p) => p.scopeKind === 'PERSONAL')?.userId).toBe('u1')
  })

  it('autofills visibility from contribution share', () => {
    const drafts = scopeViewsFromSplits({
      lines: [
        { poolType: 'CURRENT_FAMILY', familyId: 'f1', amount: '500' },
        { poolType: 'PERSONAL', userId: 'u1', amount: '500' },
      ],
      currentFamily: { id: 'f1', name: 'Home' },
      otherFamilies: [],
      members: [{ id: 'u1', name: 'Owner' }],
      currentUserId: 'u1',
      total: 10000,
      remaining: 8000,
      emi: 1000,
      interestRate: 10,
    })

    expect(drafts).toHaveLength(2)
    const family = drafts.find((draft) => draft.familyId === 'f1')
    expect(family?.displayTotalAmount).toBe('5000.00')
    expect(family?.displayRemainingAmount).toBe('4000.00')
    expect(family?.displayEmiAmount).toBe('500.00')
    expect(family?.isMasked).toBe(true)
    expect(drafts.find((draft) => draft.scopeKind === 'PERSONAL')?.showBreakdown).toBe(true)
  })

  it('preserves customized visible values for other personal payers', () => {
    const drafts = scopeViewsFromSplits({
      lines: [
        { poolType: 'PERSONAL', userId: 'u1', amount: '600' },
        { poolType: 'PERSONAL', userId: 'u2', amount: '400' },
      ],
      currentFamily: { id: 'f1', name: 'Home' },
      otherFamilies: [],
      members: [
        { id: 'u1', name: 'Owner' },
        { id: 'u2', name: 'Sibling' },
      ],
      currentUserId: 'u1',
      total: 10000,
      remaining: 8000,
      emi: 1000,
      interestRate: 12,
      previous: [
        {
          scopeKind: 'PERSONAL',
          userId: 'u2',
          userName: 'Sibling',
          enabled: true,
          isMasked: true,
          showBreakdown: false,
          displayTotalAmount: '2100',
          displayRemainingAmount: '1600',
          displayEmiAmount: '400',
          displayInterestRate: '12',
          customized: true,
        },
      ],
    })

    const sibling = drafts.find((d) => d.userId === 'u2')
    expect(sibling?.displayTotalAmount).toBe('2100')
    expect(sibling?.displayEmiAmount).toBe('400')
  })
})
