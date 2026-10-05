import type { Request, Response } from 'express'
import { isDatabaseConnected } from '../config/database.js'

let shuttingDown = false
const version = (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.RENDER_GIT_COMMIT ?? process.env.GIT_COMMIT ?? 'dev').slice(0, 7)
const startedAt = new Date().toISOString()

export function markShuttingDown(): void {
  shuttingDown = true
}

export function getLiveness(_request: Request, response: Response): void {
  response.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) })
}

export function getHealth(_request: Request, response: Response): void {
  const database = isDatabaseConnected() ? 'connected' : 'disconnected'
  const ready = database === 'connected' && !shuttingDown
  response.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'unavailable',
    service: 'dhanvia-api',
    version,
    startedAt,
    database,
    ...(shuttingDown ? { shuttingDown: true } : {}),
  })
}
