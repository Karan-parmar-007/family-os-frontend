import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminApi,
  type CurrencyCreatePayload,
  type CurrencyUpdatePayload,
} from '#/lib/api/endpoints/admin'

export const ADMIN_USERS_KEY = ['admin', 'users']
export const ADMIN_FAMILIES_KEY = ['admin', 'families']
export const ADMIN_CURRENCIES_KEY = ['admin', 'currencies']

export function useAdminUsers(page = 1, pageSize = 10, q?: string) {
  return useQuery({
    queryKey: [...ADMIN_USERS_KEY, page, pageSize, q ?? ''],
    queryFn: () => adminApi.listUsers(page, pageSize, q),
  })
}

export function useAdminUpdateUserCap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, cap }: { userId: string; cap: number }) =>
      adminApi.updateUserCap(userId, cap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_USERS_KEY })
    },
  })
}

export function useAdminDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_USERS_KEY })
      qc.invalidateQueries({ queryKey: ADMIN_FAMILIES_KEY })
    },
  })
}

export function useAdminFamilies(page = 1, pageSize = 10, q?: string) {
  return useQuery({
    queryKey: [...ADMIN_FAMILIES_KEY, page, pageSize, q ?? ''],
    queryFn: () => adminApi.listFamilies(page, pageSize, q),
  })
}

export function useAdminDeleteFamily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (familyId: string) => adminApi.deleteFamily(familyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_FAMILIES_KEY })
      qc.invalidateQueries({ queryKey: ADMIN_USERS_KEY })
    },
  })
}

export function useAdminCurrencies(page = 1, pageSize = 10, q?: string) {
  return useQuery({
    queryKey: [...ADMIN_CURRENCIES_KEY, page, pageSize, q ?? ''],
    queryFn: () => adminApi.listCurrencies(page, pageSize, q),
  })
}

export function useAdminCreateCurrency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CurrencyCreatePayload) => adminApi.createCurrency(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_CURRENCIES_KEY })
      qc.invalidateQueries({ queryKey: ['currencies'] })
    },
  })
}

export function useAdminUpdateCurrency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ code, body }: { code: string; body: CurrencyUpdatePayload }) =>
      adminApi.updateCurrency(code, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_CURRENCIES_KEY })
      qc.invalidateQueries({ queryKey: ['currencies'] })
    },
  })
}

export function useAdminDeleteCurrency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => adminApi.deleteCurrency(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_CURRENCIES_KEY })
      qc.invalidateQueries({ queryKey: ['currencies'] })
    },
  })
}
