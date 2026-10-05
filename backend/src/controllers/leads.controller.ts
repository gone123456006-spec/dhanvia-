import type { Request, Response } from 'express'
import type { Types } from 'mongoose'
import { closedStages, leadStages, type LeadStage, type LeadStatus, type Priority } from '../domain/enums.js'
import { currentUser, hasPermission, isSuperAdmin, type AuthUser } from '../middleware/auth.js'
import { HttpError } from '../middleware/errorHandler.js'
import { ActivityModel } from '../models/activity.model.js'
import { CallModel } from '../models/call.model.js'
import { ConversationModel } from '../models/conversation.model.js'
import { CustomerModel } from '../models/customer.model.js'
import { LeadDocumentModel } from '../models/document.model.js'
import { LeadModel, type LeadDocument } from '../models/lead.model.js'
import { PaymentModel } from '../models/payment.model.js'
import { ProcessingStepModel } from '../models/processingStep.model.js'
import { TaskModel } from '../models/task.model.js'
import { leadScope, loadAccessibleLead, toObjectId } from '../services/access.js'
import { logActivity } from '../services/activity.js'
import { applyScore, assignLead, changeStage, changeStatus, createLead, refreshNextAction, type Actor } from '../services/leadLifecycle.js'
import { closeOpenTasks, createTask } from '../services/tasks.js'
import { endOfDay, parseDateRange, startOfDay } from '../utils/time.js'
import {
  addNoteSchema,
  assignLeadSchema,
  bulkLeadSchema,
  changeStageSchema,
  changeStatusSchema,
  createLeadSchema,
  leadListQuerySchema,
  pageQuerySchema,
  updateLeadSchema,
} from '../validation/schemas.js'
import { escapeRegex, paged, sendCsv } from './helpers.js'

export function actorFor(user: AuthUser): Actor & { id: Types.ObjectId } {
  return { id: user._id, origin: 'user' }
}

const listFields = 'leadId name phone email service source sourceDetail assignedTo priority interest score stage status dealValue amountPaid lastInteractionAt lastInteractionSummary nextAction nextActionDueAt followUpAt createdAt updatedAt archived customer convertedAt'

function csvList(value?: string): string[] | undefined {
  return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : undefined
}

export function buildLeadFilter(user: AuthUser, query: ReturnType<typeof leadListQuerySchema.parse>): Record<string, unknown> {
  const filter: Record<string, unknown> = { ...leadScope(user) }
  const and: Record<string, unknown>[] = []

  if (query.archived !== 'all') filter.archived = query.archived === 'true'
  const stages = csvList(query.stage)
  if (stages) filter.stage = { $in: stages }
  const statuses = csvList(query.status)
  if (statuses) filter.status = { $in: statuses }
  const priorityList = csvList(query.priority)
  if (priorityList) filter.priority = { $in: priorityList }
  const interests = csvList(query.interest)
  if (interests) filter.interest = { $in: interests }
  if (query.source) filter.source = query.source
  if (query.form === 'consultation') filter.sourceDetail = /consultation form/i
  else if (query.form === 'contact') filter.sourceDetail = /^Contact form/
  if (query.service) filter.service = query.service

  if (query.assignedTo === 'unassigned') and.push({ assignedTo: null })
  else if (query.assignedTo === 'me') and.push({ assignedTo: user._id })
  else if (query.assignedTo) and.push({ assignedTo: toObjectId(query.assignedTo) })

  const now = new Date()
  if (query.followUp === 'today') filter.followUpAt = { $gte: startOfDay(), $lte: endOfDay() }
  else if (query.followUp === 'overdue') filter.followUpAt = { $lt: now }
  else if (query.followUp === 'upcoming') filter.followUpAt = { $gt: endOfDay() }
  else if (query.followUp === 'none') filter.followUpAt = null

  if (query.createdFrom || query.createdTo) {
    const range = parseDateRange(query.createdFrom ?? '2000-01-01', query.createdTo)
    filter.createdAt = { $gte: range.from, $lte: range.to }
  }

  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), 'i')
    const digits = query.q.replace(/\D/g, '')
    and.push({
      $or: [
        { leadId: pattern },
        { name: pattern },
        { email: pattern },
        { service: pattern },
        ...(digits.length >= 4 ? [{ phone: new RegExp(escapeRegex(digits)) }] : []),
      ],
    })
  }
  if (and.length) filter.$and = and
  return filter
}

