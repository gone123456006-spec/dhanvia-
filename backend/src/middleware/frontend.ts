import { existsSync } from 'node:fs'
import { join } from 'node:path'
import express, { type NextFunction, type Request, type Response, type Router } from 'express'
import { logger } from '../utils/logger.js'

/** Serves the Vite build (public site + admin panel) with SPA fallbacks; returns null when no build is present. */
export function frontendRouter(distDirectory: string): Router | null {
  const siteIndex = join(distDirectory, 'index.html')
  const adminIndex = join(distDirectory, 'admin', 'index.html')
  if (!existsSync(siteIndex)) {
    logger.warn('Frontend build not found, serving API only', { distDirectory })
    return null
  }

  const router = express.Router()
  router.use(express.static(distDirectory, {
    index: 'index.html',
    setHeaders(response, filePath) {
      if (filePath.includes(`${join(distDirectory, 'assets')}`)) response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      else if (filePath.endsWith('.html')) response.setHeader('Cache-Control', 'no-cache')
      else response.setHeader('Cache-Control', 'public, max-age=86400')
    },
  }))

  router.use((request: Request, response: Response, next: NextFunction) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') return next()
    if (request.path.startsWith('/api/') || request.path === '/api') return next()
    if (/\.[a-z0-9]+$/i.test(request.path)) return next()
    response.setHeader('Cache-Control', 'no-cache')
    const isAdmin = request.path === '/admin' || request.path.startsWith('/admin/')
    response.sendFile(isAdmin && existsSync(adminIndex) ? adminIndex : siteIndex)
  })

  logger.info('Serving frontend build', { distDirectory })
  return router
}
