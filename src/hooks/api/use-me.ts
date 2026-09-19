// hooks/api/familyos/use-me.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meApi, type ProfileResponse, type ProfileSetupRequest, type ProfileUpdateRequest } from '#/lib/api/endpoints/me'

export const ME_QUERY_KEY = ['fos-me']

export function useMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => meApi.get(),
    staleTime: 60_000,
    retry: false,
  })
}

export function useSetupProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProfileSetupRequest) => meApi.setup(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ME_QUERY_KEY })
      qc.invalidateQueries({ queryKey: ['sso-session'] })
    },
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProfileUpdateRequest) => meApi.update(body),
    onSuccess: (data: ProfileResponse) => {
      qc.setQueryData(ME_QUERY_KEY, data)
      qc.invalidateQueries({ queryKey: ['sso-session'] })
      qc.invalidateQueries({ queryKey: ['currentUser'] })
    },
  })
}
