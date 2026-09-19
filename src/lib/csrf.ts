// src/lib/csrf.ts
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(^|;\s*)csrf_token=([^;]+)/)
  if (match) return decodeURIComponent(match[2])
  const fallback = document.cookie.match(/(^|;\s*)x-csrf-token=([^;]+)/)
  return fallback ? decodeURIComponent(fallback[2]) : null
}
