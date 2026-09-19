import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import { CurrencyAmountInput } from '#/components/forms/currency-amount-input'
import {
  FundingSourcesEditor,
  PersonalFundingSourcesEditor,
  type FundingFamilyOption,
  type FundingPersonOption,
  type FundingSourceRow,
} from '#/components/forms/funding-sources-editor'
import {
  amountRemaining,
  activeOtherFamilyRows,
  activePersonalRows,
  buildFundingSourcesPayload,
  sumAllocatedParts,
  validateFamilyPersonalLogSplit,
  type PersonalFundingRow,
} from '#/lib/forms/allocation'
import { formatCurrency, getDisplayCurrency } from '#/lib/format'

export type LogAllocationFormState = {
  total_amount: string
  family_amount: string
  personal_savings_amount: string
}

type Props = {
  familyLabel: string
  form: LogAllocationFormState
  setForm: React.Dispatch<React.SetStateAction<LogAllocationFormState>>
  useFundingSplit: boolean
  setUseFundingSplit: (on: boolean) => void
  fundingSources: FundingSourceRow[]
  setFundingSources: (rows: FundingSourceRow[]) => void
  personalRows: PersonalFundingRow[]
  setPersonalRows: (rows: PersonalFundingRow[]) => void
  familyOptions: FundingFamilyOption[]
  personOptions: FundingPersonOption[]
  currentFamilyId: string
  currentUserId: string
  familyCurrency: string
  rates: Record<string, number>
  ratesBase: string
  autoFillWhenSimple?: boolean
}

export function LogAllocationFields({
  familyLabel,
  form,
  setForm,
  useFundingSplit,
  setUseFundingSplit,
  fundingSources,
  setFundingSources,
  personalRows,
  setPersonalRows,
  familyOptions,
  personOptions,
  currentFamilyId,
  currentUserId,
  familyCurrency,
  rates,
  ratesBase,
  autoFillWhenSimple = true,
}: Props) {
  const displayCurrency = getDisplayCurrency() || familyCurrency
  const total = Number(form.total_amount) || 0
  const familyAmount = Number(form.family_amount) || 0
  const personalAmount = Number(form.personal_savings_amount) || 0
  const otherFamilyRows = activeOtherFamilyRows(fundingSources)
  const activePersonal = activePersonalRows(personalRows)
  const personalFromRows = activePersonal.reduce(
    (acc, row) => acc + (Number(row.amount) || 0),
    0,
  )
  const effectivePersonalAmount = useFundingSplit ? personalFromRows : personalAmount
  const noExplicitSplit =
    form.family_amount === '' &&
    form.personal_savings_amount === '' &&
    otherFamilyRows.length === 0 &&
    activePersonal.length === 0
  const allocated = sumAllocatedParts({
    familyAmount: noExplicitSplit ? total : familyAmount,
    personalAmount: effectivePersonalAmount,
    otherFamilyAmounts: otherFamilyRows,
  })
  const remaining = amountRemaining(total, allocated)
  const hasOtherFamilies = otherFamilyRows.length > 0
  const splitError = validateFamilyPersonalLogSplit({
    total,
    familyAmount,
    personalAmount,
    familyFieldFilled: form.family_amount !== '',
    personalFieldFilled: form.personal_savings_amount !== '',
    hasOtherFamilies,
    useMultiPersonal: useFundingSplit && activePersonal.length > 0,
  })

  const handleTotalChange = (val: string) => {
    if (useFundingSplit || !autoFillWhenSimple) {
      setForm((f) => ({ ...f, total_amount: val }))
      return
    }
    const nextTotal = Number(val) || 0
    const family = Number(form.family_amount) || 0
    const personal = Number(form.personal_savings_amount) || 0
    if (form.family_amount && !form.personal_savings_amount) {
      setForm({ ...form, total_amount: val, personal_savings_amount: String(Math.max(0, nextTotal - family)) })
    } else if (form.personal_savings_amount && !form.family_amount) {
      setForm({ ...form, total_amount: val, family_amount: String(Math.max(0, nextTotal - personal)) })
    } else {
      setForm({ ...form, total_amount: val })
    }
  }

  const handleFamilyChange = (val: string) => {
    if (useFundingSplit || !autoFillWhenSimple) {
      setForm((f) => ({ ...f, family_amount: val }))
      return
    }
    const nextTotal = Number(form.total_amount) || 0
    const family = Number(val) || 0
    setForm({ ...form, family_amount: val, personal_savings_amount: String(Math.max(0, nextTotal - family)) })
  }

  const handlePersonalChange = (val: string) => {
    if (useFundingSplit || !autoFillWhenSimple) {
      setForm((f) => ({ ...f, personal_savings_amount: val }))
      return
    }
    const nextTotal = Number(form.total_amount) || 0
    const personal = Number(val) || 0
    setForm({ ...form, personal_savings_amount: val, family_amount: String(Math.max(0, nextTotal - personal)) })
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-xl border border-border p-3">
        <div>
          <p className="text-sm font-medium">Use multi-source funding split</p>
          <p className="text-xs text-muted-foreground">
            Optional. Leave blank to put the full total in this family&apos;s savings.
          </p>
        </div>
        <Switch
          checked={useFundingSplit}
          onCheckedChange={(on) => {
            setUseFundingSplit(on)
            setFundingSources([])
            setPersonalRows([])
            if (on && personalRows.length === 0 && Number(form.personal_savings_amount) > 0) {
              setPersonalRows([
                { userId: currentUserId, amount: form.personal_savings_amount },
              ])
              setForm((f) => ({ ...f, personal_savings_amount: '' }))
            }
          }}
        />
      </div>

      <div className="space-y-1">
        <Label>Total amount *</Label>
        <CurrencyAmountInput
          value={form.total_amount}
          onChange={handleTotalChange}
          currency={displayCurrency}
          required
          min="0.01"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>{familyLabel}</Label>
          <CurrencyAmountInput
            value={form.family_amount}
            onChange={handleFamilyChange}
            currency={displayCurrency}
            min="0"
            placeholder="Optional"
          />
        </div>
        {!useFundingSplit && (
          <div className="space-y-1">
            <Label>Personal savings</Label>
            <CurrencyAmountInput
              value={form.personal_savings_amount}
              onChange={handlePersonalChange}
              currency={displayCurrency}
              min="0"
              placeholder="Optional"
            />
          </div>
        )}
      </div>

      {useFundingSplit && (
        <>
          <PersonalFundingSourcesEditor
            rows={personalRows}
            people={personOptions}
            currentUserId={currentUserId}
            displayCurrency={displayCurrency}
            rates={rates}
            ratesBase={ratesBase}
            onChange={setPersonalRows}
          />
          <FundingSourcesEditor
            rows={fundingSources}
            families={familyOptions}
            excludeFamilyId={currentFamilyId}
            displayCurrency={displayCurrency}
            rates={rates}
            ratesBase={ratesBase}
            onChange={setFundingSources}
          />
        </>
      )}

      {splitError && <p className="text-sm text-negative">{splitError}</p>}

      {total > 0 && !splitError && (
        <p
          className={`text-sm ${remaining === 0 ? 'text-positive' : remaining < 0 ? 'text-negative' : 'text-muted-foreground'}`}
        >
          {noExplicitSplit
            ? 'Entire amount goes to family savings.'
            : remaining === 0
              ? 'Fully allocated.'
              : remaining > 0
                ? `${formatCurrency(remaining)} left to allocate`
                : `${formatCurrency(Math.abs(remaining))} over allocated`}
        </p>
      )}
    </>
  )
}

