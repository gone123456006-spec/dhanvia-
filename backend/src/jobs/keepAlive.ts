import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const REQUEST_TIMEOUT_MS = 10_000

let currentPing: Promise<void> | null = null

async function ping(url: string): Promise<void> {
  const startedAt = Date.now()
  const timestamp = new Date(startedAt).toISOString()
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': 'dhanvia-keep-alive', 'cache-control': 'no-cache' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    await response.body?.cancel()
    const fields = { timestamp, url, status: response.status, durationMs: Date.now() - startedAt }
    if (response.ok) logger.info('Keep-alive ping', fields)
    else logger.warn('Keep-alive ping returned non-2xx', fields)
  } catch (error) {
    logger.warn('Keep-alive ping failed', { timestamp, url, durationMs: Date.now() - startedAt, error })
  }
}

function runPing(url: string): void {
  // A slow ping must not stack up behind the next tick.
  if (currentPing) return
  currentPing = ping(url).finally(() => {
    currentPing = null
  })
}

/** Pings the service's public health URL so the host does not idle it out; the returned stop function waits for any in-flight ping. */
export function startKeepAlive(): () => Promise<void> {
  const url = env.keepAliveUrl
  if (!url) {
    logger.info('Keep-alive disabled (no KEEP_ALIVE_URL or RENDER_EXTERNAL_URL)')
    return async () => {}
  }
  const intervalMs = env.keepAliveIntervalSeconds * 1000
  logger.info('Keep-alive started', { url, intervalSeconds: env.keepAliveIntervalSeconds })
  const initial = setTimeout(() => runPing(url), 5_000)
  const timer = setInterval(() => runPing(url), intervalMs)
  return async () => {
    clearTimeout(initial)
    clearInterval(timer)
    await currentPing
  }
}
