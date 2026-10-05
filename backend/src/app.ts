import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { frontendRouter } from './middleware/frontend.js'
import { requestContext } from './middleware/requestContext.js'
import { authRouter } from './routes/auth.routes.js'
import { crmRouter } from './routes/crm.routes.js'
import { healthRouter } from './routes/health.routes.js'
import { publicRouter } from './routes/public.routes.js'

export const app = express()

app.disable('x-powered-by')
app.set('trust proxy', env.trustProxy)
app.use(requestContext)
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'"],
      frameSrc: ['https://www.google.com', 'https://maps.google.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      ...(env.cookieSecure ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  strictTransportSecurity: env.cookieSecure ? { maxAge: 31_536_000, includeSubDomains: true } : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}))
app.use(compression())

app.use('/api', cors({ origin: env.corsOrigins, credentials: true, maxAge: 600 }))
app.use('/api', express.json({ limit: '200kb' }))
app.use('/api', cookieParser())

app.use('/api/health', healthRouter)
app.use('/api', publicRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', (_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store')
  next()
}, crmRouter)
app.use('/api', notFoundHandler)

const frontend = env.serveFrontend ? frontendRouter(env.frontendDist) : null
if (frontend) app.use(frontend)

app.use(notFoundHandler)
app.use(errorHandler)
