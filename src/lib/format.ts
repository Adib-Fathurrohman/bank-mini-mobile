// Money is integer Rupiah; API timestamps are UTC ISO strings shown in WIB.
// Same rules as the staff web app (front-end/src/lib/money.ts, datetime.ts).

const grouping = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

export function formatRupiah(amount: number): string {
  const formatted = `Rp${grouping.format(Math.abs(amount))}`
  return amount < 0 ? `-${formatted}` : formatted
}

export const TIME_ZONE = 'Asia/Jakarta'

const dateTimeFormat = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** `2026-10-27T13:10:36Z` → `27 Okt 2026, 20.10 WIB` */
export function formatDateTime(iso: string): string {
  return `${dateTimeFormat.format(new Date(iso))} WIB`
}

const ymdFormat = new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })

/** `2026-11-02` → `2 Nov 2026` (a calendar date; no time zone shift) */
export function formatYmd(ymd: string): string {
  const [year, month, day] = ymd.split('-').map(Number)
  return ymdFormat.format(new Date(Date.UTC(year!, month! - 1, day!)))
}

/** Today's date in WIB as `YYYY-MM-DD`. */
export function jakartaToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(now)
}

export function isInFuture(iso: string | null | undefined, now: Date = new Date()): boolean {
  return iso != null && new Date(iso).getTime() > now.getTime()
}

/** `m:ss` for a countdown. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/** First and last day (`YYYY-MM-DD`) of the month `offset` months from `today`. */
export function monthRange(today: string, offset = 0): { from: string; to: string } {
  const [year, month] = today.split('-').map(Number)
  const first = new Date(Date.UTC(year!, month! - 1 + offset, 1))
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0))
  const ymd = (d: Date) => d.toISOString().slice(0, 10)
  const to = ymd(last) > today ? today : ymd(last)
  return { from: ymd(first), to }
}
