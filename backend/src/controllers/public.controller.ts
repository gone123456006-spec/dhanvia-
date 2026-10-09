import type { Request, Response } from 'express'
import { getSettings } from '../models/settings.model.js'
import { SupportRequestModel } from '../models/supportRequest.model.js'
import { createLead } from '../services/leadLifecycle.js'
import { logger } from '../utils/logger.js'
import { createSupportRequestSchema, createWebsiteLeadSchema } from '../validation/schemas.js'

const WEBSITE_SOURCE = 'Website'
const LEAD_THANK_YOU = 'Thank you! Our expert will contact you shortly.'
const formLabels: Record<string, string> = {
  'home-offer': 'Home page consultation form',
  'service-detail-hero': 'Service page consultation form',
  'service-detail': 'Service page consultation form',
  other: 'Website form',
}

// Bots get the normal success response so they don't learn to skip the trap field.
function isBot(request: Request, honeypot: string | undefined): boolean {
  if (!honeypot) return false
  logger.warn('Dropped bot form submission', { requestId: request.id, path: request.path, ip: request.ip })
  return true
}

export async function createWebsiteLead(request: Request, response: Response): Promise<void> {
  const input = createWebsiteLeadSchema.parse(request.body)
  if (isBot(request, input.website)) {
    response.status(201).json({ id: null, message: LEAD_THANK_YOU })
    return
  }
  const detail = [formLabels[input.source ?? 'other'], input.pagePath].filter(Boolean).join(' · ')
  const { lead } = await createLead(
    {
      name: input.name,
      phone: input.phone,
      callingCode: input.callingCode,
      email: input.email,
      service: input.service,
      source: WEBSITE_SOURCE,
      sourceDetail: detail,
    },
    { id: null, origin: 'website' },
  )
  response.status(201).json({
    id: lead.leadId,
    message: LEAD_THANK_YOU,
  })
}

export async function createSupportRequest(request: Request, response: Response): Promise<void> {
  const input = createSupportRequestSchema.parse(request.body)
  if (isBot(request, input.website)) {
    response.status(201).json({ id: null, ticketNumber: null, message: 'Your support request has been received.' })
    return
  }
  const { website: _website, ...fields } = input
  const supportRequest = await SupportRequestModel.create(fields)

  if (input.salesConsultation) {
    const { lead } = await createLead(
      {
        name: input.name,
        phone: input.phone,
        email: input.email,
        service: 'Sales consultation',
        source: WEBSITE_SOURCE,
        sourceDetail: `Contact form · Ticket ${supportRequest.ticketNumber}`,
        notes: input.message,
      },
      { id: null, origin: 'website' },
    )
    supportRequest.lead = lead._id
    await supportRequest.save()
  }

  response.status(201).json({
    id: supportRequest.id,
    ticketNumber: supportRequest.ticketNumber,
    message: `Your support request has been received. Ticket number: ${supportRequest.ticketNumber}`,
  })
}

// Only the "Dhanvia" entry is public; the other social accounts in Settings belong to other brands.
export async function getPublicSocialLinks(_request: Request, response: Response): Promise<void> {
  const settings = await getSettings()
  const account = settings.socialAccounts.find(({ name }) => name.trim().toLowerCase() === 'dhanvia')
  response.set('Cache-Control', 'public, max-age=300')
  response.json({
    instagram: account?.instagram || '',
    facebook: account?.facebook || '',
    youtube: account?.youtube || '',
    linkedin: account?.linkedin || '',
    twitter: account?.twitter || '',
  })
}
