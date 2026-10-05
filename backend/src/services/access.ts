import { Types } from 'mongoose'
import { hasPermission, type AuthUser } from '../middleware/auth.js'
import { HttpError } from '../middleware/errorHandler.js'
import { LeadModel } from '../models/lead.model.js'

export function canViewAllLeads(user: AuthUser): boolean {
  return hasPermission(user, 'viewAllLeads')
}

/** Mongo filter restricting leads to those the user may access. */
export function leadScope(user: AuthUser): Record<string, unknown> {
  return canViewAllLeads(user) ? {} : { assignedTo: user._id }
}

export function toObjectId(id: unknown, label = 'identifier'): Types.ObjectId {
  if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) throw new HttpError(400, `Invalid ${label}`)
  return new Types.ObjectId(id)
}

export async function loadAccessibleLead(user: AuthUser, leadId: unknown) {
  const lead = await LeadModel.findOne({ _id: toObjectId(leadId, 'lead id'), ...leadScope(user) })
  if (!lead) throw new HttpError(404, 'Lead not found or not assigned to you')
  return lead
}

/** Lead ids the user may access, for scoping related collections (calls, tasks, payments). */
export async function accessibleLeadFilter(user: AuthUser, field = 'lead'): Promise<Record<string, unknown>> {
  if (canViewAllLeads(user)) return {}
  const ids = await LeadModel.find({ assignedTo: user._id }).distinct('_id')
  return { [field]: { $in: ids } }
}
