// src/lib/sso.ts
const UNAUTHENTICATED_EVENT = "fos:unauthenticated"

export function ssoLoginUrl(returnPath = "/"): string {
  const sso = import.meta.env.VITE_SSO_URL || "http://localhost:5173"
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:1577"
  const next = `${origin}${returnPath}`
  const url = new URL("/login", sso)
  url.searchParams.set("next", next)
  return url.toString()
}

export function notifyUnauthenticated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(UNAUTHENTICATED_EVENT))
  }
}

export function onUnauthenticated(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(UNAUTHENTICATED_EVENT, handler)
  return () => window.removeEventListener(UNAUTHENTICATED_EVENT, handler)
}
