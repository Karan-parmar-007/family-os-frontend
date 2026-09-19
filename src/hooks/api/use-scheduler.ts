import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { schedulerApi } from '#/lib/api'

export function useScheduledJobs(familyId: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['families', familyId, 'jobs', page, pageSize] as const,
    queryFn: () => schedulerApi.list(familyId, page, pageSize),
    enabled: !!familyId,
  })
}

export function useMyScheduledJobs(familyId: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['families', familyId, 'jobs', 'mine', page, pageSize] as const,
    queryFn: () => schedulerApi.listMine(familyId, page, pageSize),
    enabled: !!familyId,
  })
}

export function useScheduledJobAction(familyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, action, delayDays }: { jobId: string; action: string; delayDays?: number }) =>
      schedulerApi.action(familyId, jobId, { action, delay_days: delayDays }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['families', familyId, 'jobs'] })
    },
  })
}
