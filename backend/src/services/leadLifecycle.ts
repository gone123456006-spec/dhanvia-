import type { Types } from 'mongoose'
import {
  closedStages,
  connectedOutcomes,
  leadStages,
  outcomeLabels,
  stageLabels,
  stageToStatus,
  type CallOutcome,
  type InterestLevel,
  type LeadStage,
  type LeadStatus,
  type Priority,
  type TaskType,
} from '../domain/enums.js'
import { HttpError } from '../middleware/errorHandler.js'
import { CallModel } from '../models/call.model.js'
import { nextFormattedId } from '../models/counter.model.js'
import { CustomerModel } from '../models/customer.model.js'
import { LeadDocumentModel } from '../models/document.model.js'
import { LeadModel, type LeadDocument } from '../models/lead.model.js'
import { PaymentModel } from '../models/payment.model.js'
import { getSettings } from '../models/settings.model.js'
import { TaskModel } from '../models/task.model.js'
import { UserModel } from '../models/user.model.js'
import { addHours, addMinutes, addDays } from '../utils/time.js'
import { logActivity, type ActivityOrigin } from './activity.js'
import { calculateLeadScore } from './leadScore.js'
import { notify, notifySuperAdmins } from './notifications.js'
import { closeOpenTasks, createTask, ensureOpenTask, reassignOpenTasks } from './tasks.js'

export interface Actor {
  id: Types.ObjectId | null
  origin: ActivityOrigin
}

export const systemActor: Actor = { id: null, origin: 'system' }

function automationActor(actor: Actor): Actor {
  return { id: actor.id, origin: 'automation' }
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
}

function stageIndex(stage: LeadStage): number {
  return leadStages.indexOf(stage)
}

export function applyScore(lead: LeadDocument): void {
  lead.score = calculateLeadScore({
    interest: lead.interest as InterestLevel,
    priority: lead.priority as Priority,
    stage: lead.stage as LeadStage,
    connectedCalls: lead.connectedCalls,
    callAttempts: lead.callAttempts,
    dealValue: lead.dealValue,
    amountPaid: lead.amountPaid,
  })
}

/** Keeps lead.nextAction / nextActionDueAt / followUpAt in sync with the earliest open tasks. */
export async function refreshNextAction(leadId: Types.ObjectId): Promise<void> {
  const [next, followUp] = await Promise.all([
    TaskModel.findOne({ lead: leadId, status: 'open' }).sort({ dueAt: 1 }).lean(),
    TaskModel.findOne({ lead: leadId, status: 'open', type: { $in: ['follow_up', 'call'] } }).sort({ dueAt: 1 }).lean(),
  ])
  await LeadModel.updateOne(
    { _id: leadId },
    {
      $set: {
        nextAction: next?.title ?? null,
        nextActionDueAt: next?.dueAt ?? null,
        followUpAt: followUp?.dueAt ?? null,
      },
    },
  )
}

async function userName(id: Types.ObjectId | null | undefined): Promise<string | null> {
  if (!id) return null
  const user = await UserModel.findById(id).select('name').lean()
  return user?.name ?? null
}

async function pickRoundRobinAssignee(): Promise<Types.ObjectId | null> {
  const user = await UserModel.findOneAndUpdate(
    { active: true, acceptsLeads: true, role: 'sales' },
    { $set: { lastAssignedAt: new Date() } },
    { sort: { lastAssignedAt: 1, createdAt: 1 }, returnDocument: 'after' },
  ).lean()
  return user?._id ?? null
}

