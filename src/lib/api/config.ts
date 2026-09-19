/**
 * Central API configuration.
 *
 * The FastAPI backend uses OAuth 2.0 with httpOnly cookies for the access &
 * refresh tokens, plus a double-submit CSRF token. Because tokens live in
 * cookies, every request must be sent with credentials included.
 */

/**
 * In the browser, use same-origin (`''`) so Vite (dev) or Caddy (prod)
 * can route `/api/familyos` and `/api/auth`. SSR talks to the backend
 * on port 8003. Set `VITE_API_BASE_URL` to override.
 */
const rawBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.SSR ? 'http://localhost:8003' : '')

/** Backend origin, without a trailing slash. Empty string = same-origin. */
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '')

/** Prefix shared by every backend route. */
export const API_PREFIX = '/api/familyos'

/**
 * Name of the non-httpOnly cookie the backend sets with the CSRF token.
 * The value is echoed back in the `X-CSRF-Token` header on mutating requests
 * (double-submit cookie pattern).
 */
export const CSRF_COOKIE_NAME = 'csrf_token'

/** Header used to send the CSRF token back to the server. */
export const CSRF_HEADER_NAME = 'X-CSRF-Token'

/** Endpoint used to silently mint a fresh access token from the refresh token. */
export const REFRESH_PATH = '/api/auth/refresh'

/** Endpoint used to revoke the refresh token on explicit logout. */
export const LOGOUT_PATH = '/api/auth/logout'

/**
 * Response header the backend sets when it terminates a session
 * (CSRF failure, refresh token expired, etc.).
 */
export const SESSION_EXPIRED_HEADER = 'x-session-expired'

