import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '#/lib/api/client'
import type { Page } from '#/lib/api/pagination'
import { invalidateMoneyViews } from '#/lib/query/invalidate'

export type MoneyScope = 'FAMILY' | 'PERSONAL'
export type MoneyKind = 'INCOME' | 'EXPENSE'

export interface MoneyParty {
  id: string
  partyType: 'MEMBER' | 'FAMILY'
  userId?: string | null
}

export interface MoneyRule {
  id: string
  scope: MoneyScope
  familyId?: string | null
  ownerUserId?: string | null
  kind: MoneyKind
  name: string
  amount: number
  categoryId?: string | null
  frequency: string
  everyN: number
  nextRunAt: string
  lastRunAt?: string | null
  runCount: number
  endAt?: string | null
  maxRuns?: number | null
  documentId?: string | null
  letEveryoneEdit: boolean
  canEdit: boolean
  createdBy: string
  insuranceId?: string | null
  debtId?: string | null
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | string
  parties: MoneyParty[]
  createdAt: string
  updatedAt: string
}

export interface MoneyEvent {
  id: string
  ruleId?: string | null
  scope: MoneyScope
  familyId?: string | null
  ownerUserId?: string | null
  kind: MoneyKind
  name: string
  amount: number
  categoryId?: string | null
  documentId?: string | null
  letEveryoneEdit: boolean
  isOverdrawn: boolean
  canEdit: boolean
  occurredAt: string
  createdBy: string
  parties: MoneyParty[]
  createdAt: string
}

export interface SimpleDebt {
  id: string
  name: string
  amount: number
  amountPaid: number
  remainingAmount: number
  status: string
}

export interface MoneyEventFilters {
  source?: 'ONE_TIME' | 'RECURRING'
  categoryId?: string
  ruleId?: string
  fromDate?: string
  toDate?: string
  q?: string
}

function scopeParams(scope: MoneyScope, familyId: string | undefined) {
  return { scope, family_id: scope === 'FAMILY' ? familyId : undefined }
}

export function useMoneyRules(
  scope: MoneyScope,
  familyId: string | undefined,
  kind?: MoneyKind,
  paging: { page: number; page_size: number } = { page: 1, page_size: 100 },
  q?: string,
) {
  return useQuery({
    queryKey: ['money', 'rules', scope, familyId, kind, paging.page, paging.page_size, q ?? ''] as const,
    queryFn: () =>
      apiFetch<Page<MoneyRule>>('/api/familyos/money/rules', {
        params: { ...scopeParams(scope, familyId), kind, q: q || undefined, ...paging },
      }),
    enabled: scope === 'PERSONAL' || Boolean(familyId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useMoneyEvents(
  scope: MoneyScope,
  familyId: string | undefined,
  kind?: MoneyKind,
  paging: { page: number; page_size: number } = { page: 1, page_size: 100 },
  filters: MoneyEventFilters = {},
) {
  return useQuery({
    queryKey: ['money', 'events', scope, familyId, kind, paging.page, paging.page_size, filters] as const,
    queryFn: () =>
      apiFetch<Page<MoneyEvent>>('/api/familyos/money/events', {
        params: {
          ...scopeParams(scope, familyId),
          kind,
          source: filters.source,
          category_id: filters.categoryId,
          rule_id: filters.ruleId,
          from_date: filters.fromDate,
          to_date: filters.toDate,
          q: filters.q || undefined,
          ...paging,
        },
      }),
    enabled: (scope === 'PERSONAL' || Boolean(familyId)) && (filters.ruleId === undefined || filters.ruleId !== ''),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useSimpleDebts(scope: MoneyScope, familyId: string | undefined) {
  return useQuery({
    queryKey: ['simple-debts', scope, familyId, 'summary'] as const,
    queryFn: () =>
      apiFetch<Page<SimpleDebt>>('/api/familyos/debts', {
        params: { ...scopeParams(scope, familyId), page: 1, page_size: 100 },
      }),
    enabled: scope === 'PERSONAL' || Boolean(familyId),
    staleTime: 60_000,
  })
}

export function useMoneyMutations() {
  const qc = useQueryClient()
  const opts = { onSuccess: () => invalidateMoneyViews(qc) }

  return {
    createRule: useMutation({
      mutationFn: (body: Record<string, unknown>) =>
        apiFetch<MoneyRule>('/api/familyos/money/rules', { method: 'POST', json: body }),
      ...opts,
    }),
    updateRule: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        apiFetch<MoneyRule>(`/api/familyos/money/rules/${id}`, { method: 'PATCH', json: body }),
      ...opts,
    }),
    deleteRule: useMutation({
      mutationFn: (id: string) => apiFetch<void>(`/api/familyos/money/rules/${id}`, { method: 'DELETE' }),
      ...opts,
    }),
    createEvent: useMutation({
      mutationFn: (body: Record<string, unknown>) =>
        apiFetch<MoneyEvent>('/api/familyos/money/events', { method: 'POST', json: body }),
      ...opts,
    }),
    updateEvent: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        apiFetch<MoneyEvent>(`/api/familyos/money/events/${id}`, { method: 'PATCH', json: body }),
      ...opts,
    }),
    deleteEvent: useMutation({
      mutationFn: (id: string) => apiFetch<void>(`/api/familyos/money/events/${id}`, { method: 'DELETE' }),
      ...opts,
    }),
  }
}
