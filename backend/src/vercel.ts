import { waitUntil } from '@vercel/functions'
import express from 'express'
import { app } from './app.js'
import { connectDatabase } from './config/database.js'
import { env } from './config/env.js'
import { runReminderSweep } from './jobs/reminders.js'
import { logger } from './utils/logger.js'

/**
 * Vercel entrypoint: the API runs as a function, so there is no listener or
 * in-process scheduler. Reminders run from Vercel Cron (/api/cron/reminders)
 * and, because Hobby crons are daily at most, also in the background after
 * requests, at most once per REMINDER_INTERVAL_MINUTES per instance.
 * The MongoDB connection is opened on the first request and reused while the
 * instance stays warm.
 */
let databaseReady: Promise<void> | null = null
let lastSweepAt = 0

function scheduleReminderSweep(): void {
  const now = Date.now()
  if (!env.runJobs || now - lastSweepAt < env.reminderIntervalMinutes * 60_000) return
  lastSweepAt = now
  waitUntil(runReminderSweep())
}

function ensureDatabase(): Promise<void> {
  databaseReady ??= connectDatabase(2).catch((error: unknown) => {
    databaseReady = null
    throw error
  })
  return databaseReady
}

const handler = express()
handler.disable('x-powered-by')
handler.use(async (_request, response, next) => {
  try {
    await ensureDatabase()
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error })
    response.status(503).setHeader('Retry-After', '5').json({ error: 'Service temporarily unavailable. Please try again.' })
    return
  }
  scheduleReminderSweep()
  next()
})
handler.use(app)

export default handler
