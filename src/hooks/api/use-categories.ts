import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '#/lib/api/client'
import type { Page } from '#/lib/api/pagination'

export type CategoryScope = 'FAMILY' | 'PERSONAL'
export type CategoryType =
  | 'INCOME'
  | 'EXPENSE'
  | 'DEBT'
  | 'ASSET'
  | 'INSURANCE'
  | 'VAULT_PASSWORD'
  | 'VAULT_DOCUMENT'

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  DEBT: 'Debt',
  ASSET: 'Asset',
  INSURANCE: 'Insurance',
  VAULT_PASSWORD: 'Vault passwords',
  VAULT_DOCUMENT: 'Vault documents',
}

export interface CategoryItem {
  id: string
  scope: CategoryScope
  familyId?: string | null
  ownerUserId?: string | null
  categoryType: CategoryType
  name: string
  color?: string | null
  icon?: string | null
  canEdit: boolean
  createdAt: string
}

export interface CategoryQuery {
  scope: CategoryScope
  categoryType: CategoryType
  familyId?: string
  q?: string
  page?: number
  pageSize?: number
}

const BASE = '/api/familyos/categories'

export function useCategories({ scope, categoryType, familyId, q, page = 1, pageSize = 100 }: CategoryQuery) {
  return useQuery({
    queryKey: ['categories', scope, categoryType, scope === 'FAMILY' ? familyId : null, q ?? '', page, pageSize] as const,
    queryFn: () =>
      apiFetch<Page<CategoryItem>>(BASE, {
        params: {
          scope,
          category_type: categoryType,
          family_id: scope === 'FAMILY' ? familyId : undefined,
          q: q?.trim() || undefined,
          page,
          page_size: pageSize,
        },
      }),
    enabled: scope === 'PERSONAL' || Boolean(familyId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useCategoryMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] })

  const create = useMutation({
    mutationFn: (body: { scope: CategoryScope; familyId?: string; categoryType: CategoryType; name: string }) =>
      apiFetch<CategoryItem>(BASE, {
        method: 'POST',
        json: { ...body, familyId: body.scope === 'FAMILY' ? body.familyId : null },
      }),
    onSuccess: invalidate,
  })
  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiFetch<CategoryItem>(`${BASE}/${id}`, { method: 'PATCH', json: { name } }),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
  return { create, rename, remove }
}
