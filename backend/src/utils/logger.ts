import { env } from '../config/env.js'

type Level = 'debug' | 'info' | 'warn' | 'error'
type Fields = Record<string, unknown>

const levels: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }
const threshold = levels[env.logLevel]

function serializeError(error: unknown): unknown {
  if (!(error instanceof Error)) return error
  return { name: error.name, message: error.message, stack: error.stack, ...('code' in error ? { code: error.code } : {}) }
}

function write(level: Level, message: string, fields: Fields = {}): void {
  if (levels[level] < threshold) return
  const normalized = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, key === 'error' || key === 'err' ? serializeError(value) : value]))
  const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout
  if (env.isProduction) {
    stream.write(`${JSON.stringify({ time: new Date().toISOString(), level, msg: message, ...normalized })}\n`)
    return
  }
  const { error, ...rest } = normalized
  const extras = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : ''
  stream.write(`${new Date().toLocaleTimeString('en-IN', { hour12: false })} ${level.toUpperCase().padEnd(5)} ${message}${extras}\n`)
  if (error) stream.write(`${(error as { stack?: string }).stack ?? JSON.stringify(error)}\n`)
}

export const logger = {
  debug: (message: string, fields?: Fields) => write('debug', message, fields),
  info: (message: string, fields?: Fields) => write('info', message, fields),
  warn: (message: string, fields?: Fields) => write('warn', message, fields),
  error: (message: string, fields?: Fields) => write('error', message, fields),
}
