import type { Request, Response } from 'express'
import { closedStages } from '../domain/enums.js'
import { currentUser, hasPermission } from '../middleware/auth.js'
import { CallModel } from '../models/call.model.js'
import { LeadModel } from '../models/lead.model.js'
import { TaskModel } from '../models/task.model.js'
import { canViewAllLeads, toObjectId } from '../services/access.js'
import { endOfDay, parseDateRange, startOfDay } from '../utils/time.js'
import { pageQuerySchema } from '../validation/schemas.js'
import { paged } from './helpers.js'

const leadSummary = 'leadId name phone email service stage status priority interest score lastInteractionAt lastInteractionSummary callAttempts connectedCalls followUpAt assignedTo'

export async function callQueue(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const agent = typeof request.query.agent === 'string' && request.query.agent && hasPermission(user, 'viewTeam')
    ? toObjectId(request.query.agent)
    : user._id

  const [due, upcoming, untouched, todayStats] = await Promise.all([
    TaskModel.find({ assignedTo: agent, status: 'open', type: { $in: ['call', 'follow_up'] }, dueAt: { $lte: endOfDay() } })
      .sort({ dueAt: 1 }).limit(200).populate('lead', leadSummary).lean(),
    TaskModel.find({ assignedTo: agent, status: 'open', type: { $in: ['call', 'follow_up'] }, dueAt: { $gt: endOfDay() } })
      .sort({ dueAt: 1 }).limit(50).populate('lead', leadSummary).lean(),
    LeadModel.find({ assignedTo: agent, archived: false, callAttempts: 0, stage: { $nin: closedStages } })
      .select(leadSummary).sort({ score: -1, createdAt: 1 }).limit(50).lean(),
    CallModel.aggregate([
      { $match: { agent, startedAt: { $gte: startOfDay(), $lte: endOfDay() } } },
      { $group: { _id: null, calls: { $sum: 1 }, connected: { $sum: { $cond: ['$connected', 1, 0] } }, talkTime: { $sum: '$durationSeconds' } } },
    ]),
  ])

  const queuedLeadIds = new Set(due.map((task) => String((task.lead as { _id?: unknown } | null)?._id)))
  response.json({
    due: due.filter((task) => task.lead),
    upcoming: upcoming.filter((task) => task.lead),
    untouched: untouched.filter((lead) => !queuedLeadIds.has(String(lead._id))),
    today: todayStats[0] ?? { calls: 0, connected: 0, talkTime: 0 },
  })
}

export async function callHistory(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const { page, limit } = pageQuerySchema.parse(request.query)
  const { from, to } = parseDateRange(request.query.from, request.query.to)
  const filter: Record<string, unknown> = { startedAt: { $gte: from, $lte: to } }
  if (typeof request.query.outcome === 'string' && request.query.outcome) filter.outcome = request.query.outcome
  if (!canViewAllLeads(user)) {
    const assigned = await LeadModel.find({ assignedTo: user._id }).distinct('_id')
    filter.$or = [{ agent: user._id }, { lead: { $in: assigned } }]
  } else if (typeof request.query.agent === 'string' && request.query.agent) {
    filter.agent = toObjectId(request.query.agent)
  }
  const [items, total] = await Promise.all([
    CallModel.find(filter).sort({ startedAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate('agent', 'name').populate('lead', 'leadId name service stage').lean(),
    CallModel.countDocuments(filter),
  ])
  response.json(paged(items, total, page, limit))
}
