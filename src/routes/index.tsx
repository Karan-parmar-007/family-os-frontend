import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRightIcon, UsersIcon, UserRoundIcon, ShieldIcon, TargetIcon, SparklesIcon } from "lucide-react"
import { Logo } from "#/components/brand/logo"
import { Donut } from "#/components/charts/donut"
import { Sparkline } from "#/components/charts/sparkline"
import { Button } from "#/components/ui/button"
import { useCurrentUser } from "#/hooks/api/use-current-user"
import { useSession } from "#/hooks/api/use-session"
import { ssoLoginUrl } from "#/lib/sso"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

const SAVINGS_TREND = [42, 48, 45, 55, 62, 58, 71, 78, 74, 88, 95, 102]
const SPEND_SEGMENTS = [
  { label: "Housing", value: 38, color: "#64ffda" },
  { label: "Food", value: 22, color: "#38bdf8" },
  { label: "Transport", value: 15, color: "#818cf8" },
  { label: "Other", value: 25, color: "#f59e0b" },
]

function LandingPage() {
  const { data: user } = useCurrentUser()
  const { data: session } = useSession()

  const isAuthenticated = Boolean(user || session?.authenticated)
  const appDestination = session?.authenticated && session?.profile === null ? "/setup" : "/personal/dashboard"
  const buttonLabel = session?.authenticated && session?.profile === null ? "Complete Setup" : "Go to Dashboard"

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#ccd6f6] selection:bg-[#64ffda]/20 selection:text-[#64ffda]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#172a45]/80 bg-[#0a192f]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-medium">
                <Link to={appDestination}>{buttonLabel}</Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className="text-[#ccd6f6] hover:bg-[#112240] hover:text-[#64ffda]"
                >
                  <a href={ssoLoginUrl("/")}>Sign in</a>
                </Button>
                <Button
                  asChild
                  className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-medium"
                >
                  <a href={ssoLoginUrl("/")}>Get started</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#64ffda]/30 bg-[#64ffda]/10 px-3 py-1 text-xs font-mono text-[#64ffda]">
              <SparklesIcon className="size-3.5" />
              <span>Unified household finances</span>
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#e6f1ff] sm:text-5xl lg:text-6xl">
              Family money and personal money — clear, separate, never mixed.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#8892b0] sm:text-lg">
              Shared household pools, private savings, insurance, debts, and friend transfers —
              in one calm, minimal workspace your family actually uses.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  className="gap-2 bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold"
                  asChild
                >
                  <Link to={appDestination}>
                    {buttonLabel}
                    <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="gap-2 bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold"
                    asChild
                  >
                    <a href={ssoLoginUrl("/")}>
                      Start free with SSO
                      <ArrowRightIcon className="size-4" />
                    </a>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[#172a45] bg-[#112240]/60 text-[#ccd6f6] hover:border-[#64ffda]/60 hover:text-[#64ffda]"
                    asChild
                  >
                    <a href={ssoLoginUrl("/")}>Sign in</a>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Hero Chart Card */}
          <div className="relative overflow-hidden rounded-2xl border border-[#172a45] bg-[#112240]/80 p-6 shadow-2xl backdrop-blur-sm">
            <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-[#64ffda]/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-[#8892b0]">
                  Savings Trajectory
                </span>
                <span className="inline-flex items-center rounded-full bg-[#64ffda]/10 px-2 py-0.5 font-mono text-xs text-[#64ffda]">
                  +18% YTD
                </span>
              </div>
              <p className="mt-2 font-mono text-3xl font-semibold text-[#e6f1ff] tabular-nums">
                $12,480.00
              </p>
              <div className="mt-6">
                <Sparkline data={SAVINGS_TREND} height={96} stroke="#64ffda" />
              </div>
            </div>
          </div>
        </section>

        {/* Charts & Separation Section */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            {/* Monthly Spend */}
            <article className="rounded-2xl border border-[#172a45] bg-[#112240]/70 p-6 backdrop-blur-sm">
              <p className="font-mono text-xs uppercase tracking-wider text-[#8892b0]">
                Monthly Household Allocation
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-8">
                <Donut
                  segments={SPEND_SEGMENTS}
                  size={150}
                  thickness={14}
                  centerValue="64%"
                  centerLabel="of pool"
                />
                <ul className="flex-1 space-y-2.5 text-sm">
                  {SPEND_SEGMENTS.map((s) => (
                    <li key={s.label} className="flex items-center justify-between text-[#ccd6f6]">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: s.color }} />
                        <span className="text-[#8892b0]">{s.label}</span>
                      </span>
                      <span className="font-mono font-medium tabular-nums">{s.value}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            {/* Two Workspaces */}
            <article className="rounded-2xl border border-[#172a45] bg-[#112240]/70 p-6 backdrop-blur-sm">
              <span className="font-mono text-xs uppercase tracking-wider text-[#64ffda]">
                Two Workspaces, One Platform
              </span>
              <h2 className="mt-2 text-2xl font-bold text-[#e6f1ff]">
                Family or Personal — never mixed up.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#8892b0]">
                Switch contexts cleanly in the navigation. Each mode gives you dedicated tools —
                savings pools, incomes, expenses, and upcoming commitments — strictly isolated.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#172a45] bg-[#0a192f]/60 p-4">
                  <UsersIcon className="size-5 text-[#64ffda]" />
                  <p className="mt-2 font-semibold text-[#e6f1ff]">Family Scope</p>
                  <p className="mt-1 text-xs text-[#8892b0]">
                    Shared pools, transparent expenses, and member permissions.
                  </p>
                </div>
                <div className="rounded-xl border border-[#172a45] bg-[#0a192f]/60 p-4">
                  <UserRoundIcon className="size-5 text-[#38bdf8]" />
                  <p className="mt-2 font-semibold text-[#e6f1ff]">Personal Scope</p>
                  <p className="mt-1 text-xs text-[#8892b0]">
                    Private savings, friends list, and personal records.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="border-y border-[#172a45]/80 bg-[#112240]/30 py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#172a45] bg-[#112240]/50 p-6">
              <TargetIcon className="size-6 text-[#64ffda]" />
              <h3 className="mt-3 text-xl font-bold text-[#e6f1ff]">Real Savings & Ledger Integrity</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#8892b0]">
                Every money move is logged through transparent records. No arbitrary adjustments
                after pool origin: only verified income, expenses, and accepted transfers.
              </p>
            </div>
            <div className="rounded-2xl border border-[#172a45] bg-[#112240]/50 p-6">
              <ShieldIcon className="size-6 text-[#64ffda]" />
              <h3 className="mt-3 text-xl font-bold text-[#e6f1ff]">Secure & Scheduled Clock</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#8892b0]">
                Recurring bills and insurance EMIs apply cleanly at 18:00 in your family timezone.
                Documents and sensitive credentials rest in encrypted vaults.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-[#e6f1ff] sm:text-4xl">
            Built for modern, intentional households
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-[#8892b0]">
            Sign in with your unified SSO account to access your family finances.
          </p>
          <div className="mt-8 flex justify-center">
            {isAuthenticated ? (
              <Button
                size="lg"
                className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold"
                asChild
              >
                <Link to={appDestination}>{buttonLabel}</Link>
              </Button>
            ) : (
              <Button
                size="lg"
                className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold"
                asChild
              >
                <a href={ssoLoginUrl("/")}>Get started with SSO</a>
              </Button>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#172a45] py-8 text-center font-mono text-xs text-[#8892b0]">
        © {new Date().getFullYear()} FamilyOS. Unified family and personal finances.
      </footer>
    </div>
  )
}
