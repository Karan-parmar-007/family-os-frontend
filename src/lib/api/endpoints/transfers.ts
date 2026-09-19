import { apiFetch } from '../client'
import type { TransferListResponse } from '../types'

export type TransferCreateBody = {
  toFamilyId?: string | null
  toUserId?: string | null
  fromScope?: 'FAMILY' | 'PERSONAL'
  toScope?: 'FAMILY' | 'PERSONAL'
  fromUserId?: string | null
  amount: number
  note?: string
  destLinkCode?: string
  destPersonalCode?: string
  isRecurring?: boolean
  recurringEvery?: string
  nextRunDate?: string
  endDate?: string
}

export const transfersApi = {
  list(familyId: string) {
    return apiFetch<TransferListResponse>(
      `/api/familyos/families/${familyId}/transfers`,
    )
  },

  create(familyId: string, body: TransferCreateBody) {
    return apiFetch(`/api/familyos/families/${familyId}/transfers`, {
      method: 'POST',
      json: body,
    })
  },

  accept(familyId: string, transferId: string) {
    return apiFetch(`/api/familyos/families/${familyId}/transfers/${transferId}/accept`, {
      method: 'POST',
    })
  },

  decline(familyId: string, transferId: string) {
    return apiFetch(`/api/familyos/families/${familyId}/transfers/${transferId}/decline`, {
      method: 'POST',
    })
  },

  cancel(familyId: string, transferId: string) {
    return apiFetch(`/api/familyos/families/${familyId}/transfers/${transferId}/cancel`, {
      method: 'POST',
    })
  },

  reverse(familyId: string, transferId: string) {
    return apiFetch(`/api/familyos/families/${familyId}/transfers/${transferId}/reverse`, {
      method: 'POST',
    })
  },

  listPersonal() {
    return apiFetch<TransferListResponse>('/api/familyos/transfers')
  },

  createPersonal(body: TransferCreateBody) {
    return apiFetch('/api/familyos/transfers', {
      method: 'POST',
      json: {
        ...body,
        fromScope: body.fromScope ?? 'PERSONAL',
      },
    })
  },

  acceptPersonal(transferId: string) {
    return apiFetch(`/api/familyos/transfers/${transferId}/accept`, { method: 'POST' })
  },

  declinePersonal(transferId: string) {
    return apiFetch(`/api/familyos/transfers/${transferId}/decline`, { method: 'POST' })
  },

  cancelPersonal(transferId: string) {
    return apiFetch(`/api/familyos/transfers/${transferId}/cancel`, {
      method: 'POST',
    })
  },
}
