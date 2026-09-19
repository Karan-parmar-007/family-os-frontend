import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { EyeIcon, DownloadIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import type { FamilyOption } from '#/components/forms/payment-split-editor'
import { DebtFundingSection } from '#/components/debt/debt-funding-section'
import {
  draftsFromScopeViews,
  scopeViewsFromSplits,
  scopeViewsPayloadFromDrafts,
} from '#/components/debt/debt-scope-views-editor'
import type { ScopeViewDraft } from '#/components/debt/debt-scope-views-editor'
import {
  viewLogDocument,
  downloadLogDocument,
} from '#/lib/documents/log-document-actions'
import type { DebtSummary } from '#/lib/api/types'
import { debtsApi } from '#/lib/api/endpoints/debts'
import type {
  DebtQuoteResponse,
  SplitLineBody,
} from '#/lib/api/endpoints/debts'
import type { SplitLinePayload } from '#/lib/api/endpoints/funding'
import { formatCurrency } from '#/lib/format'

const DEBT_TYPES = [
  'HOME_LOAN',
  'AUTO_LOAN',
  'PERSONAL_LOAN',
  'EDUCATION_LOAN',
  'GOLD_LOAN',
  'BUSINESS_LOAN',
  'CREDIT_CARD',
  'BNPL',
  'PAYDAY_LOAN',
  'MORTGAGE',
  'OVERDRAFT',
  'FRIEND_FAMILY',
  'INFORMAL_LENDER',
  'MEDICAL_DEBT',
  'TAX_DEBT',
  'OTHER',
]

const INTEREST_TYPES = [
  'NONE',
  'FLAT',
  'REDUCING_MONTHLY',
  'REDUCING_YEARLY',
  'SIMPLE',
  'COMPOUND',
  'FIXED_FEE',
  'FLOATING',
]

const COMPOUNDING_FREQUENCIES = [
  'MONTHLY',
  'QUARTERLY',
  'HALF_YEARLY',
  'YEARLY',
] as const

const EMI_EVERY_PRESETS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'DAILY', label: 'Daily' },
]

const DEBT_TYPE_PRESETS: Record<
  string,
  {
    interestType: string
    hasInterest: boolean
    hasEmi: boolean
    compoundingFrequency: string
  }
> = {
  HOME_LOAN: {
    interestType: 'REDUCING_MONTHLY',
    hasInterest: true,
    hasEmi: true,
    compoundingFrequency: 'MONTHLY',
  },
  MORTGAGE: {
    interestType: 'REDUCING_MONTHLY',
    hasInterest: true,
    hasEmi: true,
    compoundingFrequency: 'MONTHLY',
  },
  AUTO_LOAN: {
    interestType: 'REDUCING_MONTHLY',
    hasInterest: true,
    hasEmi: true,
    compoundingFrequency: 'MONTHLY',
  },
  PERSONAL_LOAN: {
    interestType: 'REDUCING_MONTHLY',
    hasInterest: true,
    hasEmi: true,
    compoundingFrequency: 'MONTHLY',
  },
  EDUCATION_LOAN: {
    interestType: 'REDUCING_MONTHLY',
    hasInterest: true,
    hasEmi: true,
    compoundingFrequency: 'MONTHLY',
  },
  GOLD_LOAN: {
    interestType: 'REDUCING_MONTHLY',
    hasInterest: true,
    hasEmi: true,
    compoundingFrequency: 'MONTHLY',
  },
  BUSINESS_LOAN: {
    interestType: 'REDUCING_MONTHLY',
    hasInterest: true,
    hasEmi: true,
    compoundingFrequency: 'MONTHLY',
  },
  CREDIT_CARD: {
    interestType: 'COMPOUND',
    hasInterest: true,
    hasEmi: false,
    compoundingFrequency: 'MONTHLY',
  },
  OVERDRAFT: {
    interestType: 'COMPOUND',
    hasInterest: true,
    hasEmi: false,
    compoundingFrequency: 'MONTHLY',
  },
  BNPL: {
    interestType: 'FIXED_FEE',
    hasInterest: true,
    hasEmi: true,
    compoundingFrequency: 'MONTHLY',
  },
  PAYDAY_LOAN: {
    interestType: 'FIXED_FEE',
    hasInterest: true,
    hasEmi: true,
    compoundingFrequency: 'MONTHLY',
  },
  FRIEND_FAMILY: {
    interestType: 'NONE',
    hasInterest: false,
    hasEmi: true,
    compoundingFrequency: 'MONTHLY',
  },
  INFORMAL_LENDER: {
    interestType: 'NONE',
    hasInterest: false,
    hasEmi: true,
    compoundingFrequency: 'MONTHLY',
  },
  MEDICAL_DEBT: {
    interestType: 'NONE',
    hasInterest: false,
    hasEmi: true,
    compoundingFrequency: 'MONTHLY',
  },
  TAX_DEBT: {
    interestType: 'NONE',
    hasInterest: false,
    hasEmi: true,
    compoundingFrequency: 'MONTHLY',
  },
  OTHER: {
    interestType: 'REDUCING_MONTHLY',
    hasInterest: true,
    hasEmi: true,
    compoundingFrequency: 'MONTHLY',
  },
}

