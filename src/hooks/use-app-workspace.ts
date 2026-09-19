import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import {
  getStoredWorkspace,
  resolveWorkspace,
  setStoredWorkspace,
  type AppWorkspace,
} from '#/lib/app-context'

function lastFamilyId(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return localStorage.getItem('lastFamilyId') ?? undefined
}

export function useAppWorkspace() {
  const location = useLocation()
  const navigate = useNavigate()
  const search = location.search as Record<string, unknown>
  const scopeParam = typeof search.scope === 'string' ? search.scope : null

  const workspace = useMemo(
    () => resolveWorkspace(location.pathname, scopeParam),
    [location.pathname, scopeParam],
  )

  const setWorkspace = useCallback(
    (next: AppWorkspace) => {
      setStoredWorkspace(next)
      const familyId = lastFamilyId()
      if (next === 'personal') {
        navigate({ to: '/personal/dashboard' })
        return
      }
      if (familyId) {
        navigate({
          to: '/dashboard/$familyId',
          params: { familyId },
          search: { scope: 'family' },
        })
        return
      }
      navigate({ to: '/families' })
    },
    [navigate],
  )

  return {
    workspace,
    setWorkspace,
    /** Prefer stored value before path inference settles (SSR-safe default). */
    storedWorkspace: getStoredWorkspace(),
  }
}
