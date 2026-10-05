import { setServers } from 'node:dns'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'

if (existsSync('.env')) {
  process.loadEnvFile('.env')
}

// Some routers advertise an IPv6 link-local DNS server that Node cannot use for the SRV lookup behind mongodb+srv:// URIs.
const dnsServers = (process.env.DNS_SERVERS ?? '').split(',').map((server) => server.trim()).filter(Boolean)
if (dnsServers.length) setServers(dnsServers)

const list = (fallback: string) => z.string().default(fallback).transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
const flag = z.enum(['true', 'false']).transform((value) => value === 'true')

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  HOST: z.string().default('0.0.0.0'),
  MONGODB_URI: z.string({ error: 'Missing required environment variable: MONGODB_URI' }).regex(/^mongodb(\+srv)?:\/\//, 'MONGODB_URI must start with mongodb:// or mongodb+srv://'),
  MONGODB_DB_NAME: z.string().min(1).default('dhanvia'),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().int().min(1).max(500).default(20),
  CORS_ORIGIN: list('http://localhost:5173'),
  TRUST_PROXY: z.string().default('1'),
  APP_TIMEZONE: z.string().default('Asia/Kolkata'),
  SESSION_TTL_DAYS: z.coerce.number().min(1).max(90).default(7),
  COOKIE_SECURE: flag.optional(),
  REMINDER_INTERVAL_MINUTES: z.coerce.number().min(1).max(1440).default(5),
  RUN_JOBS: flag.default(true),
  SERVE_FRONTEND: flag.optional(),
  FRONTEND_DIST: z.string().default('../frontend/dist'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(15_000),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  const problems = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n')
  throw new Error(`Invalid environment configuration:\n${problems}`)
}

const values = parsed.data
const isProduction = values.NODE_ENV === 'production'

try {
  new Intl.DateTimeFormat('en-IN', { timeZone: values.APP_TIMEZONE })
} catch {
  throw new Error(`Invalid environment configuration:\n  - APP_TIMEZONE: "${values.APP_TIMEZONE}" is not a valid IANA timezone`)
}

function parseTrustProxy(value: string): boolean | number | string {
  if (value === 'true') return true
  if (value === 'false') return false
  return /^\d+$/.test(value) ? Number(value) : value
}

export const env = {
  nodeEnv: values.NODE_ENV,
  isProduction,
  port: values.PORT,
  host: values.HOST,
  mongoUri: values.MONGODB_URI,
  mongoDbName: values.MONGODB_DB_NAME,
  mongoMaxPoolSize: values.MONGODB_MAX_POOL_SIZE,
  corsOrigins: values.CORS_ORIGIN,
  trustProxy: parseTrustProxy(values.TRUST_PROXY),
  timezone: values.APP_TIMEZONE,
  sessionTtlDays: values.SESSION_TTL_DAYS,
  cookieSecure: values.COOKIE_SECURE ?? isProduction,
  reminderIntervalMinutes: values.REMINDER_INTERVAL_MINUTES,
  runJobs: values.RUN_JOBS,
  serveFrontend: values.SERVE_FRONTEND ?? isProduction,
  frontendDist: resolve(values.FRONTEND_DIST),
  logLevel: values.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  shutdownTimeoutMs: values.SHUTDOWN_TIMEOUT_MS,
}

if (isProduction && !env.cookieSecure) {
  console.warn('[config] COOKIE_SECURE=false in production: admin session cookies will be sent over plain HTTP. Only do this behind a trusted HTTPS proxy on a private network.')
}
