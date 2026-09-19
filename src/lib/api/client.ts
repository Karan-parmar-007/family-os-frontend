/**
 * Low-level fetch client for the FastAPI backend.
 *
 * Responsibilities:
 *  - Always send cookies (access / refresh / csrf live in httpOnly cookies).
 *  - Attach the CSRF token header on mutating requests (double-submit pattern).
 *  - Parse JSON responses and normalise errors into `ApiError`.
 *  - Transparently refresh the access token once on a 401, then retry.
 *  - Detect session-expired signals (X-Session-Expired header) and force logout.
 */
import {
  API_BASE_URL,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  REFRESH_PATH,
  SESSION_EXPIRED_HEADER,
} from './config'
import type { HTTPValidationError } from './types'
import { ssoLoginUrl } from '#/lib/sso'

export class ApiError extends Error {
  readonly status: number
  readonly data: unknown

  constructor(message: string, status: number, data: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/** Thrown when the backend is unreachable (not running, network down, etc.). */
export class NetworkError extends Error {
  readonly cause: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'NetworkError'
    this.cause = cause
  }
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) return true
  if (error instanceof TypeError) {
    return (
      error.message === 'fetch failed' || error.message === 'Failed to fetch'
    )
  }
  return false
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
  if (match) return decodeURIComponent(match.split('=').slice(1).join('='))
  if (name === CSRF_COOKIE_NAME || name === 'csrf_token' || name === 'x-csrf-token') {
    const alt = name === 'csrf_token' ? 'x-csrf-token' : 'csrf_token'
    const altMatch = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${alt}=`))
    if (altMatch) return decodeURIComponent(altMatch.split('=').slice(1).join('='))
  }
  return null
}

function clearCookie(name: string, path = '/') {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`
}

function extractErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const maybe = body as Partial<HTTPValidationError> & {
      message?: string
      detail?: unknown
    }
    if (typeof maybe.message === 'string') return maybe.message
    if (typeof maybe.detail === 'string') return maybe.detail
    if (Array.isArray(maybe.detail) && maybe.detail.length > 0) {
      return maybe.detail
        .map((d) => d.msg)
        .filter(Boolean)
        .join(', ')
    }
  }
  return `Request failed with status ${status}`
}

/** Check if a response signals that the session has been terminated. */
function isSessionExpired(res: Response): boolean {
  return res.headers.get(SESSION_EXPIRED_HEADER) === 'true'
}

/* ------------------------------------------------------------------ */
/* Force logout — debounced so concurrent requests don't race          */
/* ------------------------------------------------------------------ */

let forceLogoutInProgress = false

/** Guest-reachable paths — never hard-reload these on auth failure (avoids /me↔/refresh loops). */
const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/signup',
  '/forgot-password',
])

/**
 * Terminate the client session: clear CSRF cookie and leave protected routes.
 * Only runs once even if called concurrently. Does not reload when already on
 * a public page (home probes /users/me while logged out).
 */
function forceLogout(): void {
  if (typeof window === 'undefined') return
  if (forceLogoutInProgress) return
  forceLogoutInProgress = true

  // Clear the non-httpOnly CSRF cookie (httpOnly cookies are already
  // cleared by the backend Set-Cookie headers in the response).
  clearCookie(CSRF_COOKIE_NAME, '/')

  const { pathname } = window.location
  clearCookie('csrf_token', '/')
  clearCookie('x-csrf-token', '/')

  if (PUBLIC_PATHS.has(pathname)) {
    // Stay put — full reload here re-runs useCurrentUser and loops forever.
    forceLogoutInProgress = false
    return
  }

  // Redirect to SSO login
  window.location.replace(ssoLoginUrl(pathname))
}

/* ------------------------------------------------------------------ */
/* Request options & URL builder                                       */
/* ------------------------------------------------------------------ */

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** JSON body. Serialised automatically; mutually exclusive with `body`. */
  json?: unknown
  /** Raw body (e.g. FormData). Use when Content-Type must not be set to application/json. */
  body?: BodyInit | null
  /** Query params appended to the URL. */
  params?: Record<string, string | number | boolean | undefined | null>
  /** Internal: skip the auto-refresh-and-retry loop (used by refresh itself). */
  skipAuthRefresh?: boolean
}

