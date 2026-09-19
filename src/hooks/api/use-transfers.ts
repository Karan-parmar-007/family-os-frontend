import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { transfersApi, type TransferCreateBody } from '#/lib/api/endpoints/transfers'
import { queryKeys } from '#/lib/query/keys'

export function useTransfers(familyId: string) {
  return useQuery({
    queryKey: queryKeys.transfers(familyId),
    queryFn: () => transfersApi.list(familyId),
    enabled: !!familyId,
    retry: false,
  })
}

export function useCreateTransfer(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TransferCreateBody) =>
      transfersApi.create(familyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transfers(familyId) })
    },
  })
}

export function useAcceptTransfer(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (transferId: string) => transfersApi.accept(familyId, transferId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transfers(familyId) })
    },
  })
}

export function useDeclineTransfer(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (transferId: string) => transfersApi.decline(familyId, transferId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transfers(familyId) })
    },
  })
}

export function useCancelTransfer(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (transferId: string) => transfersApi.cancel(familyId, transferId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transfers(familyId) })
    },
  })
}

export function useReverseTransfer(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (transferId: string) => transfersApi.reverse(familyId, transferId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transfers(familyId) })
    },
  })
}

export function usePersonalTransfers() {
  return useQuery({
    queryKey: queryKeys.personalTransfers,
    queryFn: () => transfersApi.listPersonal(),
    retry: false,
  })
}

export function useCreatePersonalTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TransferCreateBody) => transfersApi.createPersonal(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personalTransfers })
    },
  })
}

export function useAcceptPersonalTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (transferId: string) => transfersApi.acceptPersonal(transferId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personalTransfers })
    },
  })
}

export function useDeclinePersonalTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (transferId: string) => transfersApi.declinePersonal(transferId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personalTransfers })
    },
  })
}

export function useCancelPersonalTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (transferId: string) => transfersApi.cancelPersonal(transferId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personalTransfers })
    },
  })
}