export async function assignLead(lead: LeadDocument, assigneeId: Types.ObjectId | null, actor: Actor, note?: string): Promise<void> {
  const previous = lead.assignedTo ?? null
  if (String(previous) === String(assigneeId)) return

  if (assigneeId) {
    const assignee = await UserModel.findOne({ _id: assigneeId, active: true }).lean()
    if (!assignee) throw new HttpError(400, 'Selected employee is not active')
  }

  const previousStatus = lead.status
  lead.assignedTo = assigneeId
  lead.assignedAt = new Date()
  if (assigneeId && lead.status === 'new') lead.status = 'assigned'
  await lead.save()

  const [previousName, newName] = await Promise.all([userName(previous), userName(assigneeId)])
  await logActivity({
    lead: lead._id,
    customer: lead.customer,
    actor: actor.id,
    origin: actor.origin,
    action: previous ? 'reassigned' : 'assigned',
    field: 'assignedTo',
    previousValue: previous ? { id: String(previous), name: previousName } : null,
    newValue: assigneeId ? { id: String(assigneeId), name: newName } : null,
    notes: note,
  })
  if (previousStatus !== lead.status) {
    await logActivity({
      lead: lead._id, customer: lead.customer, actor: actor.id, origin: actor.origin,
      action: 'status_changed', field: 'status', previousValue: previousStatus, newValue: lead.status,
    })
  }

  await reassignOpenTasks(lead._id, previous, assigneeId)
  if (!assigneeId) return

  await notify([assigneeId], {
    type: 'lead_assigned',
    title: `New lead assigned: ${lead.name}`,
    message: `${lead.leadId} · ${lead.service}`,
    lead: lead._id,
    dedupeKey: `lead_assigned:${lead._id}:${lead.assignedAt.getTime()}`,
  })

  const settings = await getSettings()
  if (settings.automation?.createCallTaskOnAssign && (lead.stage === 'new' || lead.stage === 'contacted')) {
    await ensureOpenTask({
      lead: lead._id,
      customer: lead.customer,
      assignedTo: assigneeId,
      type: 'call',
      title: `Call ${lead.name} about ${lead.service}`,
      dueAt: addMinutes(new Date(), settings.automation.callTaskDueMinutes ?? 30),
      priority: lead.priority as Priority,
      createdBy: actor.id,
      automationRule: 'New Lead → Assign Employee → Create Call Task',
    })
    await refreshNextAction(lead._id)
  }
}

export interface CreateLeadInput {
  name: string
  phone: string
  callingCode?: string
  email?: string
  service: string
  source: string
  sourceDetail?: string
  priority?: Priority
  interest?: InterestLevel
  dealValue?: number
  assignedTo?: string | null
  followUpAt?: Date
  notes?: string
  company?: string
  city?: string
}

