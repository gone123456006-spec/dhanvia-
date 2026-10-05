import type { Request, Response } from 'express'
import { closedStages, leadStages } from '../domain/enums.js'
import { currentUser, hasPermission } from '../middleware/auth.js'
import { ActivityModel } from '../models/activity.model.js'
import { CallModel } from '../models/call.model.js'
import { LeadModel } from '../models/lead.model.js'
import { NotificationModel } from '../models/notification.model.js'
import { PaymentModel } from '../models/payment.model.js'
import { TaskModel } from '../models/task.model.js'
import { canViewAllLeads, leadScope } from '../services/access.js'
import { employeePerformance } from '../services/analytics.js'
import { endOfDay, parseDateRange, startOfDay } from '../utils/time.js'
import { percent } from './helpers.js'

export async function dashboard(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const range = parseDateRange(request.query.from, request.query.to)
  const all = canViewAllLeads(user)
  const scope = { ...leadScope(user), archived: false }
  const taskScope = all ? {} : { assignedTo: user._id }
  const callScope = all ? {} : { agent: user._id }
  const now = new Date()
  const today = { $gte: startOfDay(), $lte: endOfDay() }
  const scopedLeadIds = all ? null : await LeadModel.find(leadScope(user)).distinct('_id')
  const paymentScope = scopedLeadIds ? { lead: { $in: scopedLeadIds } } : {}

  const [
    newLeadsToday, uncontacted, callsToday, connectedToday, pendingCalls, followUpsToday, overdueTasks, hotLeads,
    convertedInRange, createdInRange, convertedFromCohort, revenue, pendingRevenue, stageCounts,
    myTasks, recentActivity, reminders,
  ] = await Promise.all([
    LeadModel.countDocuments({ ...scope, createdAt: today }),
    LeadModel.countDocuments({ ...scope, stage: 'new' }),
    CallModel.countDocuments({ ...callScope, startedAt: today }),
    CallModel.countDocuments({ ...callScope, startedAt: today, connected: true }),
    TaskModel.countDocuments({ ...taskScope, type: 'call', status: 'open', dueAt: { $lte: endOfDay() } }),
    TaskModel.countDocuments({ ...taskScope, type: 'follow_up', status: 'open', dueAt: today }),
    TaskModel.countDocuments({ ...taskScope, status: 'open', dueAt: { $lt: now } }),
    LeadModel.countDocuments({ ...scope, interest: 'hot', stage: { $nin: closedStages } }),
    LeadModel.countDocuments({ ...leadScope(user), convertedAt: { $gte: range.from, $lte: range.to } }),
    LeadModel.countDocuments({ ...leadScope(user), createdAt: { $gte: range.from, $lte: range.to } }),
    LeadModel.countDocuments({ ...leadScope(user), createdAt: { $gte: range.from, $lte: range.to }, convertedAt: { $ne: null } }),
    PaymentModel.aggregate([{ $match: { ...paymentScope, status: 'paid', paidAt: { $gte: range.from, $lte: range.to } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    PaymentModel.aggregate([{ $match: { ...paymentScope, status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    LeadModel.aggregate([{ $match: scope }, { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$dealValue' } } }]),
    TaskModel.find({ assignedTo: user._id, status: 'open', dueAt: { $lte: endOfDay() } }).sort({ dueAt: 1 }).limit(8)
      .populate('lead', 'leadId name phone service').lean(),
    ActivityModel.find(scopedLeadIds ? { lead: { $in: scopedLeadIds } } : { lead: { $exists: true } })
      .sort({ createdAt: -1 }).limit(12).populate('actor', 'name').populate('lead', 'leadId name').lean(),
    NotificationModel.find({ user: user._id, readAt: null }).sort({ createdAt: -1 }).limit(6).populate('lead', 'leadId name').lean(),
  ])

  const stageMap = new Map(stageCounts.map((row) => [row._id as string, row]))
  const performance = hasPermission(user, 'viewTeam') ? await employeePerformance(range) : null

  response.json({
    range,
    generatedAt: now,
    metrics: {
      newLeadsToday,
      uncontacted,
      callsToday,
      connectedToday,
      pendingCalls,
      followUpsToday,
      overdueTasks,
      hotLeads,
      convertedLeads: convertedInRange,
      revenue: revenue[0]?.total ?? 0,
      pendingRevenue: pendingRevenue[0]?.total ?? 0,
      pendingPayments: pendingRevenue[0]?.count ?? 0,
      leadsCreated: createdInRange,
      conversionRate: percent(convertedFromCohort, createdInRange),
    },
    pipeline: leadStages.map((stage) => ({ stage, count: stageMap.get(stage)?.count ?? 0, value: stageMap.get(stage)?.value ?? 0 })),
    myTasks,
    recentActivity,
    reminders,
    performance,
  })
}
