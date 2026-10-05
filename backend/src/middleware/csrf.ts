import type { NextFunction, Request, Response } from 'express'
import { HttpError } from './errorHandler.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Cross-site forms cannot set custom headers, so requiring one blocks CSRF on cookie-authenticated routes. */
export function requireCsrfHeader(request: Request, _response: Response, next: NextFunction): void {
  if (!SAFE_METHODS.has(request.method) && request.get('x-requested-with') !== 'dhanvia-admin') {
    throw new HttpError(403, 'Missing request verification header')
  }
  next()
}