export function appendLogAllocationToFormData(
  fd: FormData,
  opts: {
    form: LogAllocationFormState
    useFundingSplit: boolean
    fundingSources: FundingSourceRow[]
    personalRows: PersonalFundingRow[]
    currentFamilyId: string
    currentUserId: string
    letEveryoneEdit: boolean
  },
): { ok: true } | { ok: false; error: string } {
  const total = Number(opts.form.total_amount) || 0
  const personalAmount = Number(opts.form.personal_savings_amount) || 0
  const otherFamilyRows = activeOtherFamilyRows(opts.fundingSources)
  const activePersonal = activePersonalRows(opts.personalRows)
  const personalFromRows = activePersonal.reduce(
    (acc, row) => acc + (Number(row.amount) || 0),
    0,
  )
  const effectivePersonalAmount = opts.useFundingSplit ? personalFromRows : personalAmount
  // Total only (no family/personal/other filled) → 100% current family savings
  const noExplicitSplit =
    opts.form.family_amount === '' &&
    opts.form.personal_savings_amount === '' &&
    otherFamilyRows.length === 0 &&
    activePersonal.length === 0
  const familyAmount = noExplicitSplit ? total : Number(opts.form.family_amount) || 0
  const familyAmountField = noExplicitSplit ? String(total) : opts.form.family_amount

  const allocated = sumAllocatedParts({
    familyAmount,
    personalAmount: effectivePersonalAmount,
    otherFamilyAmounts: otherFamilyRows,
  })

  if (total <= 0) return { ok: false, error: 'Please enter the total amount.' }

  const splitError = validateFamilyPersonalLogSplit({
    total,
    familyAmount: Number(opts.form.family_amount) || 0,
    personalAmount,
    familyFieldFilled: opts.form.family_amount !== '',
    personalFieldFilled: opts.form.personal_savings_amount !== '',
    hasOtherFamilies: otherFamilyRows.length > 0,
    useMultiPersonal: opts.useFundingSplit && activePersonal.length > 0,
  })
  if (splitError) return { ok: false, error: splitError }

  if (allocated !== total) {
    const left = amountRemaining(total, allocated)
    return {
      ok: false,
      error: left > 0
        ? `${formatCurrency(left)} still needs to be allocated.`
        : 'Allocated amounts exceed the total.',
    }
  }

  const familyRows: Array<{ familyId: string; amount: string }> = []
  if (familyAmount > 0) {
    familyRows.push({ familyId: opts.currentFamilyId, amount: familyAmountField })
  }
  familyRows.push(...otherFamilyRows)

  const personalPayloadRows = opts.useFundingSplit
    ? activePersonal
    : personalAmount > 0
      ? [{ userId: opts.currentUserId, amount: String(personalAmount) }]
      : []

  const payload = buildFundingSourcesPayload(familyRows, personalPayloadRows)
  const hasOtherFamilies = otherFamilyRows.length > 0
  const hasMultiPersonal = activePersonal.length > 1
  const letEveryone =
    opts.letEveryoneEdit &&
    effectivePersonalAmount === 0 &&
    !hasOtherFamilies &&
    !hasMultiPersonal

  fd.append('total_amount', String(total))
  if (familyAmount > 0) fd.append('family_amount', familyAmountField)

  if (!opts.useFundingSplit && personalAmount > 0) {
    fd.append('personal_savings_amount', String(personalAmount))
    fd.append('personal_savings_user_id', opts.currentUserId)
  } else if (opts.useFundingSplit && activePersonal.length === 1 && activePersonal[0].userId === opts.currentUserId) {
    fd.append('personal_savings_amount', activePersonal[0].amount)
    fd.append('personal_savings_user_id', opts.currentUserId)
  }

  if (payload.length > 0) {
    fd.append('funding_sources', JSON.stringify(payload))
  }
  fd.append('let_everyone_edit', String(letEveryone))
  return { ok: true }
}
