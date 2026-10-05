import type { Types } from 'mongoose'
import { closedStages } from '../domain/enums.js'
import { CallModel } from '../models/call.model.js'
import { LeadModel } from '../models/lead.model.js'
import { PaymentModel } from '../models/payment.model.js'
import { TaskModel } from '../models/task.model.js'
import { UserModel } from '../models/user.model.js'
import { endOfDay, startOfDay } from '../utils/time.js'

type Range = { from: Date; to: Date }
type CountMap = Map<string, Record<string, number>>

function toMap(rows: Array<{ _id: unknown } & Record<string, number>>): CountMap {
  return new Map(rows.map(({ _id, ...rest }) => [String(_id), rest as Record<string, number>]))
}

const rate = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0)

export async function employeePerformance(range: Range, userIds?: Types.ObjectId[]) {
  const userFilter: Record<string, unknown> = userIds ? { _id: { $in: userIds } } : { active: true }
  const users = await UserModel.find(userFilter).select('name employeeCode role dailyCallTarget active').sort({ name: 1 }).lean()
  const ids = users.map((user) => user._id)
  const now = new Date()
  const today = { from: startOfDay(), to: endOfDay() }

  const [calls, callsToday, followUps, conversions, cohort, revenue, workload, openLeads] = await Promise.all([
    CallModel.aggregate([
      { $match: { agent: { $in: ids }, startedAt: { $gte: range.from, $lte: range.to } } },
      { $group: {
        _id: '$agent',
        calls: { $sum: 1 },
        connected: { $sum: { $cond: ['$connected', 1, 0] } },
        interested: { $sum: { $cond: [{ $eq: ['$outcome', 'interested'] }, 1, 0] } },
        talkTime: { $sum: '$durationSeconds' },
      } },
    ]),
    CallModel.aggregate([
      { $match: { agent: { $in: ids }, startedAt: { $gte: today.from, $lte: today.to } } },
      { $group: { _id: '$agent', calls: { $sum: 1 } } },
    ]),
    TaskModel.aggregate([
      { $match: { completedBy: { $in: ids }, type: 'follow_up', status: 'done', completedAt: { $gte: range.from, $lte: range.to } } },
      { $group: { _id: '$completedBy', followUps: { $sum: 1 } } },
    ]),
    LeadModel.aggregate([
      { $match: { assignedTo: { $in: ids }, convertedAt: { $gte: range.from, $lte: range.to } } },
      { $group: { _id: '$assignedTo', conversions: { $sum: 1 } } },
    ]),
    LeadModel.aggregate([
      { $match: { assignedTo: { $in: ids }, createdAt: { $gte: range.from, $lte: range.to } } },
      { $group: { _id: '$assignedTo', assigned: { $sum: 1 }, converted: { $sum: { $cond: [{ $ifNull: ['$convertedAt', false] }, 1, 0] } } } },
    ]),
    PaymentModel.aggregate([
      { $match: { collectedBy: { $in: ids }, status: 'paid', paidAt: { $gte: range.from, $lte: range.to } } },
      { $group: { _id: '$collectedBy', revenue: { $sum: '$amount' } } },
    ]),
    TaskModel.aggregate([
      { $match: { assignedTo: { $in: ids }, status: 'open' } },
      { $group: { _id: '$assignedTo', openTasks: { $sum: 1 }, overdue: { $sum: { $cond: [{ $lt: ['$dueAt', now] }, 1, 0] } } } },
    ]),
    LeadModel.aggregate([
      { $match: { assignedTo: { $in: ids }, archived: false, stage: { $nin: closedStages } } },
      { $group: { _id: '$assignedTo', openLeads: { $sum: 1 }, hot: { $sum: { $cond: [{ $eq: ['$interest', 'hot'] }, 1, 0] } } } },
    ]),
  ])

  const maps = [calls, callsToday.map((row) => ({ _id: row._id, callsToday: row.calls })), followUps, conversions, cohort, revenue, workload, openLeads].map(toMap)
  return users.map((user) => {
    const key = String(user._id)
    const merged = Object.assign({}, ...maps.map((map) => map.get(key) ?? {})) as Record<string, number>
    const get = (field: string) => merged[field] ?? 0
    return {
      id: key,
      name: user.name,
      employeeCode: user.employeeCode,
      role: user.role,
      active: user.active,
      dailyCallTarget: user.dailyCallTarget,
      callsToday: get('callsToday'),
      targetProgress: rate(get('callsToday'), user.dailyCallTarget),
      calls: get('calls'),
      connected: get('connected'),
      connectRate: rate(get('connected'), get('calls')),
      talkTime: get('talkTime'),
      followUps: get('followUps'),
      interested: get('interested'),
      conversions: get('conversions'),
      revenue: get('revenue'),
      leadsAssigned: get('assigned'),
      conversionRate: rate(get('converted'), get('assigned')),
      openLeads: get('openLeads'),
      hotLeads: get('hot'),
      openTasks: get('openTasks'),
      overdueTasks: get('overdue'),
    }
  })
}