const WIZARD_STEPS = ['Loan', 'Numbers', 'People & privacy'] as const

export type DebtFormValues = {
  debt_name: string
  type: string
  total_amount: number
  remaining_amount?: number
  has_interest: boolean
  interest_type?: string
  interest_rate?: number
  compounding_frequency?: string
  fixed_fee_amount?: number
  has_emi: boolean
  emi_amount?: number
  emi_every?: string
  emi_interval_days?: number | null
  emi_interval_months?: number | null
  emi_interval_years?: number | null
  tenure_months?: number
  emi_next_date?: string
  start_date?: string
  end_date?: string
  requires_confirmation: boolean
  bounce_fine_amount: number
  is_masked: boolean
  real_total_amount?: number
  real_remaining_amount?: number
  real_emi_amount?: number
  real_interest_rate?: number
  show_split_to_family: boolean
  document_id?: string | null
  show_doc_to_all: boolean
  doc_viewer_user_ids: string[]
  splitLines?: SplitLineBody[]
  scopeViews?: ReturnType<typeof scopeViewsPayloadFromDrafts>
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string
  familyName: string
  isPersonalScope: boolean
  otherFamilies?: FamilyOption[]
  relatedFamilies?: FamilyOption[]
  memberFamilies?: FamilyOption[]
  members?: { id?: string; name?: string }[]
  currentUserId?: string
  initial?: DebtSummary | null
  onSubmit: (values: DebtFormValues, documentFile?: File | null) => void
  isPending?: boolean
}

