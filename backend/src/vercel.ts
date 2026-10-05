import express from 'express'
import { app } from './app.js'
import { connectDatabase } from './config/database.js'
import { logger } from './utils/logger.js'

/**
 * Vercel entrypoint: the API runs as a function, so there is no listener or
 * in-process scheduler (reminders run via Vercel Cron at /api/cron/reminders).
 * The MongoDB connection is opened on the first request and reused while the
 * instance stays warm.
 */
let databaseReady: Promise<void> | null = null

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
  next()
})
handler.use(app)

export default handler
