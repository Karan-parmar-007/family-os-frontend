import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '#/lib/api/client'

export interface MoneyRule {
  id: string
  scope: 'FAMILY' | 'PERSONAL'
  familyId?: string
  kind: 'INCOME' | 'EXPENSE'
  name: string
  amount: number
  frequency: string
  nextRunAt: string
  status: string
}

export interface MoneyEvent {
  id: string
  scope: 'FAMILY' | 'PERSONAL'
  kind: 'INCOME' | 'EXPENSE'
  name: string
  amount: number
  occurredAt: string
}

export interface SimpleDebt {
  id: string
  name: string
  amount: number
  amountPaid: number
  remainingAmount: number
  status: string
}

export function useMoneyRules(
  scope: 'FAMILY' | 'PERSONAL',
  familyId: string | undefined,
  kind?: 'INCOME' | 'EXPENSE',
) {
  return useQuery({
    queryKey: ['money', 'rules', scope, familyId, kind] as const,
    queryFn: () => {
      const params: Record<string, string> = { scope }
      if (familyId && scope === 'FAMILY') params.family_id = familyId
      if (kind) params.kind = kind
      return apiFetch<{ items: MoneyRule[] }>('/api/familyos/money/rules', { params })
    },
    enabled: scope === 'PERSONAL' || Boolean(familyId),
    staleTime: 60_000,
  })
}

export function useMoneyEvents(
  scope: 'FAMILY' | 'PERSONAL',
  familyId: string | undefined,
  kind?: 'INCOME' | 'EXPENSE',
) {
  return useQuery({
    queryKey: ['money', 'events', scope, familyId, kind] as const,
    queryFn: () => {
      const params: Record<string, string | number> = { scope, limit: 200 }
      if (familyId && scope === 'FAMILY') params.family_id = familyId
      if (kind) params.kind = kind
      return apiFetch<{ items: MoneyEvent[]; total: number }>('/api/familyos/money/events', { params })
    },
    enabled: scope === 'PERSONAL' || Boolean(familyId),
    staleTime: 60_000,
  })
}

export function useSimpleDebts(
  scope: 'FAMILY' | 'PERSONAL',
  familyId: string | undefined,
) {
  return useQuery({
    queryKey: ['simple-debts', scope, familyId] as const,
    queryFn: () => {
      const params: Record<string, string> = { scope }
      if (familyId && scope === 'FAMILY') params.family_id = familyId
      return apiFetch<{ items: SimpleDebt[]; total: number }>('/api/familyos/debts', { params })
    },
    enabled: scope === 'PERSONAL' || Boolean(familyId),
    staleTime: 60_000,
  })
}
