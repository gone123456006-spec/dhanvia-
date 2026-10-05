import type { Request, Response } from 'express'
import { env } from '../config/env.js'
import { currentUser } from '../middleware/auth.js'
import { HttpError } from '../middleware/errorHandler.js'
import { CallModel } from '../models/call.model.js'
import { LeadModel } from '../models/lead.model.js'
import { PaymentModel } from '../models/payment.model.js'
import { TaskModel } from '../models/task.model.js'
import { canViewAllLeads, leadScope } from '../services/access.js'
import { employeePerformance } from '../services/analytics.js'
import { parseDateRange } from '../utils/time.js'
import { percent } from './helpers.js'

const day = (field: string) => ({ $dateToString: { format: '%Y-%m-%d', date: `$${field}`, timezone: env.timezone } })

type Range = { from: Date; to: Date }
type Scope = { leads: Record<string, unknown>; leadIds: unknown[] | null; agent: Record<string, unknown> }

async function leadGroupReport(groupField: 'source' | 'service', range: Range, scope: Scope) {
  const rows = await LeadModel.aggregate([
    { $match: { ...scope.leads, createdAt: { $gte: range.from, $lte: range.to } } },
    { $group: {
      _id: `$${groupField}`,
      leads: { $sum: 1 },
      converted: { $sum: { $cond: [{ $ifNull: ['$convertedAt', false] }, 1, 0] } },
      lost: { $sum: { $cond: [{ $eq: ['$stage', 'lost'] }, 1, 0] } },
      hot: { $sum: { $cond: [{ $eq: ['$interest', 'hot'] }, 1, 0] } },
      pipelineValue: { $sum: '$dealValue' },
      revenue: { $sum: '$amountPaid' },
      avgScore: { $avg: '$score' },
    } },
    { $sort: { leads: -1 } },
  ])
  return rows.map((row) => ({
    [groupField]: row._id || 'Unspecified',
    leads: row.leads,
    converted: row.converted,
    lost: row.lost,
    hot: row.hot,
    conversionRate: percent(row.converted, row.leads),
    pipelineValue: row.pipelineValue,
    revenue: row.revenue,
    avgScore: Math.round(row.avgScore ?? 0),
  }))
}

async function callingReport(range: Range, scope: Scope) {
  const match = { ...scope.agent, startedAt: { $gte: range.from, $lte: range.to } }
  const [byOutcome, byDay, totals] = await Promise.all([
    CallModel.aggregate([{ $match: match }, { $group: { _id: '$outcome', calls: { $sum: 1 }, talkTime: { $sum: '$durationSeconds' } } }, { $sort: { calls: -1 } }]),
    CallModel.aggregate([
      { $match: match },
      { $group: { _id: day('startedAt'), calls: { $sum: 1 }, connected: { $sum: { $cond: ['$connected', 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]),
    CallModel.aggregate([
      { $match: match },
      { $group: { _id: null, calls: { $sum: 1 }, connected: { $sum: { $cond: ['$connected', 1, 0] } }, talkTime: { $sum: '$durationSeconds' }, leads: { $addToSet: '$lead' } } },
    ]),
  ])
  const total = totals[0] ?? { calls: 0, connected: 0, talkTime: 0, leads: [] }
  return {
    totals: {
      calls: total.calls,
      connected: total.connected,
      connectRate: percent(total.connected, total.calls),
      talkTime: total.talkTime,
      avgDuration: total.connected ? Math.round(total.talkTime / total.connected) : 0,
      uniqueLeads: total.leads.length,
    },
    rows: byOutcome.map((row) => ({ outcome: row._id, calls: row.calls, share: percent(row.calls, total.calls), talkTime: row.talkTime })),
    series: byDay.map((row) => ({ date: row._id, calls: row.calls, connected: row.connected })),
  }
}

async function followUpReport(range: Range, scope: Scope) {
  const match: Record<string, unknown> = { type: 'follow_up', dueAt: { $gte: range.from, $lte: range.to } }
  if (scope.leadIds) match.lead = { $in: scope.leadIds }
  const now = new Date()
  const rows = await TaskModel.aggregate([
    { $match: match },
    { $group: {
      _id: '$assignedTo',
      scheduled: { $sum: 1 },
      completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
      onTime: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'done'] }, { $lte: ['$completedAt', '$dueAt'] }] }, 1, 0] } },
      overdue: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'open'] }, { $lt: ['$dueAt', now] }] }, 1, 0] } },
      pending: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'open'] }, { $gte: ['$dueAt', now] }] }, 1, 0] } },
      cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
    } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $sort: { scheduled: -1 } },
  ])
  const mapped = rows.map((row) => ({
    employee: row.user[0]?.name ?? 'Unassigned',
    scheduled: row.scheduled,
    completed: row.completed,
    onTime: row.onTime,
    onTimeRate: percent(row.onTime, row.completed),
    overdue: row.overdue,
    pending: row.pending,
    cancelled: row.cancelled,
    completionRate: percent(row.completed, row.scheduled),
  }))
  const sum = (field: keyof (typeof mapped)[number]) => mapped.reduce((total, row) => total + (row[field] as number), 0)
  return {
    totals: { scheduled: sum('scheduled'), completed: sum('completed'), onTime: sum('onTime'), overdue: sum('overdue'), pending: sum('pending'), completionRate: percent(sum('completed'), sum('scheduled')) },
    rows: mapped,
  }
}

