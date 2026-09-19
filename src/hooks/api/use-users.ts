import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'
import type {
  ChangePasswordRequest,
  RequestEmailChange,
  UserMeUpdate,
  VerifyEmailChangeOtp,
} from '#/lib/api'

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UserMeUpdate) => usersApi.updateMe(body),
    onSuccess: (user) => qc.setQueryData(queryKeys.currentUser, user),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => usersApi.changePassword(body),
  })
}

export function useRequestEmailChange() {
  return useMutation({
    mutationFn: (body: RequestEmailChange) => usersApi.requestEmailChange(body),
  })
}

export function useVerifyEmailChange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: VerifyEmailChangeOtp) =>
      usersApi.verifyEmailChange(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.currentUser }),
  })
}
