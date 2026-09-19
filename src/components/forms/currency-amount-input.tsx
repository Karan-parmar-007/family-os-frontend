import { Input } from '#/components/ui/input'
import { convertAmount, formatConversionHint, getCurrencySymbol } from '#/lib/currency'
import { formatCurrency } from '#/lib/format'

export function CurrencyAmountInput({
  value,
  onChange,
  currency,
  displayCurrency,
  rates,
  ratesBase,
  placeholder,
  min,
  step = '0.01',
  required,
  id,
}: {
  value: string
  onChange: (value: string) => void
  currency: string
  /** When different from `currency`, show converted hint below the field. */
  displayCurrency?: string
  rates?: Record<string, number>
  ratesBase?: string
  placeholder?: string
  min?: string
  step?: string
  required?: boolean
  id?: string
}) {
  const symbol = getCurrencySymbol(currency)
  const num = Number(value) || 0
  const showHint =
    displayCurrency &&
    currency !== displayCurrency &&
    rates &&
    ratesBase &&
    num > 0

  const converted =
    showHint ? convertAmount(num, currency, displayCurrency, rates, ratesBase) : null

  const hint =
    converted != null && displayCurrency
      ? formatConversionHint(num, converted, displayCurrency, (v, c) =>
          formatCurrency(v, { currency: c }),
        )
      : ''

  return (
    <div className="space-y-1">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {symbol}
        </span>
        <Input
          id={id}
          type="number"
          step={step}
          min={min}
          required={required}
          placeholder={placeholder}
          className="pl-8"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
