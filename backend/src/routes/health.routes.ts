import { Router } from 'express'
import { getHealth, getLiveness } from '../controllers/health.controller.js'

export const healthRouter = Router()

healthRouter.get('/', getHealth)
healthRouter.get('/live', getLiveness)
