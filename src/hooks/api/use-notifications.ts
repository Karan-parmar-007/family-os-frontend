import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'
import type { NotificationActionRequest } from '#/lib/api'

export function useNotifications(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...queryKeys.notifications(), page, pageSize] as const,
    queryFn: () => notificationsApi.list(page, pageSize),
    staleTime: 30_000,
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notificationUnreadCount(),
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
  })
}

export function useNotificationAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      notificationId,
      body,
    }: {
      notificationId: string
      body: NotificationActionRequest
    }) => notificationsApi.act(notificationId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications() })
      qc.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount() })
    },
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markRead(notificationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications() })
      qc.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount() })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications() })
      qc.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount() })
    },
  })
}
