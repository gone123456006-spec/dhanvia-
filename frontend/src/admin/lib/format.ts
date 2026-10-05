const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const numberFormatter = new Intl.NumberFormat('en-IN')
const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' })
const timeFormatter = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' })
const relativeFormatter = new Intl.RelativeTimeFormat('en-IN', { numeric: 'auto' })

export const formatCurrency = (value?: number | null) => currencyFormatter.format(value ?? 0)
export const formatNumber = (value?: number | null) => numberFormatter.format(value ?? 0)
export const formatPercent = (value?: number | null) => `${(value ?? 0).toFixed(1).replace(/\.0$/, '')}%`

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value?: string | Date | null): string {
  const date = toDate(value)
  return date ? dateFormatter.format(date) : '—'
}

export function formatDateTime(value?: string | Date | null): string {
  const date = toDate(value)
  if (!date) return '—'
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return `Today, ${timeFormatter.format(date)}`
  const tomorrow = new Date(today.getTime() + 86_400_000)
  if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${timeFormatter.format(date)}`
  const yesterday = new Date(today.getTime() - 86_400_000)
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeFormatter.format(date)}`
  return dateTimeFormatter.format(date)
}

export function formatRelative(value?: string | Date | null, now = Date.now()): string {
  const date = toDate(value)
  if (!date) return '—'
  const seconds = Math.round((date.getTime() - now) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 45) return 'just now'
  if (abs < 3600) return relativeFormatter.format(Math.round(seconds / 60), 'minute')
  if (abs < 86_400) return relativeFormatter.format(Math.round(seconds / 3600), 'hour')
  if (abs < 86_400 * 30) return relativeFormatter.format(Math.round(seconds / 86_400), 'day')
  return formatDate(date)
}

export function formatDuration(totalSeconds?: number | null): string {
  const seconds = Math.max(0, Math.round(totalSeconds ?? 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  if (hours) return `${hours}h ${minutes}m`
  if (minutes) return `${minutes}m ${String(rest).padStart(2, '0')}s`
  return `${rest}s`
}

export function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`
}

/** Value for <input type="datetime-local"> in the browser's local timezone. */
export function toLocalInput(value?: string | Date | null): string {
  const date = toDate(value)
  if (!date) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function fromLocalInput(value: string): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function isoDay(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export interface DateRangeValue {
  from: string
  to: string
}

export const dateRangePresets: Array<{ label: string; range: () => DateRangeValue }> = [
  { label: 'Today', range: () => ({ from: isoDay(new Date()), to: isoDay(new Date()) }) },
  { label: '7 days', range: () => ({ from: isoDay(new Date(Date.now() - 6 * 86_400_000)), to: isoDay(new Date()) }) },
  { label: 'This month', range: () => { const now = new Date(); return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: isoDay(now) } } },
  { label: 'Last month', range: () => { const now = new Date(); return { from: isoDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: isoDay(new Date(now.getFullYear(), now.getMonth(), 0)) } } },
  { label: '90 days', range: () => ({ from: isoDay(new Date(Date.now() - 89 * 86_400_000)), to: isoDay(new Date()) }) },
]

export function defaultRange(): DateRangeValue {
  return dateRangePresets[2].range()
}

export function initials(name?: string | null): string {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

export function isOverdue(value?: string | null, now = Date.now()): boolean {
  const date = toDate(value)
  return Boolean(date && date.getTime() < now)
}

export function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 3_600_000)
}

export function isToday(value?: string | null): boolean {
  const date = toDate(value)
  return Boolean(date && date.toDateString() === new Date().toDateString())
}

export function humanize(value?: string | null): string {
  if (!value) return '—'
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
