import { env } from '../config/env.js'

const DAY_MS = 86_400_000

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') }
}

function offsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

export function startOfDay(date: Date = new Date(), timeZone = env.timezone): Date {
  const p = zonedParts(date, timeZone)
  const guess = Date.UTC(p.year, p.month - 1, p.day)
  return new Date(guess - offsetMs(new Date(guess), timeZone))
}

export function endOfDay(date: Date = new Date(), timeZone = env.timezone): Date {
  return new Date(startOfDay(new Date(startOfDay(date, timeZone).getTime() + DAY_MS + 3_600_000), timeZone).getTime() - 1)
}

export function startOfMonth(date: Date = new Date(), timeZone = env.timezone): Date {
  const p = zonedParts(date, timeZone)
  const guess = Date.UTC(p.year, p.month - 1, 1)
  return new Date(guess - offsetMs(new Date(guess), timeZone))
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000)
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/** Parses `from`/`to` (YYYY-MM-DD or ISO) into an inclusive range in the app timezone. Defaults to the current month. */
export function parseDateRange(from?: unknown, to?: unknown): { from: Date; to: Date } {
  const parse = (value: unknown) => {
    if (typeof value !== 'string' || !value) return undefined
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date
  }
  const fromDate = parse(from)
  const toDate = parse(to)
  return {
    from: fromDate ? startOfDay(fromDate) : startOfMonth(),
    to: toDate ? endOfDay(toDate) : endOfDay(),
  }
}

export function dayKey(date: Date, timeZone = env.timezone): string {
  const p = zonedParts(date, timeZone)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}
