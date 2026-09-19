/** Family System V2 scope model (URL + API filters). */

export type AppScope =
  | { kind: 'family' }
  | { kind: 'personal' }

export function parseScopeParam(raw: string | null | undefined): AppScope {
  if (!raw || raw === 'family') return { kind: 'family' }
  // Legacy URLs: personal and global both map to the single personal account.
  if (raw === 'personal' || raw === 'global') return { kind: 'personal' }
  return { kind: 'family' }
}

export function scopeToParam(scope: AppScope): string {
  switch (scope.kind) {
    case 'family':
      return 'family'
    case 'personal':
      return 'personal'
  }
}

export function scopeLabel(scope: AppScope): string {
  switch (scope.kind) {
    case 'family':
      return 'Family'
    case 'personal':
      return 'Personal'
  }
}

/** Query params for list endpoints that support scope filtering. */
export function scopeListParams(_scope: AppScope): Record<string, string> {
  return {}
}

/** Whether entity rows tagged is_personal should be shown for this scope. */
export function scopeShowsPersonal(scope: AppScope): boolean {
  return scope.kind === 'personal'
}

export function scopeShowsFamily(scope: AppScope): boolean {
  return scope.kind === 'family'
}

/** Legacy family/personal tab split on pages not yet fully scope-aware. */
export function scopeToViewMode(scope: AppScope): 'family' | 'personal' {
  return scope.kind === 'personal' ? 'personal' : 'family'
}