export async function createLead(
  input: CreateLeadInput,
  actor: Actor,
  options: { allowDuplicate?: boolean } = {},
): Promise<{ lead: LeadDocument; duplicate: boolean }> {
  const phone = normalizePhone(input.phone)
  let customer = await CustomerModel.findOne({ phone })
  if (!customer) {
    customer = await CustomerModel.create({
      customerId: await nextFormattedId('customer', 'CU'),
      name: input.name,
      phone,
      callingCode: input.callingCode ?? '+91',
      email: input.email,
      company: input.company,
      city: input.city,
    })
    await logActivity({
      customer: customer._id, actor: actor.id, origin: actor.origin,
      action: 'customer_created', newValue: { customerId: customer.customerId, name: customer.name },
      entityType: 'customer', entityId: customer._id,
    })
  } else if (input.email && !customer.email) {
    customer.email = input.email
    await customer.save()
  }

  const existing = await LeadModel.findOne({
    customer: customer._id,
    service: input.service,
    stage: { $nin: closedStages },
    archived: false,
  })
  if (existing) {
    if (actor.origin === 'website') {
      existing.lastInteractionAt = new Date()
      existing.lastInteractionSummary = `Repeat website enquiry${input.sourceDetail ? ` (${input.sourceDetail})` : ''}`
      await existing.save()
      await logActivity({
        lead: existing._id, customer: customer._id, actor: null, origin: 'website',
        action: 'repeat_enquiry', notes: input.notes ?? `Customer submitted the ${input.sourceDetail ?? 'website'} form again`,
      })
      await notify([existing.assignedTo], {
        type: 'lead_created',
        title: `Repeat enquiry from ${existing.name}`,
        message: `${existing.leadId} · ${existing.service}`,
        lead: existing._id,
      })
      return { lead: existing, duplicate: true }
    }
    if (!options.allowDuplicate) {
      throw new HttpError(409, `An open lead (${existing.leadId}) already exists for this customer and service`, {
        duplicateLeadId: existing.leadId,
        duplicateId: String(existing._id),
      })
    }
  }

  const lead = new LeadModel({
    leadId: await nextFormattedId('lead', 'LD'),
    customer: customer._id,
    name: input.name,
    phone,
    email: input.email ?? customer.email,
    service: input.service,
    source: input.source,
    sourceDetail: input.sourceDetail,
    priority: input.priority ?? 'medium',
    interest: input.interest ?? 'unknown',
    dealValue: input.dealValue ?? 0,
    notes: input.notes,
    createdBy: actor.id,
    lastInteractionAt: actor.origin === 'website' ? new Date() : undefined,
    lastInteractionSummary: actor.origin === 'website' ? `Website enquiry${input.sourceDetail ? ` (${input.sourceDetail})` : ''}` : undefined,
  })
  if (!lead.dealValue) {
    const settings = await getSettings()
    const service = settings.services.find((item) => item.name === input.service)
    if (service?.price) lead.dealValue = service.price
  }
  applyScore(lead)
  await lead.save()

  await logActivity({
    lead: lead._id, customer: customer._id, actor: actor.id, origin: actor.origin,
    action: 'lead_created',
    newValue: { leadId: lead.leadId, service: lead.service, source: lead.source, stage: lead.stage },
    notes: input.notes,
  })

  const settings = await getSettings()
  let assignee: Types.ObjectId | null = null
  let assignmentActor = actor
  if (input.assignedTo) {
    assignee = (await UserModel.findById(input.assignedTo).select('_id').lean())?._id ?? null
  } else if (settings.automation?.autoAssignNewLeads) {
    assignee = await pickRoundRobinAssignee()
    assignmentActor = automationActor(actor)
  }

  if (assignee) {
    await assignLead(lead, assignee, assignmentActor, assignmentActor.origin === 'automation' ? 'Auto-assigned (round robin)' : undefined)
  } else {
    await notifySuperAdmins({
      type: 'lead_created',
      title: `Unassigned lead: ${lead.name}`,
      message: `${lead.leadId} · ${lead.service} · ${lead.source}`,
      lead: lead._id,
      dedupeKey: `unassigned:${lead._id}`,
    })
  }

  if (input.followUpAt) {
    await createTask({
      lead: lead._id, customer: customer._id, assignedTo: lead.assignedTo, type: 'follow_up',
      title: `Follow up with ${lead.name}`, dueAt: input.followUpAt, priority: lead.priority as Priority, createdBy: actor.id,
    })
    await refreshNextAction(lead._id)
  }

  return { lead: (await LeadModel.findById(lead._id))!, duplicate: false }
}

const stageTaskTypes: TaskType[] = ['follow_up', 'documents', 'processing', 'conversion', 'payment']

function stageTask(lead: LeadDocument, stage: LeadStage, followUpDelayHours: number): { type: TaskType; title: string; dueAt: Date; rule: string } | null {
  const followUpDue = lead.followUpAt && lead.followUpAt > new Date() ? lead.followUpAt : addHours(new Date(), followUpDelayHours)
  switch (stage) {
    case 'contacted':
      return { type: 'follow_up', title: `Qualify requirement and share proposal with ${lead.name}`, dueAt: followUpDue, rule: 'Contacted → Create Qualification Follow-up' }
    case 'interested':
      return { type: 'follow_up', title: `Follow up on ${lead.service} interest`, dueAt: followUpDue, rule: 'Interested → Create Follow-up' }
    case 'follow_up':
      return { type: 'follow_up', title: `Follow-up call with ${lead.name}`, dueAt: followUpDue, rule: 'Follow-up → Schedule Follow-up' }
    case 'documents':
      return { type: 'documents', title: `Collect documents for ${lead.service}`, dueAt: addHours(new Date(), 24), rule: 'Documents → Collect Documents' }
    case 'processing':
      return { type: 'processing', title: `Start processing ${lead.service}`, dueAt: addHours(new Date(), 24), rule: 'Processing → Start Processing' }
    case 'converted':
      return { type: 'conversion', title: `Complete onboarding for ${lead.name}`, dueAt: addHours(new Date(), 48), rule: 'Converted → Complete Onboarding' }
    default:
      return null
  }
}

async function seedDocumentChecklist(lead: LeadDocument, actor: Actor): Promise<void> {
  if (await LeadDocumentModel.exists({ lead: lead._id })) return
  const settings = await getSettings()
  const service = settings.services.find((item) => item.name === lead.service)
  const names = service?.defaultDocuments ?? []
  if (names.length === 0) return
  await LeadDocumentModel.insertMany(names.map((name) => ({ lead: lead._id, customer: lead.customer, name, required: true, createdBy: actor.id })))
  await logActivity({
    lead: lead._id, customer: lead.customer, actor: actor.id, origin: 'automation',
    action: 'documents_checklist_created', newValue: names, notes: `Default checklist for ${lead.service}`,
  })
}

