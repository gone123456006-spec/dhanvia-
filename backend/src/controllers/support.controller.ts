import type { Request, Response } from 'express'
import { currentUser } from '../middleware/auth.js'
import { HttpError } from '../middleware/errorHandler.js'
import { SupportRequestModel } from '../models/supportRequest.model.js'
import { toObjectId } from '../services/access.js'
import { logActivity } from '../services/activity.js'
import { pageQuerySchema, updateSupportRequestSchema } from '../validation/schemas.js'
import { escapeRegex, paged } from './helpers.js'

export async function listSupportRequests(request: Request, response: Response): Promise<void> {
  const { page, limit, status, search } = pageQuerySchema.parse(request.query)
  const filter: Record<string, unknown> = {}
  if (status) filter.status = status
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i')
    filter.$or = ['ticketNumber', 'name', 'email', 'phone', 'message'].map((field) => ({ [field]: pattern }))
  }
  const [items, total, counts] = await Promise.all([
    SupportRequestModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate('lead', 'leadId').populate('handledBy', 'name').lean(),
    SupportRequestModel.countDocuments(filter),
    SupportRequestModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ])
  response.json({ ...paged(items, total, page, limit), counts: Object.fromEntries(counts.map((row) => [row._id, row.count])) })
}

export async function updateSupportRequest(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const input = updateSupportRequestSchema.parse(request.body)
  const ticket = await SupportRequestModel.findById(toObjectId(request.params.id))
  if (!ticket) throw new HttpError(404, 'Support request not found')
  const previous = { status: ticket.status, notes: ticket.notes }
  Object.assign(ticket, input, { handledBy: user._id })
  await ticket.save()
  await logActivity({
    lead: ticket.lead ?? undefined, actor: user._id, action: 'support_request_updated',
    previousValue: previous, newValue: { status: ticket.status, notes: ticket.notes },
    notes: ticket.ticketNumber, entityType: 'support_request', entityId: ticket._id,
  })
  response.json({ ticket: await SupportRequestModel.findById(ticket._id).populate('lead', 'leadId').populate('handledBy', 'name').lean() })
}
