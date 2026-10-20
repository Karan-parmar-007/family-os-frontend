import { apiFetch } from '../client'
import type {
  FriendCodeResponse,
  FriendUserListResponse,
  FriendshipListResponse,
  FriendshipSummary,
} from '../types'

export const friendsApi = {
  list(page = 1, pageSize = 10) {
    return apiFetch<FriendshipListResponse>('/api/familyos/friends', {
      params: { page, page_size: pageSize },
    })
  },

  active() {
    return apiFetch<FriendUserListResponse>('/api/familyos/friends/active')
  },

  myCode() {
    return apiFetch<FriendCodeResponse>('/api/familyos/friends/me/code')
  },

  request(body: { friendCode: string }) {
    return apiFetch<FriendshipSummary>('/api/familyos/friends/request', {
      method: 'POST',
      json: body,
    })
  },

  confirm(friendshipId: string) {
    return apiFetch<FriendshipSummary>(`/api/familyos/friends/${friendshipId}/confirm`, {
      method: 'POST',
    })
  },

  reject(friendshipId: string) {
    return apiFetch<FriendshipSummary>(`/api/familyos/friends/${friendshipId}/reject`, {
      method: 'POST',
    })
  },

  cancel(friendshipId: string) {
    return apiFetch<FriendshipSummary>(`/api/familyos/friends/${friendshipId}/cancel`, {
      method: 'POST',
    })
  },
}