export function DebtFormDialog({
  open,
  onOpenChange,
  familyId,
  familyName,
  isPersonalScope,
  otherFamilies = [],
  relatedFamilies = [],
  memberFamilies = [],
  members = [],
  currentUserId = '',
  initial,
  onSubmit,
  isPending,
}: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [type, setType] = useState('PERSONAL_LOAN')
  const [total, setTotal] = useState('')
  const [remaining, setRemaining] = useState('')
  const [hasInterest, setHasInterest] = useState(false)
  const [interestType, setInterestType] = useState('REDUCING_MONTHLY')
  const [interestRate, setInterestRate] = useState('')
  const [hasEmi, setHasEmi] = useState(false)
  const [emiAmount, setEmiAmount] = useState('')
  const [tenureMonths, setTenureMonths] = useState('')
  const [quoteInput, setQuoteInput] = useState<'emi' | 'tenure'>('tenure')
  const [quote, setQuote] = useState<DebtQuoteResponse | null>(null)
  const [quotePending, setQuotePending] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  // Frequency mode: 'preset' uses emi_every, 'custom' uses emi_interval_*
  const [frequencyMode, setFrequencyMode] = useState<'preset' | 'custom'>(
    'preset',
  )
  const [emiEvery, setEmiEvery] = useState('MONTHLY')
  const [emiIntervalDays, setEmiIntervalDays] = useState('')
  const [emiIntervalMonths, setEmiIntervalMonths] = useState('')
  const [emiIntervalYears, setEmiIntervalYears] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [emiNextDate, setEmiNextDate] = useState('')
  const [requiresConfirmation, setRequiresConfirmation] = useState(true)
  const [bounceFine, setBounceFine] = useState('0')
  const [compoundingFrequency, setCompoundingFrequency] = useState('MONTHLY')
  const [fixedFeeAmount, setFixedFeeAmount] = useState('')
  const [usePaymentSplit, setUsePaymentSplit] = useState(false)
  const [splitLines, setSplitLines] = useState<SplitLinePayload[]>([])
  const [scopeViews, setScopeViews] = useState<ScopeViewDraft[]>([])

  // Document upload — optionally also visible to Full details scopes
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [shareDocWithFullDetails, setShareDocWithFullDetails] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const familiesForViews = useMemo(() => {
    const map = new Map<string, FamilyOption>()
    map.set(familyId, { id: familyId, name: familyName })
    for (const f of memberFamilies) map.set(f.id, f)
    return [...map.values()]
  }, [familyId, familyName, memberFamilies])

  useEffect(() => {
    if (!open) return
    setStep(0)
    setQuote(null)
    setQuoteError('')
    if (initial) {
      setName(initial.debtName)
      setType(initial.type || 'PERSONAL_LOAN')
      setTotal(String(initial.totalAmount))
      setRemaining(String(initial.remainingAmount))
      setHasInterest(!!initial.hasInterest)
      setInterestType(
        initial.interestType && initial.interestType !== 'NONE'
          ? initial.interestType
          : 'REDUCING_MONTHLY',
      )
      setInterestRate(
        initial.interestRate != null ? String(initial.interestRate) : '',
      )
      setHasEmi(!!initial.hasEmi)
      setEmiAmount(initial.emiAmount != null ? String(initial.emiAmount) : '')
      setTenureMonths(
        initial.tenureMonths != null ? String(initial.tenureMonths) : '',
      )
      setQuoteInput(initial.emiAmount != null ? 'emi' : 'tenure')
      // Detect if using custom interval
      const hasCustom = !!(
        initial.emiIntervalDays ||
        initial.emiIntervalMonths ||
        initial.emiIntervalYears
      )
      if (hasCustom) {
        setFrequencyMode('custom')
        setEmiIntervalDays(
          initial.emiIntervalDays != null
            ? String(initial.emiIntervalDays)
            : '',
        )
        setEmiIntervalMonths(
          initial.emiIntervalMonths != null
            ? String(initial.emiIntervalMonths)
            : '',
        )
        setEmiIntervalYears(
          initial.emiIntervalYears != null
            ? String(initial.emiIntervalYears)
            : '',
        )
        setEmiEvery('MONTHLY')
      } else {
        setFrequencyMode('preset')
        setEmiEvery(initial.emiEvery || 'MONTHLY')
        setEmiIntervalDays('')
        setEmiIntervalMonths('')
        setEmiIntervalYears('')
      }
      setStartDate(initial.startDate ? initial.startDate.slice(0, 10) : '')
      setEndDate(initial.endDate ? initial.endDate.slice(0, 10) : '')
      setEmiNextDate(
        initial.emiNextDate ? initial.emiNextDate.slice(0, 10) : '',
      )
      setRequiresConfirmation(initial.requiresConfirmation ?? true)
      setBounceFine(String(initial.bounceFineAmount ?? '0'))
      setCompoundingFrequency(initial.compoundingFrequency || 'MONTHLY')
      setFixedFeeAmount(
        initial.fixedFeeAmount != null ? String(initial.fixedFeeAmount) : '',
      )
      setUsePaymentSplit(
        (initial.splitLines?.length ?? 0) > 0 ||
          (initial.scopeViews?.length ?? 0) > 1,
      )
      setScopeViews(
        draftsFromScopeViews(initial.scopeViews, {
          showPersonal: true,
          families: familiesForViews,
          relatedFamilies,
          members: members
            .filter(
              (m): m is { id: string; name: string } => !!m.id && !!m.name,
            )
            .map((m) => ({ id: m.id, name: m.name })),
          currentUserId,
        }),
      )
      setSplitLines(
        (initial.splitLines ?? []).map((l) => ({
          poolType: l.poolType,
          familyId: l.familyId ?? undefined,
          userId: l.userId ?? undefined,
          amount: String(l.amount),
          expectedTotal:
            l.expectedTotal != null && l.expectedTotal !== ''
              ? String(l.expectedTotal)
              : '',
          obligationRemaining:
            l.obligationRemaining != null && l.obligationRemaining !== ''
              ? String(l.obligationRemaining)
              : l.expectedTotal != null && l.expectedTotal !== ''
                ? String(l.expectedTotal)
                : '',
        })),
      )
      setDocumentFile(null)
      setShareDocWithFullDetails(initial.showDocToAll ?? true)
    } else {
      setName('')
      setType('PERSONAL_LOAN')
      setTotal('')
      setRemaining('')
      setHasInterest(true)
      setInterestType('REDUCING_MONTHLY')
      setInterestRate('')
      setHasEmi(true)
      setEmiAmount('')
      setTenureMonths('')
      setQuoteInput('tenure')
      setFrequencyMode('preset')
      setEmiEvery('MONTHLY')
      setEmiIntervalDays('')
      setEmiIntervalMonths('')
      setEmiIntervalYears('')
      setStartDate('')
      setEndDate('')
      setEmiNextDate('')
      setRequiresConfirmation(true)
      setBounceFine('0')
      setCompoundingFrequency('MONTHLY')
      setFixedFeeAmount('')
      setUsePaymentSplit(false)
      setSplitLines([])
      setDocumentFile(null)
      setShareDocWithFullDetails(true)
      setScopeViews(
        draftsFromScopeViews(undefined, {
          showPersonal: true,
          families: familiesForViews,
          relatedFamilies,
          members: members
            .filter(
              (m): m is { id: string; name: string } => !!m.id && !!m.name,
            )
            .map((m) => ({ id: m.id, name: m.name })),
          currentUserId,
        }).map((d) => ({
          ...d,
          enabled:
            (isPersonalScope && d.scopeKind === 'PERSONAL') ||
            (!isPersonalScope &&
              d.scopeKind === 'FAMILY' &&
              d.familyId === familyId),
        })),
      )
    }
  }, [
    open,
    initial,
    familiesForViews,
    relatedFamilies,
    isPersonalScope,
    familyId,
    members,
    currentUserId,
  ])

  const applyTypePreset = (nextType: string) => {
    const preset = DEBT_TYPE_PRESETS[nextType] ?? DEBT_TYPE_PRESETS.OTHER
    setType(nextType)
    setInterestType(preset.interestType)
    setHasInterest(preset.hasInterest)
    setHasEmi(preset.hasEmi)
    setCompoundingFrequency(preset.compoundingFrequency)
    if (!preset.hasInterest) {
      setInterestRate('')
      setFixedFeeAmount('')
    }
    setQuote(null)
    setQuoteError('')
  }

  useEffect(() => {
    if (!open || !hasEmi) {
      setQuote(null)
      return
    }
    const principal = Number(total)
    const sourceValue =
      quoteInput === 'emi' ? Number(emiAmount) : Number(tenureMonths)
    const effectiveInterestType = hasInterest ? interestType : 'NONE'
    const needsRate =
      effectiveInterestType !== 'NONE' && effectiveInterestType !== 'FIXED_FEE'
    if (
      principal <= 0 ||
      sourceValue <= 0 ||
      (needsRate && (!interestRate || Number(interestRate) < 0)) ||
      (effectiveInterestType === 'FIXED_FEE' && fixedFeeAmount === '')
    ) {
      setQuote(null)
      setQuoteError('')
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setQuotePending(true)
      setQuoteError('')
      try {
        const result = await debtsApi.quoteDebt(familyId, {
          principal,
          interest_type: effectiveInterestType,
          annual_rate_pct: needsRate ? Number(interestRate) : 0,
          compounding_frequency: compoundingFrequency,
          emi_amount: quoteInput === 'emi' ? Number(emiAmount) : undefined,
          tenure_months:
            quoteInput === 'tenure' ? Number(tenureMonths) : undefined,
          fixed_fee_amount:
            effectiveInterestType === 'FIXED_FEE'
              ? Number(fixedFeeAmount)
              : undefined,
        })
        if (cancelled) return
        setQuote(result)
        if (quoteInput === 'emi') {
          setTenureMonths(String(result.tenure_months))
        } else {
          setEmiAmount(String(result.emi))
        }
      } catch {
        if (!cancelled) {
          setQuote(null)
          setQuoteError('Could not calculate this repayment yet.')
        }
      } finally {
        if (!cancelled) setQuotePending(false)
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [
    open,
    familyId,
    total,
    hasInterest,
    interestType,
    interestRate,
    compoundingFrequency,
    fixedFeeAmount,
    hasEmi,
    emiAmount,
    tenureMonths,
    quoteInput,
  ])

  const memberOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    for (const m of members) {
      if (m.id && m.name) map.set(m.id, { id: m.id, name: m.name })
    }
    if (currentUserId && !map.has(currentUserId)) {
      map.set(currentUserId, { id: currentUserId, name: 'You' })
    }
    return [...map.values()]
  }, [members, currentUserId])

  useEffect(() => {
    if (!usePaymentSplit) return
    setScopeViews((previous) =>
      scopeViewsFromSplits({
        lines: splitLines,
        currentFamily: { id: familyId, name: familyName },
        otherFamilies,
        members: memberOptions,
        currentUserId,
        total: Number(total) || 0,
        remaining: Number(remaining || total) || 0,
        emi: Number(emiAmount || total) || 0,
        interestRate: Number(interestRate) || 0,
        previous,
      }),
    )
  }, [
    usePaymentSplit,
    splitLines,
    familyId,
    familyName,
    otherFamilies,
    memberOptions,
    currentUserId,
    total,
    remaining,
    emiAmount,
    interestRate,
  ])

  const clearInterestFields = () => {
    setInterestType('REDUCING_MONTHLY')
    setInterestRate('')
    setCompoundingFrequency('MONTHLY')
    setFixedFeeAmount('')
  }

  const activeEmi = Number(emiAmount) || 0

  const goNext = () => {
    if (step === 0 && !name.trim()) {
      toast.error('Name this loan before continuing')
      return
    }
    if (step === 1) {
      if (Number(total) <= 0) {
        toast.error('Enter a valid principal amount')
        return
      }
      if (hasEmi && (Number(emiAmount) <= 0 || Number(tenureMonths) <= 0)) {
        toast.error('Enter an EMI or tenure so the repayment can be calculated')
        return
      }
    }
    setStep((current) => Math.min(WIZARD_STEPS.length - 1, current + 1))
  }

  const handleSubmit = () => {
    const totalAmount = Number(total)
    if (!name.trim() || Number.isNaN(totalAmount) || totalAmount <= 0) {
      toast.error('Enter a valid debt name and total amount')
      return
    }

    if (hasInterest) {
      if (!interestType || interestType === 'NONE') {
        toast.error('Select an interest type')
        return
      }
      if (interestType === 'FIXED_FEE') {
        const fee = Number(fixedFeeAmount)
        if (!fixedFeeAmount || Number.isNaN(fee) || fee < 0) {
          toast.error('Fixed fee amount is required')
          return
        }
      } else {
        const rateVal = Number(interestRate)
        if (!interestRate || Number.isNaN(rateVal) || rateVal < 0) {
          toast.error('Interest rate is required')
          return
        }
      }
      if (interestType === 'COMPOUND') {
        if (
          !COMPOUNDING_FREQUENCIES.includes(
            compoundingFrequency as (typeof COMPOUNDING_FREQUENCIES)[number],
          )
        ) {
          toast.error('Select a valid compounding frequency')
          return
        }
      }
    }

    if (hasEmi) {
      if (!emiNextDate) {
        toast.error('Next EMI date is required')
        return
      }
      if (frequencyMode === 'custom') {
        const hasAnyInterval =
          emiIntervalDays || emiIntervalMonths || emiIntervalYears
        if (!hasAnyInterval) {
          toast.error(
            'Enter at least one custom interval value (days, months, or years)',
          )
          return
        }
      }

      const emi = Number(emiAmount)
      if (!emi || emi <= 0) {
        toast.error('Enter a monthly EMI amount')
        return
      }
    }

    if (usePaymentSplit) {
      const expected = Number(activeEmi || total)
      const splitTotal = splitLines.reduce(
        (sum, line) => sum + (Number(line.amount) || 0),
        0,
      )
      if (!splitLines.length || Math.abs(splitTotal - expected) >= 0.01) {
        toast.error(`Payment split must equal ${expected.toFixed(2)}`)
        return
      }
      const incompleteView = scopeViews.find(
        (view) =>
          view.enabled &&
          !view.showBreakdown &&
          (view.scopeKind === 'FAMILY' || view.userId !== currentUserId) &&
          (!view.displayTotalAmount ||
            !view.displayRemainingAmount ||
            (hasEmi && !view.displayEmiAmount) ||
            (hasInterest && !view.displayInterestRate)),
      )
      if (incompleteView) {
        const label =
          incompleteView.scopeKind === 'PERSONAL'
            ? (incompleteView.userName ?? 'member')
            : (incompleteView.familyName ?? 'family')
        toast.error(`Complete all visible values for ${label}`)
        return
      }
    }

    const finalEmi = Number(emiAmount)

    // Build frequency fields (mutually exclusive)
    const emiEveryVal =
      hasEmi && frequencyMode === 'preset' ? emiEvery : undefined
    const emiIntervalDaysVal =
      hasEmi && frequencyMode === 'custom' && emiIntervalDays
        ? Number(emiIntervalDays)
        : undefined
    const emiIntervalMonthsVal =
      hasEmi && frequencyMode === 'custom' && emiIntervalMonths
        ? Number(emiIntervalMonths)
        : undefined
    const emiIntervalYearsVal =
      hasEmi && frequencyMode === 'custom' && emiIntervalYears
        ? Number(emiIntervalYears)
        : undefined

    onSubmit(
      {
        debt_name: name.trim(),
        type,
        total_amount: totalAmount,
        remaining_amount: remaining ? Number(remaining) : undefined,
        has_interest: hasInterest,
        interest_type: hasInterest ? interestType : undefined,
        interest_rate:
          hasInterest && interestType !== 'FIXED_FEE' && interestRate
            ? Number(interestRate)
            : undefined,
        compounding_frequency:
          hasInterest && interestType === 'COMPOUND'
            ? compoundingFrequency
            : undefined,
        fixed_fee_amount:
          hasInterest && interestType === 'FIXED_FEE'
            ? Number(fixedFeeAmount)
            : undefined,
        has_emi: hasEmi,
        emi_amount:
          hasEmi && !Number.isNaN(finalEmi) && finalEmi > 0
            ? finalEmi
            : undefined,
        emi_every: emiEveryVal,
        emi_interval_days: emiIntervalDaysVal,
        emi_interval_months: emiIntervalMonthsVal,
        emi_interval_years: emiIntervalYearsVal,
        tenure_months:
          hasEmi && Number(tenureMonths) > 0 ? Number(tenureMonths) : undefined,
        emi_next_date:
          hasEmi && emiNextDate ? `${emiNextDate}T00:00:00Z` : undefined,
        start_date: startDate ? `${startDate}T00:00:00Z` : undefined,
        end_date: endDate ? `${endDate}T00:00:00Z` : undefined,
        requires_confirmation: requiresConfirmation,
        bounce_fine_amount: Number(bounceFine || 0),
        is_masked: false,
        show_split_to_family: false,
        // When on: scopes with Full details can also see the document (owner always can).
        show_doc_to_all: shareDocWithFullDetails,
        doc_viewer_user_ids: [],
        splitLines:
          usePaymentSplit && splitLines.length > 0
            ? splitLines.map((l) => ({
                poolType: l.poolType as SplitLineBody['poolType'],
                amount: Number(l.amount),
                familyId: l.familyId,
                userId:
                  l.poolType === 'PERSONAL'
                    ? l.userId || currentUserId || null
                    : undefined,
                expectedTotal:
                  l.expectedTotal != null && l.expectedTotal !== ''
                    ? Number(l.expectedTotal)
                    : undefined,
                obligationRemaining:
                  l.obligationRemaining != null && l.obligationRemaining !== ''
                    ? Number(l.obligationRemaining)
                    : l.expectedTotal != null && l.expectedTotal !== ''
                      ? Number(l.expectedTotal)
                      : undefined,
              }))
            : undefined,
        scopeViews: usePaymentSplit
          ? scopeViewsPayloadFromDrafts(scopeViews)
          : undefined,
      },
      documentFile,
    )
  }

  const emiTotal = hasEmi && activeEmi ? String(activeEmi) : total
  const handleSplitLinesChange = (nextLines: SplitLinePayload[]) => {
    if (nextLines.length > 0 && nextLines.length !== splitLines.length) {
      const payment = Number(emiTotal) || 0
      const expected = Number(remaining || total) || 0
      let assignedPayment = 0
      let assignedExpected = 0
      setSplitLines(
        nextLines.map((line, index) => {
          const isLast = index === nextLines.length - 1
          const amount = isLast
            ? Math.round((payment - assignedPayment) * 100) / 100
            : Math.round((payment / nextLines.length) * 100) / 100
          const expectedTotal = isLast
            ? Math.round((expected - assignedExpected) * 100) / 100
            : Math.round((expected / nextLines.length) * 100) / 100
          assignedPayment += amount
          assignedExpected += expectedTotal
          return {
            ...line,
            amount: String(amount),
            expectedTotal: String(expectedTotal),
            obligationRemaining: String(expectedTotal),
          }
        }),
      )
      return
    }
    setSplitLines(nextLines)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Debt' : 'Add Debt'}</DialogTitle>
          <DialogDescription>
            {isPersonalScope ? 'Personal loan' : 'Family loan'} — enter the real
            loan once, then optionally share the payment.
          </DialogDescription>
        </DialogHeader>
        <div
          className="grid grid-cols-3 gap-2"
          aria-label="Debt setup progress"
        >
          {WIZARD_STEPS.map((label, index) => (
            <div key={label} className="space-y-1">
              <div
                className={`h-1.5 rounded-full ${
                  index <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
              <p
                className={`text-center text-[11px] ${
                  index === step
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {index + 1}. {label}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-5">
          {step <= 1 && (
            <section className="space-y-4 rounded-xl border border-border p-4">
              <div>
                <h3 className="text-sm font-semibold">
                  {step === 0 ? 'What is this loan?' : 'Loan numbers'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {step === 0
                    ? 'Choose a type to prefill the usual interest and repayment setup.'
                    : 'Enter the principal and repayment details.'}
                </p>
              </div>
              {step === 0 ? (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)]">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Select value={type} onValueChange={applyTypePreset}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEBT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Principal</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={total}
                        onChange={(e) => setTotal(e.target.value)}
                        placeholder="e.g. 500000"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Remaining amount</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={remaining}
                        onChange={(e) => setRemaining(e.target.value)}
                        placeholder="Same as total if new"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Start date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>End date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {step === 1 && (
            <>
              <section className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">2. Interest</h3>
                    <p className="text-xs text-muted-foreground">
                      Optional — leave off for interest-free loans.
                    </p>
                  </div>
                  <Switch
                    checked={hasInterest}
                    onCheckedChange={(enabled) => {
                      setHasInterest(enabled)
                      if (!enabled) clearInterestFields()
                    }}
                  />
                </div>
                {hasInterest && (
                  <div className="space-y-3 border-t border-border/50 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Interest type</Label>
                        <Select
                          value={interestType}
                          onValueChange={setInterestType}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INTEREST_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {interestType !== 'FIXED_FEE' && (
                        <div className="space-y-1">
                          <Label>Annual rate %</Label>
                          <Input
                            type="number"
                            value={interestRate}
                            onChange={(e) => setInterestRate(e.target.value)}
                            placeholder="e.g. 8.5"
                          />
                        </div>
                      )}
                    </div>
                    {interestType === 'COMPOUND' && (
                      <div className="space-y-1">
                        <Label>Compounding frequency</Label>
                        <Select
                          value={compoundingFrequency}
                          onValueChange={setCompoundingFrequency}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPOUNDING_FREQUENCIES.map((f) => (
                              <SelectItem key={f} value={f}>
                                {f.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {interestType === 'FIXED_FEE' && (
                      <div className="space-y-1">
                        <Label>Fixed fee amount</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={fixedFeeAmount}
                          onChange={(e) => setFixedFeeAmount(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section className="space-y-4 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">3. EMI schedule</h3>
                    <p className="text-xs text-muted-foreground">
                      Optional recurring repayment.
                    </p>
                  </div>
                  <Switch checked={hasEmi} onCheckedChange={setHasEmi} />
                </div>

                {hasEmi && (
                  <div className="space-y-4 border-t border-border/50 pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label>EMI amount</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={emiAmount}
                          onChange={(e) => {
                            setQuoteInput('emi')
                            setEmiAmount(e.target.value)
                          }}
                          placeholder="e.g. 8243"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter EMI and tenure will be calculated.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label>Tenure (months)</Label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={tenureMonths}
                          onChange={(e) => {
                            setQuoteInput('tenure')
                            setTenureMonths(e.target.value)
                          }}
                          placeholder="e.g. 240"
                        />
                        <p className="text-xs text-muted-foreground">
                          Or enter tenure and EMI will be calculated.
                        </p>
                      </div>
                    </div>

                    {(quote || quotePending || quoteError) && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                        {quotePending ? (
                          <p className="text-muted-foreground">
                            Calculating repayment…
                          </p>
                        ) : quote ? (
                          <p>
                            Total interest ≈{' '}
                            <span className="font-medium">
                              {formatCurrency(Number(quote.total_interest))}
                            </span>
                            {' · '}Total payable ≈{' '}
                            <span className="font-medium">
                              {formatCurrency(Number(quote.total_payable))}
                            </span>
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {quoteError}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label>
                          Next EMI date{' '}
                          <span className="text-xs font-normal text-muted-foreground">
                            (required)
                          </span>
                        </Label>
                        <Input
                          type="date"
                          value={emiNextDate}
                          onChange={(e) => setEmiNextDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Frequency</Label>
                        <Select
                          value={
                            frequencyMode === 'preset' ? emiEvery : 'CUSTOM'
                          }
                          onValueChange={(value) => {
                            if (value === 'CUSTOM') {
                              setFrequencyMode('custom')
                            } else {
                              setFrequencyMode('preset')
                              setEmiEvery(value)
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EMI_EVERY_PRESETS.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                            <SelectItem value="CUSTOM">
                              Custom interval
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Bounce fine</Label>
                        <Input
                          type="number"
                          min="0"
                          value={bounceFine}
                          onChange={(e) => setBounceFine(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {frequencyMode === 'custom' && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Years
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={emiIntervalYears}
                            onChange={(e) =>
                              setEmiIntervalYears(e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Months
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={emiIntervalMonths}
                            onChange={(e) =>
                              setEmiIntervalMonths(e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Days
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={emiIntervalDays}
                            onChange={(e) => setEmiIntervalDays(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">
                          Confirm before each deduct
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Ask before auto-deducting EMI
                        </p>
                      </div>
                      <Switch
                        checked={requiresConfirmation}
                        onCheckedChange={setRequiresConfirmation}
                      />
                    </div>
                  </div>
                )}
              </section>
            </>
          )}

          {step === 2 && (
            <>
              <section className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">4. Who pays?</h3>
                    <p className="text-xs text-muted-foreground">
                      Optional — split EMI across Personal and families in one
                      place.
                    </p>
                  </div>
                  <Switch
                    checked={usePaymentSplit}
                    onCheckedChange={(checked) => {
                      setUsePaymentSplit(checked)
                      if (checked && splitLines.length === 0) {
                        const rem = remaining || total
                        setSplitLines([
                          {
                            poolType: isPersonalScope
                              ? 'PERSONAL'
                              : 'CURRENT_FAMILY',
                            familyId: isPersonalScope ? undefined : familyId,
                            userId: isPersonalScope ? currentUserId : undefined,
                            amount: emiTotal,
                            expectedTotal: rem,
                            obligationRemaining: rem,
                          },
                        ])
                      }
                      if (!checked) {
                        setSplitLines([])
                        setScopeViews([])
                      }
                    }}
                  />
                </div>
                {usePaymentSplit && (
                  <div className="border-t border-border/50 pt-3">
                    <DebtFundingSection
                      lines={splitLines}
                      onLinesChange={handleSplitLinesChange}
                      scopeViews={scopeViews}
                      onScopeViewsChange={setScopeViews}
                      currentFamilyId={familyId}
                      currentFamilyName={familyName}
                      currentUserId={currentUserId}
                      showCurrentFamily={!isPersonalScope}
                      otherFamilies={otherFamilies}
                      members={memberOptions}
                      paymentTotal={emiTotal}
                      expectedRemainingTotal={remaining || total}
                    />
                  </div>
                )}
              </section>

              <section className="space-y-3 rounded-xl border border-border p-4">
                <div>
                  <h3 className="text-sm font-semibold">5. Document</h3>
                  <p className="text-xs text-muted-foreground">
                    Optional sanction letter or agreement. You can always see
                    it.
                  </p>
                </div>

                {initial?.documentId && !documentFile && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                    <span className="flex-1 text-muted-foreground">
                      Existing document attached
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2 text-xs"
                      onClick={() =>
                        viewLogDocument(familyId, initial.documentId!)
                      }
                    >
                      <EyeIcon className="size-3.5" /> View
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2 text-xs"
                      onClick={() =>
                        downloadLogDocument(familyId, initial.documentId!)
                      }
                    >
                      <DownloadIcon className="size-3.5" /> Download
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {documentFile
                      ? 'Change file'
                      : initial?.documentId
                        ? 'Replace file'
                        : 'Attach file'}
                  </Button>
                  {documentFile && (
                    <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs">
                      <span className="max-w-[200px] truncate">
                        {documentFile.name}
                      </span>
                      <button
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setDocumentFile(null)
                          if (fileInputRef.current)
                            fileInputRef.current.value = ''
                        }}
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setDocumentFile(e.target.files?.[0] ?? null)
                    }
                  />
                </div>

                {(documentFile || initial?.documentId) && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">
                        Share with Full details viewers
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Also show this document to contributors you marked with
                        Full details in Who pays?
                      </p>
                    </div>
                    <Switch
                      checked={shareDocWithFullDetails}
                      onCheckedChange={setShareDocWithFullDetails}
                    />
                  </div>
                )}
              </section>
            </>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep((current) => current - 1)}
            >
              Back
            </Button>
          )}
          {step < WIZARD_STEPS.length - 1 ? (
            <Button onClick={goNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isPending}>
              {initial ? 'Save' : 'Create'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
