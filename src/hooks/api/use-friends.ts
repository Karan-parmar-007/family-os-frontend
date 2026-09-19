import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { friendsApi } from '#/lib/api/endpoints/friends'
import { queryKeys } from '#/lib/query/keys'

export function useFriends() {
  return useQuery({
    queryKey: queryKeys.friends,
    queryFn: () => friendsApi.list(),
  })
}

export function useActiveFriends() {
  return useQuery({
    queryKey: queryKeys.activeFriends,
    queryFn: () => friendsApi.active(),
  })
}

export function useFriendCode() {
  return useQuery({
    queryKey: queryKeys.friendCode,
    queryFn: () => friendsApi.myCode(),
  })
}

export function useRequestFriend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { friendCode: string }) => friendsApi.request(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.friends })
      qc.invalidateQueries({ queryKey: queryKeys.activeFriends })
    },
  })
}

export function useConfirmFriend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (friendshipId: string) => friendsApi.confirm(friendshipId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.friends })
      qc.invalidateQueries({ queryKey: queryKeys.activeFriends })
    },
  })
}

export function useRejectFriend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (friendshipId: string) => friendsApi.reject(friendshipId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.friends })
    },
  })
}

export function useCancelFriend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (friendshipId: string) => friendsApi.cancel(friendshipId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.friends })
    },
  })
}
