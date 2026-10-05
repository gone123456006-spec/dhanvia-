import { Router } from 'express'
import { changePassword, login, logout, me } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { requireCsrfHeader } from '../middleware/csrf.js'
import { loginLimiter } from '../middleware/rateLimits.js'

export const authRouter = Router()

authRouter.use(requireCsrfHeader)
authRouter.post('/login', loginLimiter, login)
authRouter.post('/logout', logout)
authRouter.get('/me', requireAuth, me)
authRouter.post('/change-password', requireAuth, changePassword)
