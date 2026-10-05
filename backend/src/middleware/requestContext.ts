import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { logger } from '../utils/logger.js'

declare module 'express-serve-static-core' {
  interface Request {
    id: string
  }
}

const incomingId = /^[A-Za-z0-9._-]{8,128}$/

export function requestContext(request: Request, response: Response, next: NextFunction): void {
  const header = request.get('x-request-id')
  request.id = header && incomingId.test(header) ? header : randomUUID()
  response.setHeader('X-Request-Id', request.id)

  const started = process.hrtime.bigint()
  response.on('finish', () => {
    if (!request.originalUrl.startsWith('/api')) return
    const status = response.statusCode
    const fields = {
      requestId: request.id,
      method: request.method,
      path: request.originalUrl.split('?')[0],
      status,
      durationMs: Math.round(Number(process.hrtime.bigint() - started) / 1e5) / 10,
      ip: request.ip,
    }
    if (status >= 500) logger.error('request failed', fields)
    else if (status >= 400) logger.warn('request rejected', fields)
    else if (request.originalUrl.startsWith('/api/health')) logger.debug('request', fields)
    else logger.info('request', fields)
  })
  next()
}