export async function changeStage(
  lead: LeadDocument,
  stage: LeadStage,
  actor: Actor,
  options: { note?: string; lostReason?: string } = {},
): Promise<void> {
  if (lead.stage === stage) return
  if (stage === 'lost' && !options.lostReason) throw new HttpError(400, 'A reason is required to mark a lead as lost')

  const previousStage = lead.stage as LeadStage
  const previousStatus = lead.status as LeadStatus
  lead.stage = stage
  lead.status = stageToStatus[stage]
  lead.stageChangedAt = new Date()
  if (stage === 'converted' && !lead.convertedAt) lead.convertedAt = new Date()
  if (stage === 'lost') lead.lostReason = options.lostReason
  if (previousStage === 'converted' && stage !== 'converted') lead.convertedAt = undefined
  applyScore(lead)
  await lead.save()

  await logActivity({
    lead: lead._id, customer: lead.customer, actor: actor.id, origin: actor.origin,
    action: 'stage_changed', field: 'stage', previousValue: previousStage, newValue: stage,
    notes: [options.note, options.lostReason && `Lost reason: ${options.lostReason}`].filter(Boolean).join(' · ') || undefined,
  })
  if (previousStatus !== lead.status) {
    await logActivity({
      lead: lead._id, customer: lead.customer, actor: actor.id, origin: actor.origin,
      action: 'status_changed', field: 'status', previousValue: previousStatus, newValue: lead.status,
    })
  }

  const supersededNote = `Superseded: lead moved to ${stageLabels[stage]}`
  if (stage === 'lost') {
    await closeOpenTasks(lead._id, {}, 'cancelled', actor.id, supersededNote)
  } else {
    const keep = stageTask(lead, stage, 0)?.type
    await closeOpenTasks(lead._id, { types: stageTaskTypes.filter((type) => type !== keep && type !== 'payment'), automatedOnly: true }, 'cancelled', actor.id, supersededNote)
    if (stageIndex(stage) >= stageIndex('documents')) {
      await closeOpenTasks(lead._id, { types: ['call'], automatedOnly: true }, 'cancelled', actor.id, supersededNote)
    }
  }

  const settings = await getSettings()
  const automation = settings.automation
  if (stage === 'documents') await seedDocumentChecklist(lead, actor)

  const task = stageTask(lead, stage, automation?.followUpDelayHours ?? 24)
  const allowed = automation?.createTaskOnStageChange && (stage !== 'interested' || automation.createFollowUpOnInterested)
  if (task && allowed) {
    await ensureOpenTask({
      lead: lead._id, customer: lead.customer, assignedTo: lead.assignedTo, type: task.type, title: task.title,
      dueAt: task.dueAt, priority: lead.priority as Priority, createdBy: actor.id, automationRule: task.rule,
    })
  }

  if (stage === 'converted') {
    await notifySuperAdmins({
      type: 'system',
      title: `Lead converted: ${lead.name}`,
      message: `${lead.leadId} · ${lead.service}${lead.dealValue ? ` · ₹${lead.dealValue.toLocaleString('en-IN')}` : ''}`,
      lead: lead._id,
      dedupeKey: `converted:${lead._id}:${lead.convertedAt?.getTime()}`,
    }, [lead.assignedTo])
  }

  await refreshNextAction(lead._id)
}

export async function changeStatus(lead: LeadDocument, status: LeadStatus, actor: Actor, note?: string): Promise<void> {
  if (lead.status === status) return
  if (status === 'completed' && lead.stage !== 'converted') throw new HttpError(400, 'Only converted leads can be marked completed')
  const previous = lead.status
  lead.status = status
  if (status === 'completed') lead.completedAt = new Date()
  await lead.save()
  await logActivity({
    lead: lead._id, customer: lead.customer, actor: actor.id, origin: actor.origin,
    action: 'status_changed', field: 'status', previousValue: previous, newValue: status, notes: note,
  })
  if (status === 'completed') {
    await closeOpenTasks(lead._id, { types: ['conversion'] }, 'done', actor.id, 'Lead marked completed')
    await refreshNextAction(lead._id)
  }
}

