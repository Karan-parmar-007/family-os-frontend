import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ssoMock = vi.hoisted(() => ({
  refresh: vi.fn<() => Promise<boolean>>(),
  getSession: vi.fn(),
  redirectToLogin: vi.fn<(returnTo?: string) => void>(),
  csrfToken: vi.fn<() => string | null>(),
}))

vi.mock('#/lib/sso', () => ({ sso: ssoMock, SSO_APP_ID: 'familyos' }))

const { ApiError, apiFetch } = await import('./client')
const { resolveSession } = await import('#/lib/auth/session')

const fetchMock = vi.fn<typeof fetch>()

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function setLocation(pathname: string, search = '') {
  vi.stubGlobal('window', { location: { origin: 'http://app.test', pathname, search } })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  setLocation('/personal/dashboard')
  ssoMock.csrfToken.mockReturnValue('csrf-1')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

describe('apiFetch 401 handling', () => {
  it('refreshes through SSO and retries once', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { detail: 'x' }))
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }))
    ssoMock.refresh.mockResolvedValue(true)

    await expect(apiFetch('/api/familyos/me')).resolves.toEqual({ ok: true })
    expect(ssoMock.refresh).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(ssoMock.redirectToLogin).not.toHaveBeenCalled()
  })

  it('does not loop when the retry is also 401', async () => {
    fetchMock.mockResolvedValue(json(401, { detail: 'nope' }))
    ssoMock.refresh.mockResolvedValue(true)

    await expect(apiFetch('/api/familyos/me')).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(ssoMock.redirectToLogin).not.toHaveBeenCalled()
  })

  it('sends signed-out users on protected pages to SSO login', async () => {
    setLocation('/families', '?tab=all')
    fetchMock.mockResolvedValue(json(401, { detail: 'x' }))
    ssoMock.refresh.mockResolvedValue(false)

    await expect(apiFetch('/api/familyos/me')).rejects.toBeInstanceOf(ApiError)
    expect(ssoMock.redirectToLogin).toHaveBeenCalledWith('/families?tab=all')
  })

  it('does not redirect on public pages', async () => {
    setLocation('/')
    fetchMock.mockResolvedValue(json(401, { detail: 'x' }))
    ssoMock.refresh.mockResolvedValue(false)

    await expect(apiFetch('/api/familyos/me')).rejects.toMatchObject({ status: 401 })
    expect(ssoMock.redirectToLogin).not.toHaveBeenCalled()
  })

  it('sends the CSRF header on mutations only', async () => {
    fetchMock.mockResolvedValue(json(200, {}))
    await apiFetch('/api/familyos/x', { method: 'POST', json: {} })
    await apiFetch('/api/familyos/x')
    const [post, get] = fetchMock.mock.calls
    expect(new Headers(post[1]?.headers).get('X-CSRF-Token')).toBe('csrf-1')
    expect(new Headers(get[1]?.headers).get('X-CSRF-Token')).toBeNull()
  })
})

describe('resolveSession', () => {
  it('returns anonymous without calling the app API when SSO says signed out', async () => {
    ssoMock.getSession.mockResolvedValue({ authenticated: false, user: null, session_id: null })
    const session = await resolveSession()
    expect(session.authenticated).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('loads the Family OS profile for a signed-in user (single-flight)', async () => {
    const user = { id: 'u1', email: 'u@test.com', role_name: 'user', app_roles: { familyos: ['admin'] } }
    ssoMock.getSession.mockResolvedValue({ authenticated: true, user, session_id: 's1' })
    fetchMock.mockImplementation(() =>
      Promise.resolve(json(200, { authenticated: true, isOwner: false, isAdmin: true, profile: null })),
    )

    const [a, b] = await Promise.all([resolveSession(), resolveSession()])
    expect(a).toBe(b)
    expect(a.authenticated).toBe(true)
    expect(a.ssoUser).toEqual(user)
    expect(ssoMock.getSession).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/familyos/auth/session')
  })
})
