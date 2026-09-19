import { apiFetch } from '../client'
import type {
  NotificationActionRequest,
  NotificationListResponse,
  UnreadCountResponse,
} from '../types'

export const notificationsApi = {
  list(page = 1, pageSize = 20) {
    return apiFetch<NotificationListResponse>('/api/familyos/notifications', {
      params: { page, page_size: pageSize },
    })
  },

  unreadCount() {
    return apiFetch<UnreadCountResponse>('/api/familyos/notifications/unread-count')
  },

  act(notificationId: string, body: NotificationActionRequest) {
    return apiFetch<{ message: string }>(
      `/api/familyos/notifications/${notificationId}/action`,
      { method: 'POST', json: body },
    )
  },

  markRead(notificationId: string) {
    return apiFetch<{ message: string }>(
      `/api/familyos/notifications/${notificationId}/read`,
      { method: 'POST' },
    )
  },

  markAllRead() {
    return apiFetch<{ message: string }>(
      '/api/familyos/notifications/read-all',
      { method: 'POST' },
    )
  },
}