async function conversionReport(range: Range, scope: Scope) {
  const created = { ...scope.leads, createdAt: { $gte: range.from, $lte: range.to } }
  const [byStage, byDay, timing] = await Promise.all([
    LeadModel.aggregate([{ $match: created }, { $group: { _id: '$stage', leads: { $sum: 1 }, value: { $sum: '$dealValue' } } }]),
    LeadModel.aggregate([
      { $match: { ...scope.leads, convertedAt: { $gte: range.from, $lte: range.to } } },
      { $group: { _id: day('convertedAt'), conversions: { $sum: 1 }, value: { $sum: '$dealValue' } } },
      { $sort: { _id: 1 } },
    ]),
    LeadModel.aggregate([
      { $match: { ...scope.leads, convertedAt: { $gte: range.from, $lte: range.to } } },
      { $group: { _id: null, avgDays: { $avg: { $divide: [{ $subtract: ['$convertedAt', '$createdAt'] }, 86_400_000] } }, count: { $sum: 1 } } },
    ]),
  ])
  const order = ['new', 'contacted', 'interested', 'follow_up', 'documents', 'processing', 'converted', 'lost']
  const counts = new Map(byStage.map((row) => [row._id, row]))
  const total = byStage.reduce((sum, row) => sum + row.leads, 0)
  const converted = counts.get('converted')?.leads ?? 0
  return {
    totals: {
      leadsCreated: total,
      converted,
      lost: counts.get('lost')?.leads ?? 0,
      conversionRate: percent(converted, total),
      conversionsInRange: timing[0]?.count ?? 0,
      avgDaysToConvert: Math.round((timing[0]?.avgDays ?? 0) * 10) / 10,
    },
    rows: order.map((stage) => ({ stage, leads: counts.get(stage)?.leads ?? 0, share: percent(counts.get(stage)?.leads ?? 0, total), value: counts.get(stage)?.value ?? 0 })),
    series: byDay.map((row) => ({ date: row._id, conversions: row.conversions, value: row.value })),
  }
}

async function revenueReport(range: Range, scope: Scope) {
  const base: Record<string, unknown> = scope.leadIds ? { lead: { $in: scope.leadIds } } : {}
  const paid = { ...base, status: 'paid', paidAt: { $gte: range.from, $lte: range.to } }
  const [byDay, byMethod, byService, pending, refunded] = await Promise.all([
    PaymentModel.aggregate([{ $match: paid }, { $group: { _id: day('paidAt'), revenue: { $sum: '$amount' }, payments: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    PaymentModel.aggregate([{ $match: paid }, { $group: { _id: '$method', revenue: { $sum: '$amount' }, payments: { $sum: 1 } } }, { $sort: { revenue: -1 } }]),
    PaymentModel.aggregate([{ $match: paid }, { $group: { _id: '$service', revenue: { $sum: '$amount' }, payments: { $sum: 1 } } }, { $sort: { revenue: -1 } }]),
    PaymentModel.aggregate([{ $match: { ...base, status: 'pending' } }, { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 }, overdue: { $sum: { $cond: [{ $lt: ['$dueAt', new Date()] }, '$amount', 0] } } } }]),
    PaymentModel.aggregate([{ $match: { ...base, status: 'refunded', updatedAt: { $gte: range.from, $lte: range.to } } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]),
  ])
  const total = byDay.reduce((sum, row) => sum + row.revenue, 0)
  const count = byDay.reduce((sum, row) => sum + row.payments, 0)
  return {
    totals: {
      revenue: total,
      payments: count,
      avgPayment: count ? Math.round(total / count) : 0,
      pendingAmount: pending[0]?.amount ?? 0,
      pendingCount: pending[0]?.count ?? 0,
      overdueAmount: pending[0]?.overdue ?? 0,
      refunded: refunded[0]?.amount ?? 0,
    },
    rows: byService.map((row) => ({ service: row._id || 'Unspecified', revenue: row.revenue, payments: row.payments, share: percent(row.revenue, total) })),
    methods: byMethod.map((row) => ({ method: row._id, revenue: row.revenue, payments: row.payments })),
    series: byDay.map((row) => ({ date: row._id, revenue: row.revenue, payments: row.payments })),
  }
}

export async function report(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const range = parseDateRange(request.query.from, request.query.to)
  const all = canViewAllLeads(user)
  const scope: Scope = {
    leads: leadScope(user),
    leadIds: all ? null : await LeadModel.find(leadScope(user)).distinct('_id'),
    agent: all ? {} : { agent: user._id },
  }

  switch (request.params.type) {
    case 'lead-source': {
      const rows = await leadGroupReport('source', range, scope)
      response.json({ range, rows })
      return
    }
    case 'service': {
      const rows = await leadGroupReport('service', range, scope)
      response.json({ range, rows })
      return
    }
    case 'calling':
      response.json({ range, ...(await callingReport(range, scope)) })
      return
    case 'follow-up':
      response.json({ range, ...(await followUpReport(range, scope)) })
      return
    case 'conversion':
      response.json({ range, ...(await conversionReport(range, scope)) })
      return
    case 'revenue':
      response.json({ range, ...(await revenueReport(range, scope)) })
      return
    case 'employee': {
      const rows = await employeePerformance(range, all ? undefined : [user._id])
      response.json({ range, rows })
      return
    }
    default:
      throw new HttpError(404, 'Unknown report')
  }
}

export async function teamPerformance(request: Request, response: Response): Promise<void> {
  const range = parseDateRange(request.query.from, request.query.to)
  response.json({ range, rows: await employeePerformance(range) })
}
