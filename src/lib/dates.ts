function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Today as a `<input type="date">` value in the browser's time zone. */
export function todayInput(): string {
  return isoToInput(new Date().toISOString())
}

/** ISO timestamp to a local `YYYY-MM-DD` input value. */
export function isoToInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * A picked calendar day as an ISO timestamp. Uses local noon so the day never
 * shifts across a time-zone boundary; the backend snaps it to 18:00.
 */
export function inputToIso(value: string): string {
  return new Date(`${value}T12:00:00`).toISOString()
}

/** Last moment of a picked calendar day, for inclusive "to" filters. */
export function inputToEndOfDayIso(value: string): string {
  return new Date(`${value}T23:59:59.999`).toISOString()
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
