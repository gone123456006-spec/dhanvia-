import type { Request, Response } from 'express'
import { ActivityModel } from '../models/activity.model.js'
import { UserModel } from '../models/user.model.js'
import { toObjectId } from '../services/access.js'
import { parseDateRange } from '../utils/time.js'
import { activityLogQuerySchema } from '../validation/schemas.js'
import { paged } from './helpers.js'

const SIGN_IN_ACTIONS = ['signed_in', 'password_changed']

/** Team-wide audit trail: who changed what, filterable by person, role and date. */
export async function activityLog(request: Request, response: Response): Promise<void> {
  const query = activityLogQuerySchema.parse(request.query)
  const range = parseDateRange(query.from, query.to)
  const filter: Record<string, unknown> = { createdAt: { $gte: range.from, $lte: range.to }, actor: { $ne: null } }

  if (query.actor) filter.actor = toObjectId(query.actor)
  else if (query.role) filter.actor = { $in: await UserModel.find({ customRole: toObjectId(query.role) }).distinct('_id') }

  const kind = query.kind ?? 'changes'
  if (kind === 'changes') filter.action = { $nin: SIGN_IN_ACTIONS }
  else if (kind === 'sign_ins') filter.action = { $in: SIGN_IN_ACTIONS }

  const [items, total] = await Promise.all([
    ActivityModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit)
      .populate({ path: 'actor', select: 'name employeeCode role customRole', populate: { path: 'customRole', select: 'name' } })
      .populate('lead', 'leadId name')
      .lean(),
    ActivityModel.countDocuments(filter),
  ])
  response.json(paged(items, total, query.page, query.limit))
}
