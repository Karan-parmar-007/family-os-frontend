import { Link, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { AppShell } from "#/components/layout/app-shell"
import { Button } from "#/components/ui/button"
import { usePersonalFamilyId } from "#/hooks/use-personal-family-id"
import { setStoredWorkspace } from "#/lib/app-context"

type PersonalFeature =
  | "dashboard"
  | "savings"
  | "insurance"
  | "assets"
  | "upcoming"
  | "vault"

const FEATURE_HREF: Record<PersonalFeature, (familyId: string) => string> = {
  dashboard: (id) => `/dashboard/${id}?scope=personal`,
  savings: (id) => `/savings/${id}?scope=personal`,
  insurance: (id) => `/insurance/${id}?scope=personal`,
  assets: (id) => `/assets/${id}?scope=personal`,
  upcoming: (id) => `/upcoming/${id}?scope=personal`,
  vault: (id) => `/vault/${id}?scope=personal`,
}

/** Thin personal entry: lock workspace to personal and open the shared page with scope=personal. */
export function PersonalFeatureRedirect({ feature }: { feature: PersonalFeature }) {
  const familyId = usePersonalFamilyId()
  const navigate = useNavigate()

  useEffect(() => {
    setStoredWorkspace("personal")
  }, [])

  useEffect(() => {
    if (!familyId) return
    const href = FEATURE_HREF[feature](familyId)
    // Use TanStack Router navigation instead of raw window.history.replaceState
    navigate({ to: href as any, replace: true })
  }, [familyId, feature, navigate])

  if (!familyId) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-border p-6 text-center">
          <h1 className="text-xl font-semibold">Join a family first</h1>
          <p className="text-sm text-muted-foreground">
            Personal features use your household for categories and context. Create or join a
            family, then come back here.
          </p>
          <Button asChild>
            <Link to="/families">Go to Families</Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell familyId={familyId}>
      <p className="text-sm text-muted-foreground">Opening personal {feature.replace("-", " ")}…</p>
    </AppShell>
  )
}
