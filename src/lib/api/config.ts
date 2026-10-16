/**
 * Central API configuration.
 *
 * Auth is owned by SSO: it sets the httpOnly `access_token` cookie (sent to
 * this API) plus a double-submit CSRF cookie. Because the token lives in a
 * cookie, every request must be sent with credentials included.
 */

/**
 * In the browser, use same-origin (`''`) so Vite (dev) or Caddy (prod)
 * can route `/api/familyos` and `/api/auth`. SSR talks to the backend
 * via `API_BASE_URL` (Docker) or localhost:8003 (dev). Set
 * `VITE_API_BASE_URL` to override both.
 */
function resolveApiBaseUrl(): string {
  const fromVite = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (import.meta.env.SSR) {
    const fromRuntime =
      typeof process !== 'undefined' ? process.env.API_BASE_URL : undefined
    return (fromRuntime || fromVite || 'http://localhost:8003').replace(
      /\/+$/,
      '',
    )
  }
  return (fromVite ?? '').replace(/\/+$/, '')
}

const rawBaseUrl = resolveApiBaseUrl()

/** Backend origin, without a trailing slash. Empty string = same-origin. */
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '')

/** Prefix shared by every backend route. */
export const API_PREFIX = '/api/familyos'

/**
 * Name of the non-httpOnly cookie SSO sets with the CSRF token.
 * The value is echoed back in the `X-CSRF-Token` header on mutating requests
 * (double-submit cookie pattern).
 */
export const CSRF_COOKIE_NAME = 'csrf_token'

/** Header used to send the CSRF token back to the server. */
export const CSRF_HEADER_NAME = 'X-CSRF-Token'
