/** App-wide Family vs Personal workspace context (sidebar shows only one at a time). */

export type AppWorkspace = 'family' | 'personal'

const STORAGE_KEY = 'familyOs.activeWorkspace'

export function getStoredWorkspace(): AppWorkspace {
  if (typeof window === 'undefined') return 'family'
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw === 'personal' ? 'personal' : 'family'
}

export function setStoredWorkspace(workspace: AppWorkspace): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, workspace)
}

/** Infer workspace from the current path (Personal routes always win). */
export function workspaceFromPath(pathname: string): AppWorkspace | null {
  if (pathname.startsWith('/personal')) return 'personal'
  return null
}

export function resolveWorkspace(pathname: string, searchScope?: string | null): AppWorkspace {
  const fromPath = workspaceFromPath(pathname)
  if (fromPath) return fromPath
  if (searchScope === 'personal') return 'personal'
  if (searchScope === 'family') return 'family'
  return getStoredWorkspace()
}
