import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { ApiError, schedulerApi } from '#/lib/api'

export function CronRunButton() {
  const qc = useQueryClient()
  const run = useMutation({
    mutationFn: (force: boolean) => schedulerApi.runNow(force),
    onSuccess: (stats, force) => {
      toast.success(
        `${force ? 'Forced' : 'Due'} jobs ran: ${stats.moneyRulesApplied} money rules, ${stats.transferOffers} transfer offers`,
      )
      void qc.invalidateQueries()
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'Could not run scheduled jobs'),
  })

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-[#233554] text-[#ccd6f6] hover:border-[#64ffda]/50 hover:text-[#64ffda]"
        disabled={run.isPending}
        onClick={() => run.mutate(false)}
      >
        {run.isPending ? 'Running…' : 'Run due jobs now'}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="text-[#8892b0] hover:text-[#64ffda]"
        disabled={run.isPending}
        onClick={() => run.mutate(true)}
      >
        Force all active rules
      </Button>
    </div>
  )
}