export async function listLeads(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const query = leadListQuerySchema.parse(request.query)
  const filter = buildLeadFilter(user, query)
  const sortField = query.sort ?? 'createdAt'
  const sort: Record<string, 1 | -1> = { [sortField]: query.order === 'asc' ? 1 : -1, _id: -1 }

  const [items, total] = await Promise.all([
    LeadModel.find(filter).select(listFields).sort(sort).skip((query.page - 1) * query.limit).limit(query.limit)
      .populate('assignedTo', 'name employeeCode').populate('customer', 'customerId').lean(),
    LeadModel.countDocuments(filter),
  ])
  response.json(paged(items, total, query.page, query.limit))
}

export async function exportLeads(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const query = leadListQuerySchema.parse({ ...request.query, page: 1, limit: 1 })
  const ids = typeof request.query.ids === 'string' ? request.query.ids.split(',').filter(Boolean).map((id) => toObjectId(id)) : null
  const filter = ids ? { _id: { $in: ids }, ...leadScope(user) } : buildLeadFilter(user, query)
  const leads = await LeadModel.find(filter).sort({ createdAt: -1 }).limit(20_000)
    .populate<{ assignedTo: { name: string } | null }>('assignedTo', 'name')
    .populate<{ customer: { customerId: string } | null }>('customer', 'customerId').lean()

  await logActivity({ actor: user._id, action: 'leads_exported', newValue: { count: leads.length }, notes: JSON.stringify(request.query).slice(0, 1000) })
  sendCsv(
    response,
    `dhanvia-leads-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Lead ID', 'Customer ID', 'Name', 'Phone', 'Email', 'Service', 'Source', 'Assigned To', 'Priority', 'Interest', 'Score', 'Stage', 'Status', 'Deal Value', 'Amount Paid', 'Last Interaction', 'Next Action', 'Next Action Due', 'Follow-up', 'Created At'],
    leads.map((lead) => [
      lead.leadId, lead.customer?.customerId, lead.name, lead.phone, lead.email, lead.service, lead.source, lead.assignedTo?.name,
      lead.priority, lead.interest, lead.score, lead.stage, lead.status, lead.dealValue, lead.amountPaid, lead.lastInteractionAt,
      lead.nextAction, lead.nextActionDueAt, lead.followUpAt, lead.createdAt,
    ]),
  )
}

export async function pipeline(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const query = leadListQuerySchema.parse({ ...request.query, page: 1, limit: 1 })
  const base = buildLeadFilter(user, { ...query, stage: undefined })
  const perStage = Math.min(Number(request.query.perStage) || 50, 200)

  const columns = await Promise.all(
    leadStages.map(async (stage) => {
      const filter = { ...base, stage }
      const [items, stats] = await Promise.all([
        LeadModel.find(filter).select(listFields).sort({ stageChangedAt: -1 }).limit(perStage).populate('assignedTo', 'name').lean(),
        LeadModel.aggregate([{ $match: filter }, { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$dealValue' } } }]),
      ])
      return { stage, items, count: stats[0]?.count ?? 0, value: stats[0]?.value ?? 0 }
    }),
  )
  response.json({ columns })
}

export async function getLead(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const lead = await loadAccessibleLead(user, request.params.id)
  const [populated, counts, openTasks] = await Promise.all([
    LeadModel.findById(lead._id).populate('assignedTo', 'name email employeeCode phone').populate('customer').populate('createdBy', 'name').lean(),
    Promise.all([
      CallModel.countDocuments({ lead: lead._id }),
      ConversationModel.countDocuments({ lead: lead._id }),
      LeadDocumentModel.countDocuments({ lead: lead._id }),
      LeadDocumentModel.countDocuments({ lead: lead._id, required: true, status: { $in: ['required', 'rejected'] } }),
      TaskModel.countDocuments({ lead: lead._id, status: 'open' }),
      PaymentModel.countDocuments({ lead: lead._id }),
      ProcessingStepModel.countDocuments({ lead: lead._id }),
      ActivityModel.countDocuments({ lead: lead._id }),
    ]),
    TaskModel.find({ lead: lead._id, status: 'open' }).sort({ dueAt: 1 }).limit(5).populate('assignedTo', 'name').lean(),
  ])
  const [calls, conversations, documents, missingDocuments, tasks, payments, processing, activity] = counts
  response.json({
    lead: populated,
    counts: { calls, conversations, documents, missingDocuments, tasks, payments, processing, activity },
    openTasks,
    permissions: {
      canAssign: hasPermission(user, 'assignLeads'),
      canArchive: hasPermission(user, 'archiveLeads'),
      canExport: hasPermission(user, 'exportData'),
      isSuperAdmin: isSuperAdmin(user),
    },
  })
}

export async function createLeadHandler(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const { allowDuplicate, ...input } = createLeadSchema.parse(request.body)
  if (input.assignedTo && input.assignedTo !== user.id && !hasPermission(user, 'assignLeads')) {
    throw new HttpError(403, 'You can only assign new leads to yourself')
  }
  const assignedTo = input.assignedTo ?? (hasPermission(user, 'assignLeads') ? undefined : user.id)
  const { lead } = await createLead({ ...input, assignedTo }, actorFor(user), { allowDuplicate })
  response.status(201).json({ lead })
}

const trackedFields = ['name', 'email', 'service', 'source', 'priority', 'interest', 'dealValue', 'notes'] as const

export async function updateLead(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const lead = await loadAccessibleLead(user, request.params.id)
  const { note, followUpAt, ...input } = updateLeadSchema.parse(request.body)

  const changes: Array<{ field: string; previousValue: unknown; newValue: unknown }> = []
  for (const field of trackedFields) {
    const value = input[field]
    if (value === undefined) continue
    const previous = lead.get(field)
    if (previous === value) continue
    changes.push({ field, previousValue: previous, newValue: value })
    lead.set(field, value)
  }
  if (changes.length) {
    applyScore(lead)
    await lead.save()
    for (const change of changes) {
      await logActivity({
        lead: lead._id, customer: lead.customer, actor: user._id, origin: 'user',
        action: change.field === 'notes' ? 'notes_updated' : 'field_updated', ...change, notes: note,
      })
    }
  }

  if (followUpAt !== undefined) await rescheduleFollowUp(lead, followUpAt, user, note)
  response.json({ lead: await LeadModel.findById(lead._id).populate('assignedTo', 'name').lean(), changed: changes.length })
}

async function rescheduleFollowUp(lead: LeadDocument, followUpAt: Date | null, user: AuthUser, note?: string): Promise<void> {
  const previous = lead.followUpAt ?? null
  if (followUpAt === null) {
    await closeOpenTasks(lead._id, { types: ['follow_up'] }, 'cancelled', user._id, 'Follow-up cleared')
  } else {
    const task = await TaskModel.findOne({ lead: lead._id, type: 'follow_up', status: 'open' }).sort({ dueAt: 1 })
    if (task) {
      task.dueAt = followUpAt
      task.reminderSentAt = undefined
      task.overdueNotifiedAt = undefined
      await task.save()
    } else {
      await createTask({
        lead: lead._id, customer: lead.customer, assignedTo: lead.assignedTo ?? user._id, type: 'follow_up',
        title: `Follow up with ${lead.name}`, dueAt: followUpAt, priority: lead.priority as Priority, createdBy: user._id,
      })
    }
  }
  await logActivity({
    lead: lead._id, customer: lead.customer, actor: user._id, origin: 'user',
    action: 'follow_up_scheduled', field: 'followUpAt', previousValue: previous, newValue: followUpAt, notes: note,
  })
  await refreshNextAction(lead._id)
}

export async function changeLeadStage(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const lead = await loadAccessibleLead(user, request.params.id)
  const { stage, note, lostReason } = changeStageSchema.parse(request.body)
  await changeStage(lead, stage as LeadStage, actorFor(user), { note, lostReason })
  response.json({ lead: await LeadModel.findById(lead._id).populate('assignedTo', 'name').lean() })
}

export async function changeLeadStatus(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const lead = await loadAccessibleLead(user, request.params.id)
  const { status, note } = changeStatusSchema.parse(request.body)
  await changeStatus(lead, status as LeadStatus, actorFor(user), note)
  response.json({ lead: await LeadModel.findById(lead._id).populate('assignedTo', 'name').lean() })
}

export async function assignLeadHandler(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const lead = await loadAccessibleLead(user, request.params.id)
  const { assignedTo, note } = assignLeadSchema.parse(request.body)
  await assignLead(lead, assignedTo ? toObjectId(assignedTo) : null, actorFor(user), note)
  response.json({ lead: await LeadModel.findById(lead._id).populate('assignedTo', 'name').lean() })
}

export async function addLeadNote(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const lead = await loadAccessibleLead(user, request.params.id)
  const { note } = addNoteSchema.parse(request.body)
  await logActivity({ lead: lead._id, customer: lead.customer, actor: user._id, origin: 'user', action: 'note_added', notes: note })
  lead.lastInteractionAt = new Date()
  lead.lastInteractionSummary = `Note · ${note.slice(0, 200)}`
  await lead.save()
  response.status(201).json({ ok: true })
}

export async function bulkUpdateLeads(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const input = bulkLeadSchema.parse(request.body)
  const needed = input.action === 'assign' ? 'assignLeads' : input.action === 'archive' || input.action === 'unarchive' ? 'archiveLeads' : null
  if (needed && !hasPermission(user, needed)) {
    throw new HttpError(403, 'You do not have permission to perform this bulk action')
  }
  if (input.action === 'stage' && !input.stage) throw new HttpError(400, 'Choose a stage')
  if (input.action === 'stage' && input.stage === 'lost' && !input.lostReason) throw new HttpError(400, 'A lost reason is required')
  if (input.action === 'priority' && !input.priority) throw new HttpError(400, 'Choose a priority')
  if (input.action === 'assign' && input.assignedTo === undefined) throw new HttpError(400, 'Choose an employee')

  const leads = await LeadModel.find({ _id: { $in: input.ids.map((id) => toObjectId(id)) }, ...leadScope(user) })
  const actor = actorFor(user)
  const failed: Array<{ leadId: string; error: string }> = []
  let updated = 0

  for (const lead of leads) {
    try {
      if (input.action === 'assign') {
        await assignLead(lead, input.assignedTo ? toObjectId(input.assignedTo) : null, actor, 'Bulk assignment')
      } else if (input.action === 'stage') {
        await changeStage(lead, input.stage!, actor, { note: 'Bulk stage change', lostReason: input.lostReason })
      } else if (input.action === 'priority') {
        if (lead.priority !== input.priority) {
          const previous = lead.priority
          lead.priority = input.priority!
          applyScore(lead)
          await lead.save()
          await logActivity({ lead: lead._id, customer: lead.customer, actor: user._id, action: 'field_updated', field: 'priority', previousValue: previous, newValue: lead.priority, notes: 'Bulk update' })
        }
      } else {
        const archived = input.action === 'archive'
        if (lead.archived !== archived) {
          lead.archived = archived
          await lead.save()
          await logActivity({ lead: lead._id, customer: lead.customer, actor: user._id, action: archived ? 'archived' : 'unarchived', field: 'archived', previousValue: !archived, newValue: archived })
        }
      }
      updated += 1
    } catch (error) {
      failed.push({ leadId: lead.leadId, error: error instanceof Error ? error.message : 'Failed' })
    }
  }
  response.json({ updated, failed, skipped: input.ids.length - leads.length })
}

export async function leadActivity(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const lead = await loadAccessibleLead(user, request.params.id)
  const { page, limit } = pageQuerySchema.parse(request.query)
  const filter = { $or: [{ lead: lead._id }, { customer: lead.customer, lead: { $exists: false } }] }
  const [items, total] = await Promise.all([
    ActivityModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('actor', 'name employeeCode').lean(),
    ActivityModel.countDocuments(filter),
  ])
  response.json(paged(items, total, page, limit))
}

export async function openLeadStats(user: AuthUser) {
  return LeadModel.countDocuments({ ...leadScope(user), archived: false, stage: { $nin: closedStages } })
}

export async function listCustomers(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const { page, limit, search } = pageQuerySchema.parse(request.query)
  const scope = leadScope(user)
  const filter: Record<string, unknown> = {}
  if (Object.keys(scope).length) filter._id = { $in: await LeadModel.find(scope).distinct('customer') }
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ customerId: pattern }, { name: pattern }, { phone: pattern }, { email: pattern }, { company: pattern }]
  }
  const [items, total] = await Promise.all([
    CustomerModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    CustomerModel.countDocuments(filter),
  ])
  const leadCounts = await LeadModel.aggregate([
    { $match: { customer: { $in: items.map((item) => item._id) }, ...scope } },
    { $group: { _id: '$customer', leads: { $sum: 1 }, revenue: { $sum: '$amountPaid' }, lastLead: { $max: '$createdAt' } } },
  ])
  const byId = new Map(leadCounts.map((row) => [String(row._id), row]))
  response.json(paged(items.map((item) => ({ ...item, leads: byId.get(String(item._id))?.leads ?? 0, revenue: byId.get(String(item._id))?.revenue ?? 0 })), total, page, limit))
}
