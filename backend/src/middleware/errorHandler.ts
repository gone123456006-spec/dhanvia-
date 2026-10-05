import type { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import multer from 'multer'
import { ZodError } from 'zod'
import { logger } from '../utils/logger.js'

export class HttpError extends Error {
  readonly status: number
  readonly details?: Record<string, unknown>

  constructor(status: number, message: string, details?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.details = details
  }
}

export function notFoundHandler(_request: Request, response: Response): void {
  response.status(404).json({ error: 'Not found' })
}

export function errorHandler(error: unknown, request: Request, response: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'Validation failed',
      fields: Object.fromEntries(error.issues.map((issue) => [issue.path.join('.') || 'body', issue.message])),
    })
    return
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({ error: error.message, ...error.details })
    return
  }

  if (error instanceof mongoose.Error.CastError) {
    response.status(400).json({ error: 'Invalid identifier' })
    return
  }

  if (error instanceof mongoose.Error.ValidationError) {
    response.status(400).json({
      error: 'Validation failed',
      fields: Object.fromEntries(Object.entries(error.errors).map(([path, issue]) => [path, issue.message])),
    })
    return
  }

  if (error instanceof multer.MulterError) {
    response.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 10 MB)' : error.message })
    return
  }

  if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 11000) {
    response.status(409).json({ error: 'A record with these details already exists' })
    return
  }

  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'Malformed JSON body' })
    return
  }

  if (typeof error === 'object' && error !== null && 'type' in error && 'status' in error) {
    const status = Number((error as { status: unknown }).status)
    if (status >= 400 && status < 500) {
      response.status(status).json({ error: status === 413 ? 'Request body is too large' : 'Invalid request' })
      return
    }
  }

  logger.error('unhandled request error', { requestId: request.id, method: request.method, path: request.originalUrl.split('?')[0], error })
  if (response.headersSent) return
  response.status(500).json({ error: 'Something went wrong. Please try again later.', requestId: request.id })
}