export interface LogCallInput {
  outcome: CallOutcome
  durationSeconds: number
  startedAt?: Date
  notes?: string
  interest?: InterestLevel
  nextAction?: string
  followUpAt?: Date
  taskId?: string
}

export async function logCall(lead: LeadDocument, input: LogCallInput, actor: Actor & { id: Types.ObjectId }) {
  if (input.outcome === 'callback' && !input.followUpAt) throw new HttpError(400, 'Choose a callback date and time')

  const connected = connectedOutcomes.includes(input.outcome)
  const startedAt = input.startedAt ?? new Date(Date.now() - input.durationSeconds * 1000)
  const call = await CallModel.create({
    lead: lead._id,
    customer: lead.customer,
    agent: actor.id,
    phone: lead.phone,
    outcome: input.outcome,
    connected,
    durationSeconds: input.durationSeconds,
    startedAt,
    notes: input.notes,
    interest: input.interest,
    nextAction: input.nextAction,
    followUpAt: input.followUpAt,
    task: input.taskId,
  })

  lead.callAttempts += 1
  if (connected) lead.connectedCalls += 1
  lead.lastInteractionAt = new Date()
  lead.lastInteractionSummary = `Call · ${outcomeLabels[input.outcome]}${input.notes ? ` – ${input.notes.slice(0, 200)}` : ''}`
  const previousInterest = lead.interest
  if (input.interest) lead.interest = input.interest
  else if (input.outcome === 'interested' && (lead.interest === 'unknown' || lead.interest === 'cold')) lead.interest = 'warm'
  if (input.followUpAt) lead.followUpAt = input.followUpAt
  const previousStatus = lead.status
  if (['new', 'assigned'].includes(lead.status) && !closedStages.includes(lead.stage as LeadStage)) lead.status = 'calling'
  applyScore(lead)
  await lead.save()

  await logActivity({
    lead: lead._id, customer: lead.customer, actor: actor.id, origin: actor.origin,
    action: 'call_logged',
    newValue: { outcome: input.outcome, durationSeconds: input.durationSeconds, connected },
    notes: input.notes,
    entityType: 'call', entityId: call._id,
  })
  if (previousInterest !== lead.interest) {
    await logActivity({
      lead: lead._id, customer: lead.customer, actor: actor.id, origin: actor.origin,
      action: 'interest_changed', field: 'interest', previousValue: previousInterest, newValue: lead.interest,
    })
  }
  if (previousStatus !== lead.status) {
    await logActivity({
      lead: lead._id, customer: lead.customer, actor: actor.id, origin: actor.origin,
      action: 'status_changed', field: 'status', previousValue: previousStatus, newValue: lead.status,
    })
  }

  await closeOpenTasks(lead._id, { types: ['call'] }, 'done', actor.id, `Call logged: ${outcomeLabels[input.outcome]}`)

  const settings = await getSettings()
  const automation = automationActor(actor)
  const rule = 'Call Completed → Save Outcome → Create Next Action'
  const current = lead.stage as LeadStage
  const moveForward = async (target: LeadStage, extra: { lostReason?: string } = {}) => {
    const revivesLostLead = current === 'lost' && (target === 'interested' || target === 'converted')
    if (target === 'lost' || stageIndex(current) < stageIndex(target) || revivesLostLead) {
      await changeStage(lead, target, automation, { note: `Call outcome: ${outcomeLabels[input.outcome]}`, ...extra })
    }
  }

  switch (input.outcome) {
    case 'connected':
      await moveForward('contacted')
      break
    case 'no_answer':
    case 'busy':
      await createTask({
        lead: lead._id, customer: lead.customer, assignedTo: lead.assignedTo ?? actor.id, type: 'call',
        title: `Retry call to ${lead.name} (attempt ${lead.callAttempts + 1})`,
        dueAt: input.followUpAt ?? addHours(new Date(), settings.automation?.retryCallAfterHours ?? 4),
        priority: lead.priority as Priority, createdBy: actor.id, automationRule: rule,
      })
      break
    case 'callback':
      await moveForward('contacted')
      await createTask({
        lead: lead._id, customer: lead.customer, assignedTo: lead.assignedTo ?? actor.id, type: 'call',
        title: input.nextAction || `Callback requested by ${lead.name}`, dueAt: input.followUpAt!,
        priority: lead.priority as Priority, createdBy: actor.id, automationRule: rule,
      })
      break
    case 'interested':
      await moveForward('interested')
      break
    case 'not_interested':
      await moveForward('lost', { lostReason: 'Not interested' })
      break
    case 'wrong_number':
      await moveForward('lost', { lostReason: 'Wrong number' })
      break
    case 'converted':
      await moveForward('converted')
      break
  }

  const handledByOutcome = ['no_answer', 'busy', 'callback', 'interested', 'not_interested', 'wrong_number'].includes(input.outcome)
  if (input.followUpAt && !handledByOutcome && lead.stage !== 'lost') {
    await createTask({
      lead: lead._id, customer: lead.customer, assignedTo: lead.assignedTo ?? actor.id, type: 'follow_up',
      title: input.nextAction || `Follow up with ${lead.name}`, dueAt: input.followUpAt,
      priority: lead.priority as Priority, createdBy: actor.id, automationRule: rule,
    })
  } else if (input.outcome === 'interested' && input.nextAction) {
    await TaskModel.updateOne(
      { lead: lead._id, type: 'follow_up', status: 'open' },
      { $set: { title: input.nextAction, ...(input.followUpAt ? { dueAt: input.followUpAt } : {}) } },
    )
  }

  await refreshNextAction(lead._id)
  return call
}