function resolveFetchBase(): string {
  if (API_BASE_URL) return API_BASE_URL
  if (typeof window !== 'undefined') return window.location.origin
  if (typeof process !== 'undefined' && process.env.API_BASE_URL) {
    return process.env.API_BASE_URL
  }
  return 'http://localhost:8003'
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const base = resolveFetchBase()

  const url = new URL(path, base.endsWith('/') ? base : `${base}/`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

/* ------------------------------------------------------------------ */
/* Token refresh — single-flight guard                                 */
/* ------------------------------------------------------------------ */

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const csrf = readCookie(CSRF_COOKIE_NAME)
        const refreshBase = resolveFetchBase()
        const refreshUrl = new URL(REFRESH_PATH, `${refreshBase}/`).toString()
        const res = await fetch(refreshUrl, {
          method: 'POST',
          credentials: 'include',
          headers: csrf ? { [CSRF_HEADER_NAME]: csrf } : undefined,
        })

        // If the refresh response itself says session expired, force logout.
        if (isSessionExpired(res)) {
          forceLogout()
          return false
        }

        return res.ok
      } catch {
        return false
      } finally {
        // allow the next failure to trigger a fresh refresh
        setTimeout(() => {
          refreshPromise = null
        }, 0)
      }
    })()
  }
  return refreshPromise
}

/* ------------------------------------------------------------------ */
/* Response parser                                                     */
/* ------------------------------------------------------------------ */

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return res.json().catch(() => null)
  }
  return res.text().catch(() => null)
}

/* ------------------------------------------------------------------ */
/* Main fetch function                                                 */
/* ------------------------------------------------------------------ */

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { json, params, skipAuthRefresh, headers, ...rest } = options
  const method = (rest.method ?? 'GET').toUpperCase()

  const finalHeaders = new Headers(headers)
  if (json !== undefined) {
    finalHeaders.set('Content-Type', 'application/json')
  }
  if (MUTATING_METHODS.has(method)) {
    const csrf = readCookie(CSRF_COOKIE_NAME)
    if (csrf) finalHeaders.set(CSRF_HEADER_NAME, csrf)
  }

  const init: RequestInit = {
    ...rest,
    method,
    credentials: 'include',
    headers: finalHeaders,
    body:
      json !== undefined ? JSON.stringify(json) : (rest as RequestInit).body,
  }

  let res: Response
  try {
    res = await fetch(buildUrl(path, params), init)
  } catch (cause) {
    throw new NetworkError(
      'Unable to reach the API. Make sure the backend is running on port 8003.',
      cause,
    )
  }

  // ── Session-expired on any response (e.g. CSRF middleware killed it) ──
  if (isSessionExpired(res)) {
    forceLogout()
    throw new ApiError('Session expired', res.status)
  }

  // ── 401 handling: try silent refresh, then retry once ──
  if (res.status === 401 && !skipAuthRefresh && path !== REFRESH_PATH) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      // CSRF cookie may have rotated; rebuild the header.
      if (MUTATING_METHODS.has(method)) {
        const csrf = readCookie(CSRF_COOKIE_NAME)
        if (csrf) finalHeaders.set(CSRF_HEADER_NAME, csrf)
      }
      try {
        res = await fetch(buildUrl(path, params), init)
      } catch (cause) {
        throw new NetworkError(
          'Unable to reach the API. Make sure the backend is running on port 8003.',
          cause,
        )
      }

      // If the retried response also says session expired, force logout.
      if (isSessionExpired(res)) {
        forceLogout()
        throw new ApiError('Session expired', res.status)
      }
    } else {
      // Refresh failed → session is dead → force logout.
      forceLogout()
      throw new ApiError('Session expired — refresh failed', 401)
    }
  }

  const body = await parseBody(res)

  if (!res.ok) {
    throw new ApiError(extractErrorMessage(res.status, body), res.status, body)
  }

  return body as T
}
