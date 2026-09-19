import { useState, useEffect } from 'react'
import { Label } from '#/components/ui/label'
import { Input } from '#/components/ui/input'
import { CalendarIcon } from 'lucide-react'

export type FrequencyUnit = 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS'

export interface FrequencySelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

const PRESET_OPTIONS = [
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Bi-Weekly (14d)', value: 'BIWEEKLY' },
  { label: 'Daily', value: 'DAILY' },
  { label: 'Yearly', value: 'YEARLY' },
  { label: 'Custom...', value: 'CUSTOM' },
]

export function FrequencySelector({
  value,
  onChange,
  label = 'Cadence / Frequency',
  className = '',
}: FrequencySelectorProps) {
  const parseValue = (val: string): { isCustom: boolean; count: number; unit: FrequencyUnit } => {
    const v = (val || 'MONTHLY').toUpperCase()
    const customMatch = v.match(/^(?:EVERY_|CUSTOM_)?(\d+)[_\s]*(DAY|DAYS|WEEK|WEEKS|MONTH|MONTHS|YEAR|YEARS)$/i)
    if (customMatch) {
      const u = customMatch[2].toUpperCase()
      const unit: FrequencyUnit = u.startsWith('DAY')
        ? 'DAYS'
        : u.startsWith('WEEK')
        ? 'WEEKS'
        : u.startsWith('MONTH')
        ? 'MONTHS'
        : 'YEARS'
      return {
        isCustom: true,
        count: parseInt(customMatch[1], 10) || 7,
        unit,
      }
    }
    const isStandardPreset = ['MONTHLY', 'WEEKLY', 'BIWEEKLY', 'DAILY', 'YEARLY'].includes(v)
    return {
      isCustom: !isStandardPreset,
      count: 7,
      unit: 'DAYS',
    }
  }

  const initialParsed = parseValue(value)
  const [isCustom, setIsCustom] = useState(initialParsed.isCustom)
  const [customCount, setCustomCount] = useState(initialParsed.count)
  const [customUnit, setCustomUnit] = useState<FrequencyUnit>(initialParsed.unit)

  useEffect(() => {
    const parsed = parseValue(value)
    setIsCustom(parsed.isCustom)
    if (parsed.isCustom) {
      setCustomCount(parsed.count)
      setCustomUnit(parsed.unit)
    }
  }, [value])

  const handleSelectPreset = (selectedVal: string) => {
    if (selectedVal === 'CUSTOM') {
      setIsCustom(true)
      const token = `EVERY_${customCount}_${customUnit}`
      onChange(token)
    } else {
      setIsCustom(false)
      onChange(selectedVal)
    }
  }

  const handleCustomChange = (count: number, unit: FrequencyUnit) => {
    const safeCount = Math.max(1, count)
    setCustomCount(safeCount)
    setCustomUnit(unit)
    onChange(`EVERY_${safeCount}_${unit}`)
  }

  const getReadableCustomSummary = () => {
    const unitWord = customCount === 1 ? customUnit.slice(0, -1).toLowerCase() : customUnit.toLowerCase()
    return `Repeats every ${customCount} ${unitWord}`
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-[#8892b0]">
          {label}
        </Label>
        {isCustom && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#64ffda]/10 px-2 py-0.5 text-[11px] font-medium text-[#64ffda]">
            <CalendarIcon className="size-3" />
            {getReadableCustomSummary()}
          </span>
        )}
      </div>

      {/* Primary Selector */}
      <select
        value={isCustom ? 'CUSTOM' : value}
        onChange={(e) => handleSelectPreset(e.target.value)}
        className="mt-1.5 h-9 w-full rounded-xl border border-[#233554] bg-[#0a192f] px-3 py-1.5 text-sm text-[#ccd6f6] shadow-xs transition hover:border-[#233554]/80 focus:border-[#64ffda] focus:ring-1 focus:ring-[#64ffda]/30 focus:outline-hidden"
      >
        {PRESET_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0a192f] text-[#ccd6f6]">
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom Frequency Sub-Controls */}
      {isCustom && (
        <div className="mt-2 rounded-xl border border-[#233554]/90 bg-[#0a192f]/70 p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-[11px] text-[#8892b0]">Specify custom interval:</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-[#8892b0]">Repeat Every</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={customCount}
                onChange={(e) => handleCustomChange(parseInt(e.target.value, 10) || 1, customUnit)}
                className="mt-1 bg-[#112240] border-[#233554] text-[#ccd6f6] text-sm h-9 rounded-lg focus:border-[#64ffda]"
              />
            </div>
            <div>
              <Label className="text-[10px] text-[#8892b0]">Unit</Label>
              <select
                value={customUnit}
                onChange={(e) => handleCustomChange(customCount, e.target.value as FrequencyUnit)}
                className="mt-1 h-9 w-full rounded-lg border border-[#233554] bg-[#112240] px-2.5 py-1.5 text-sm text-[#ccd6f6] focus:border-[#64ffda] focus:outline-hidden"
              >
                <option value="DAYS">Days (e.g. 7, 21)</option>
                <option value="WEEKS">Weeks</option>
                <option value="MONTHS">Months</option>
                <option value="YEARS">Years</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}