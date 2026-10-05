import { timingSafeEqual } from 'node:crypto'
import { Router, type Request, type Response } from 'express'
import { env } from '../config/env.js'
import { runReminderSweep } from '../jobs/reminders.js'
import { HttpError } from '../middleware/errorHandler.js'

export const cronRouter = Router()

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; without a configured secret the routes stay disabled. */
function assertCronRequest(request: Request): void {
  if (!env.cronSecret) throw new HttpError(404, 'Not found')
  const expected = Buffer.from(`Bearer ${env.cronSecret}`)
  const received = Buffer.from(request.get('authorization') ?? '')
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new HttpError(401, 'Unauthorized')
  }
}

cronRouter.get('/reminders', async (request: Request, response: Response) => {
  assertCronRequest(request)
  const startedAt = Date.now()
  await runReminderSweep()
  response.setHeader('Cache-Control', 'no-store')
  response.json({ status: 'ok', durationMs: Date.now() - startedAt })
})
