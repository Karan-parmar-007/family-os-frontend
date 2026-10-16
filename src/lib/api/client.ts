/**
 * Low-level fetch client for the FastAPI backend.
 *
 * Responsibilities:
 *  - Always send cookies (SSO's access token lives in an httpOnly cookie).
 *  - Attach the CSRF token header on mutating requests (double-submit pattern).
 *  - Parse JSON responses and normalise errors into `ApiError`.
 *  - On a 401, refresh the session through SSO (`sso.refresh()`) and retry once;
 *    if the user is signed out, send them to SSO login (except on public pages).
 */
import { API_BASE_URL, CSRF_HEADER_NAME } from './config'
import type { HTTPValidationError } from './types'
import { sso } from '#/lib/sso'
import { SsoNetworkError } from '#/lib/sso/sso-client'

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
  if (error instanceof NetworkError || error instanceof SsoNetworkError) return true
  if (error instanceof TypeError) {
    return (
      error.message === 'fetch failed' || error.message === 'Failed to fetch'
    )
  }
  return false
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

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

/* ------------------------------------------------------------------ */
/* Signed out — debounced so concurrent requests don't race            */
/* ------------------------------------------------------------------ */

let loginRedirectInProgress = false

/** Guest-reachable paths — never redirect these on auth failure (avoids loops). */
const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/signup',
  '/forgot-password',
])

/**
 * The SSO session is gone: send the user to SSO login, coming back to the
 * current page. Stays put on public pages (the home page probes the API while
 * logged out). Runs once even if called concurrently.
 */
function handleSignedOut(): void {
  if (typeof window === 'undefined') return
  if (loginRedirectInProgress) return
  const { pathname, search } = window.location
  if (PUBLIC_PATHS.has(pathname)) return
  loginRedirectInProgress = true
  sso.redirectToLogin(`${pathname}${search}`)
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
  /** Skip the 401 → `sso.refresh()` → retry loop (e.g. the always-200 session probe). */
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
    const csrf = sso.csrfToken()
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

  // ── 401: let SSO refresh the session, then retry once ──
  if (res.status === 401 && !skipAuthRefresh) {
    let signedIn: boolean
    try {
      signedIn = await sso.refresh()
    } catch (cause) {
      throw new NetworkError('Unable to reach the sign-in service.', cause)
    }
    if (!signedIn) {
      handleSignedOut()
      throw new ApiError('Session expired', 401)
    }
    // CSRF cookie may have changed; rebuild the header.
    if (MUTATING_METHODS.has(method)) {
      const csrf = sso.csrfToken()
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
    // A second 401 falls through as an ApiError — no redirect, so a token SSO
    // accepts but this API rejects can't cause a login loop.
  }

  const body = await parseBody(res)

  if (!res.ok) {
    throw new ApiError(extractErrorMessage(res.status, body), res.status, body)
  }

  return body as T
}
