import { useLocation, useNavigate } from '@tanstack/react-router'
import {
  parseScopeParam,
  scopeToParam,
  type AppScope,
} from '#/lib/scope'
import { setStoredWorkspace } from '#/lib/app-context'

function readScopeFromSearch(search: Record<string, unknown>, pathname: string): AppScope {
  if (pathname.startsWith('/personal')) return { kind: 'personal' }
  const scopeParam = search.scope
  if (typeof scopeParam === 'string' && scopeParam) return parseScopeParam(scopeParam)
  if (search.view === 'personal') return { kind: 'personal' }
  return { kind: 'family' }
}

export function useScope() {
  const location = useLocation()
  const navigate = useNavigate()
  const scope = readScopeFromSearch(
    location.search as Record<string, unknown>,
    location.pathname,
  )

  const setScope = (next: AppScope) => {
    setStoredWorkspace(next.kind === 'personal' ? 'personal' : 'family')
    const search = { ...(location.search as Record<string, unknown>) }
    search.scope = scopeToParam(next)
    delete search.view
    navigate({ to: location.pathname, search, replace: true })
  }

  return { scope, setScope }
}
