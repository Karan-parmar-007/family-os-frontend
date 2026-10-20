import { Label } from '#/components/ui/label'
import { Input } from '#/components/ui/input'

/** Frequencies the backend schedules on (see app/core/date_advance.py). */
export type Frequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'HALF_YEARLY'
  | 'YEARLY'

export interface Schedule {
  frequency: Frequency
  everyN: number
}

const UNITS: { value: Frequency; one: string; many: string }[] = [
  { value: 'DAILY', one: 'day', many: 'days' },
  { value: 'WEEKLY', one: 'week', many: 'weeks' },
  { value: 'MONTHLY', one: 'month', many: 'months' },
  { value: 'QUARTERLY', one: 'quarter', many: 'quarters' },
  { value: 'HALF_YEARLY', one: 'half-year', many: 'half-years' },
  { value: 'YEARLY', one: 'year', many: 'years' },
]

export function toSchedule(frequency: string | null | undefined, everyN?: number | null): Schedule {
  const f = (frequency || 'MONTHLY').toUpperCase()
  if (f === 'BIWEEKLY') return { frequency: 'WEEKLY', everyN: 2 * (everyN || 1) }
  const known = UNITS.find((u) => u.value === f)
  return { frequency: known ? known.value : 'MONTHLY', everyN: Math.max(1, everyN || 1) }
}

export function frequencyLabel(frequency: string | null | undefined, everyN?: number | null): string {
  const s = toSchedule(frequency, everyN)
  const unit = UNITS.find((u) => u.value === s.frequency) ?? UNITS[2]
  if (s.everyN === 1) {
    const single: Record<Frequency, string> = {
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      BIWEEKLY: 'Every 2 weeks',
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      HALF_YEARLY: 'Every 6 months',
      YEARLY: 'Yearly',
    }
    return single[s.frequency]
  }
  return `Every ${s.everyN} ${unit.many}`
}

/** Approximate occurrences per month, for "projected monthly" totals. */
export function perMonth(frequency: string | null | undefined, everyN?: number | null): number {
  const s = toSchedule(frequency, everyN)
  const base: Record<Frequency, number> = {
    DAILY: 30.44,
    WEEKLY: 4.35,
    BIWEEKLY: 2.17,
    MONTHLY: 1,
    QUARTERLY: 1 / 3,
    HALF_YEARLY: 1 / 6,
    YEARLY: 1 / 12,
  }
  return base[s.frequency] / s.everyN
}

export interface FrequencySelectorProps {
  value: Schedule
  onChange: (value: Schedule) => void
  label?: string
  className?: string
}

export function FrequencySelector({
  value,
  onChange,
  label = 'Repeats',
  className = '',
}: FrequencySelectorProps) {
  const unit = UNITS.find((u) => u.value === value.frequency) ?? UNITS[2]
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-xs text-[#8892b0]">{label}</Label>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#8892b0]">Every</span>
          <Input
            type="number"
            min={1}
            max={365}
            value={value.everyN}
            onChange={(e) =>
              onChange({ ...value, everyN: Math.min(365, Math.max(1, parseInt(e.target.value, 10) || 1)) })
            }
            className="h-10 w-24 rounded-xl border-[#233554] bg-[#0a192f] text-[#ccd6f6] focus:border-[#64ffda]"
          />
        </div>
        <select
          value={value.frequency}
          onChange={(e) => onChange({ ...value, frequency: e.target.value as Frequency })}
          className="h-10 w-full min-w-0 flex-1 rounded-xl border border-[#233554] bg-[#0a192f] px-3 py-1.5 text-base text-[#ccd6f6] focus:border-[#64ffda] focus:outline-hidden sm:text-sm"
        >
          {UNITS.map((u) => (
            <option key={u.value} value={u.value} className="bg-[#0a192f] text-[#ccd6f6]">
              {value.everyN === 1 ? u.one : u.many}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[11px] text-[#8892b0]">
        {frequencyLabel(value.frequency, value.everyN)}. Posts at 18:00 on each due date.
      </p>
      {unit.value === 'MONTHLY' && (
        <p className="text-[11px] text-[#8892b0]/80">
          Dates past the end of a short month land on its last day.
        </p>
      )}
    </div>
  )
}
