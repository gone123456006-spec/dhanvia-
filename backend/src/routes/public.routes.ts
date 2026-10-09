import { Router } from 'express'
import { createSupportRequest, createWebsiteLead, getPublicSocialLinks } from '../controllers/public.controller.js'
import { formSubmissionLimiter } from '../middleware/rateLimits.js'

export const publicRouter = Router()

publicRouter.get('/social-links', getPublicSocialLinks)
publicRouter.post('/leads', formSubmissionLimiter, createWebsiteLead)
publicRouter.post('/support-requests', formSubmissionLimiter, createSupportRequest)
