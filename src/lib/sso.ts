// src/lib/sso.ts
const UNAUTHENTICATED_EVENT = "fos:unauthenticated"

function publicAppOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  const baked = String(import.meta.env.VITE_APP_URL ?? "").trim()
  if (baked) return baked.replace(/\/$/, "")
  const runtime =
    typeof process !== "undefined" ? String(process.env.APP_URL ?? "").trim() : ""
  if (runtime) return runtime.replace(/\/$/, "")
  return "http://localhost:1577"
}

export function ssoLoginUrl(returnPath = "/"): string {
  const sso = import.meta.env.VITE_SSO_URL || "http://localhost:5173"
  const path = returnPath.startsWith("/") ? returnPath : `/${returnPath}`
  const next = `${publicAppOrigin()}${path}`
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
