import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { goalsApi, personalGoalsApi } from '#/lib/api'
import { queryKeys } from '#/lib/query/keys'
import { scopeListParams, type AppScope } from '#/lib/scope'

export function useGoals(
  familyId: string,
  scope: AppScope,
  page = 1,
  pageSize = 20,
  status = 'ACTIVE',
) {
  const filters = { ...scopeListParams(scope), status }
  return useQuery({
    queryKey: [...queryKeys.goals(familyId), scope, page, status, filters] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalGoalsApi.list(page, pageSize, status)
        : goalsApi.list(familyId, page, pageSize, filters),
    enabled: !!familyId,
  })
}

export function useGoalHistory(familyId: string, scope: AppScope, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...queryKeys.goals(familyId), 'history', scope, page] as const,
    queryFn: () =>
      scope.kind === 'personal'
        ? personalGoalsApi.history(page, pageSize)
        : goalsApi.history(familyId, page, pageSize),
    enabled: !!familyId,
  })
}

export function useCreateGoal(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof goalsApi.create>[1]) =>
      scope.kind === 'personal'
        ? personalGoalsApi.create(familyId, body)
        : goalsApi.create(familyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals(familyId) })
    },
  })
}

export function useUpdateGoal(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      goalId,
      body,
    }: {
      goalId: string
      body: Parameters<typeof goalsApi.update>[2]
    }) =>
      scope.kind === 'personal'
        ? personalGoalsApi.update(goalId, body)
        : goalsApi.update(familyId, goalId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals(familyId) })
    },
  })
}

export function useDeleteGoal(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (goalId: string) =>
      scope.kind === 'personal'
        ? personalGoalsApi.remove(goalId)
        : goalsApi.remove(familyId, goalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals(familyId) })
    },
  })
}

export function useAddGoalContribution(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      goalId,
      amount,
      note,
    }: {
      goalId: string
      amount: number
      note?: string
    }) =>
      scope.kind === 'personal'
        ? personalGoalsApi.addContribution(goalId, { amount, note })
        : goalsApi.addContribution(familyId, goalId, { amount, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals(familyId) })
    },
  })
}

export function useWithdrawGoal(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      goalId,
      amount,
      note,
    }: {
      goalId: string
      amount: number
      note?: string
    }) =>
      scope.kind === 'personal'
        ? personalGoalsApi.withdraw(goalId, { amount, note })
        : goalsApi.withdraw(familyId, goalId, { amount, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals(familyId) })
    },
  })
}

export function useAchieveGoal(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (goalId: string) =>
      scope.kind === 'personal'
        ? personalGoalsApi.achieve(goalId)
        : goalsApi.achieve(familyId, goalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals(familyId) })
    },
  })
}

export function useReleaseGoal(familyId: string, scope: AppScope) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (goalId: string) =>
      scope.kind === 'personal'
        ? personalGoalsApi.release(goalId)
        : goalsApi.release(familyId, goalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals(familyId) })
    },
  })
}
