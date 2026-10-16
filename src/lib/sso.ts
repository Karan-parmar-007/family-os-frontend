// src/lib/sso.ts
// The one SSO client for Family OS. Browser calls go same-origin to
// /api/auth/* (Vite proxy in dev, Caddy in prod) — never through the app API.
import { createSsoClient } from '#/lib/sso/sso-client'

/** Family OS client id in SSO (app-scoped roles, e.g. `{ familyos: ['admin'] }`). */
export const SSO_APP_ID = 'familyos'

/**
 * Origin used for `?next=` return URLs when rendering on the server
 * (the browser uses `window.location.origin`).
 */
function serverAppOrigin(): string | undefined {
  if (typeof window !== 'undefined') return undefined
  const baked = String(import.meta.env.VITE_APP_URL ?? '').trim()
  const runtime =
    typeof process !== 'undefined' ? String(process.env.APP_URL ?? '').trim() : ''
  return baked || runtime || 'http://localhost:1577'
}

export const sso = createSsoClient({
  ssoUrl: import.meta.env.VITE_SSO_URL || 'http://localhost:5173',
  appOrigin: serverAppOrigin(),
})
