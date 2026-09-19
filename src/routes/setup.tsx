import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronRight, Coins, Compass, Sparkles, User, Wallet } from 'lucide-react'
import { useSession } from '#/hooks/api/familyos/use-session'
import { useSetupProfile } from '#/hooks/api/familyos/use-me'

export const Route = createFileRoute('/setup')({
  component: SetupPage,
})

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
]

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'UTC',
]

function SetupPage() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const setupMutation = useSetupProfile()

  const [displayName, setDisplayName] = useState(session?.name || '')
  const [currencyCode, setCurrencyCode] = useState('USD')
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  )
  const [savingsOrigin, setSavingsOrigin] = useState('0')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setGeneralError(null)

    const errors: Record<string, string> = {}
    if (!displayName.trim()) {
      errors.displayName = 'Display name is required'
    }
    const originNum = parseFloat(savingsOrigin || '0')
    if (isNaN(originNum) || originNum < 0) {
      errors.personalSavingsOrigin = 'Initial savings must be 0 or greater'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      await setupMutation.mutateAsync({
        displayName: displayName.trim(),
        currencyCode,
        timezone: TIMEZONES.includes(timezone) ? timezone : 'Asia/Kolkata',
        personalSavingsOrigin: savingsOrigin || '0',
      })
      navigate({ to: '/families' })
    } catch (err: any) {
      if (err?.detail && typeof err.detail === 'object') {
        setFieldErrors(err.detail)
      } else {
        setGeneralError(err?.message || 'Failed to complete profile setup. Please try again.')
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#0a192f] text-[#ccd6f6] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#64ffda]/20 selection:text-[#64ffda]">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#112240] border border-[#233554] text-[#64ffda] text-xs font-mono mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Family OS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans">
            Set up your personal space
          </h1>
          <p className="text-[#8892b0] mt-2 text-sm">
            Configure your personal preferences to initialize your Family OS workspace.
          </p>
        </div>

        <div className="bg-[#112240] border border-[#233554] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-[#64ffda]/5 rounded-full blur-2xl pointer-events-none" />

          {generalError && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-xs font-mono uppercase tracking-wider text-[#8892b0] mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#64ffda]" />
                  Your Display Name
                </span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Karan Parmar"
                className="w-full px-4 py-3 bg-[#0a192f] border border-[#233554] rounded-xl text-white placeholder-[#8892b0]/50 focus:outline-none focus:border-[#64ffda] transition-colors text-sm font-sans"
              />
              {fieldErrors.displayName && (
                <p className="mt-1 text-xs text-red-400 font-mono">{fieldErrors.displayName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="currency" className="block text-xs font-mono uppercase tracking-wider text-[#8892b0] mb-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#64ffda]" />
                    Personal Currency
                  </span>
                </label>
                <select
                  id="currency"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0a192f] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#64ffda] transition-colors text-sm font-sans"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#0a192f] text-white">
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.currencyCode && (
                  <p className="mt-1 text-xs text-red-400 font-mono">{fieldErrors.currencyCode}</p>
                )}
              </div>

              <div>
                <label htmlFor="timezone" className="block text-xs font-mono uppercase tracking-wider text-[#8892b0] mb-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#64ffda]" />
                    Primary Timezone
                  </span>
                </label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0a192f] border border-[#233554] rounded-xl text-white focus:outline-none focus:border-[#64ffda] transition-colors text-sm font-sans"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz} className="bg-[#0a192f] text-white">
                      {tz}
                    </option>
                  ))}
                </select>
                {fieldErrors.timezone && (
                  <p className="mt-1 text-xs text-red-400 font-mono">{fieldErrors.timezone}</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="savingsOrigin" className="block text-xs font-mono uppercase tracking-wider text-[#8892b0]">
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-[#64ffda]" />
                    Starting Personal Savings
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setSavingsOrigin('0')}
                  className="text-[11px] font-mono text-[#64ffda]/80 hover:text-[#64ffda] transition-colors"
                >
                  Start at 0 (skip)
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#8892b0]">
                  {currencyCode}
                </span>
                <input
                  id="savingsOrigin"
                  type="number"
                  step="any"
                  min="0"
                  value={savingsOrigin}
                  onChange={(e) => setSavingsOrigin(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-14 pr-4 py-3 bg-[#0a192f] border border-[#233554] rounded-xl text-white placeholder-[#8892b0]/50 focus:outline-none focus:border-[#64ffda] transition-colors text-sm font-mono"
                />
              </div>
              {fieldErrors.personalSavingsOrigin && (
                <p className="mt-1 text-xs text-red-400 font-mono">{fieldErrors.personalSavingsOrigin}</p>
              )}
              <p className="mt-1.5 text-[11px] text-[#8892b0] font-sans">
                This initializes your personal savings ledger with an ORIGIN movement.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={setupMutation.isPending}
                className="w-full py-3.5 px-6 rounded-xl bg-[#64ffda] text-[#0a192f] font-semibold text-sm hover:bg-[#64ffda]/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#64ffda]/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {setupMutation.isPending ? (
                  <span>Initializing your workspace...</span>
                ) : (
                  <>
                    <span>Complete Setup & Enter Workspace</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-[#8892b0]/60 text-xs mt-6 font-mono">
          Connected to SSO account: {session?.email || 'authenticated user'}
        </p>
      </div>
    </main>
  )
}