export async function onDocumentsChanged(leadId: Types.ObjectId, actor: Actor): Promise<void> {
  const lead = await LeadModel.findById(leadId)
  if (!lead || lead.stage !== 'documents') return
  const required = await LeadDocumentModel.find({ lead: leadId, required: true }).lean()
  if (required.length === 0 || !required.every((doc) => doc.status === 'received' || doc.status === 'verified')) return

  await closeOpenTasks(leadId, { types: ['documents'] }, 'done', actor.id, 'All required documents received')
  const settings = await getSettings()
  if (settings.automation?.documentsCompleteToProcessing) {
    await changeStage(lead, 'processing', automationActor(actor), { note: 'Documents Complete → Move to Processing' })
  }
}

export async function onPaymentsChanged(leadId: Types.ObjectId, actor: Actor): Promise<void> {
  const lead = await LeadModel.findById(leadId)
  if (!lead) return
  const payments = await PaymentModel.find({ lead: leadId }).lean()
  const paid = payments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + payment.amount, 0)
  const pending = payments.filter((payment) => payment.status === 'pending')

  if (paid !== lead.amountPaid) {
    const previous = lead.amountPaid
    lead.amountPaid = paid
    applyScore(lead)
    await lead.save()
    await logActivity({
      lead: lead._id, customer: lead.customer, actor: actor.id, origin: actor.origin,
      action: 'amount_paid_updated', field: 'amountPaid', previousValue: previous, newValue: paid,
    })
  }

  const settings = await getSettings()
  if (pending.length === 0) {
    await closeOpenTasks(leadId, { types: ['payment'] }, 'done', actor.id, 'No pending payments')
  } else {
    const earliest = pending.reduce((min, payment) => (payment.dueAt && (!min || payment.dueAt < min) ? payment.dueAt : min), undefined as Date | undefined)
    const total = pending.reduce((sum, payment) => sum + payment.amount, 0)
    await ensureOpenTask({
      lead: lead._id, customer: lead.customer, assignedTo: lead.assignedTo, type: 'payment',
      title: `Collect pending payment of ₹${total.toLocaleString('en-IN')}`,
      dueAt: earliest ?? addDays(new Date(), settings.automation?.paymentReminderDays ?? 2),
      priority: lead.priority as Priority, createdBy: actor.id, automationRule: 'Payment Pending → Create Collection Task',
    })
  }

  const fullyPaid = paid > 0 && (lead.dealValue === 0 || paid >= lead.dealValue)
  if (fullyPaid && settings.automation?.paymentCompleteToConverted && !closedStages.includes(lead.stage as LeadStage)) {
    await changeStage(lead, 'converted', automationActor(actor), { note: 'Payment Complete → Mark Converted' })
  }
  await refreshNextAction(leadId)
}
