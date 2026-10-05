import type { Types } from 'mongoose'
import { env } from '../config/env.js'
import { LeadDocumentModel } from '../models/document.model.js'
import { LeadModel } from '../models/lead.model.js'
import { PaymentModel } from '../models/payment.model.js'
import { ProcessingStepModel } from '../models/processingStep.model.js'
import { getSettings } from '../models/settings.model.js'
import { TaskModel } from '../models/task.model.js'
import { refreshNextAction } from '../services/leadLifecycle.js'
import { notify, notifySuperAdmins, superAdminIds } from '../services/notifications.js'
import { ensureOpenTask } from '../services/tasks.js'
import { logger } from '../utils/logger.js'
import { addDays, addHours, addMinutes, dayKey } from '../utils/time.js'

const DUE_SOON_MINUTES = 15

/** Avoids recreating a task the user just completed while the underlying condition persists. */
async function recentlyTasked(lead: Types.ObjectId, type: 'documents' | 'conversion'): Promise<boolean> {
  return Boolean(await TaskModel.exists({
    lead,
    type,
    $or: [{ status: 'open' }, { createdAt: { $gte: addHours(new Date(), -24) } }],
  }))
}

async function dueTaskReminders(now: Date): Promise<void> {
  const candidates = await TaskModel.find({ status: 'open', reminderSentAt: null, dueAt: { $lte: addMinutes(now, DUE_SOON_MINUTES), $gte: now } })
    .select('_id')
    .limit(500)
    .lean()
  for (const { _id } of candidates) {
    const task = await TaskModel.findOneAndUpdate({ _id, reminderSentAt: null }, { $set: { reminderSentAt: now } }, { returnDocument: 'after' }).lean()
    if (!task?.assignedTo) continue
    await notify([task.assignedTo], {
      type: task.type === 'call' ? 'call_pending' : 'task_due',
      title: task.type === 'call' ? `Call due: ${task.title}` : `Due soon: ${task.title}`,
      message: `Due at ${task.dueAt.toLocaleTimeString('en-IN', { timeZone: env.timezone, hour: '2-digit', minute: '2-digit' })}`,
      lead: task.lead ?? undefined,
      task: task._id,
      dedupeKey: `task_due:${task._id}`,
    })
  }
}

async function overdueTaskAlerts(now: Date, notifyAdmins: boolean): Promise<void> {
  const candidates = await TaskModel.find({ status: 'open', overdueNotifiedAt: null, dueAt: { $lt: now } }).select('_id').limit(500).lean()
  const admins = notifyAdmins ? await superAdminIds() : []
  for (const { _id } of candidates) {
    const task = await TaskModel.findOneAndUpdate({ _id, overdueNotifiedAt: null }, { $set: { overdueNotifiedAt: now } }, { returnDocument: 'after' }).lean()
    if (!task) continue
    const lead = task.lead ? await LeadModel.findById(task.lead).select('leadId name').lean() : null
    await notify([task.assignedTo, ...admins], {
      type: 'task_overdue',
      title: `Overdue: ${task.title}`,
      message: lead ? `${lead.leadId} · ${lead.name}` : undefined,
      lead: task.lead ?? undefined,
      task: task._id,
      dedupeKey: `task_overdue:${task._id}`,
    })
  }
}

async function missingDocumentReminders(today: string): Promise<void> {
  const leads = await LeadModel.find({ stage: 'documents', archived: false }).select('_id leadId name service assignedTo customer priority').lean()
  for (const lead of leads) {
    const missing = await LeadDocumentModel.countDocuments({ lead: lead._id, required: true, status: { $in: ['required', 'rejected'] } })
    const total = await LeadDocumentModel.countDocuments({ lead: lead._id, required: true })
    if (total > 0 && missing === 0) continue
    if (!(await recentlyTasked(lead._id, 'documents'))) {
      await ensureOpenTask({
        lead: lead._id, customer: lead.customer, assignedTo: lead.assignedTo, type: 'documents',
        title: `Collect documents for ${lead.service}`, dueAt: addHours(new Date(), 24),
        automationRule: 'Documents Missing → Create Collection Task',
      })
      await refreshNextAction(lead._id)
    }
    await notify([lead.assignedTo], {
      type: 'documents_missing',
      title: total === 0 ? `No document checklist for ${lead.name}` : `${missing} document(s) missing for ${lead.name}`,
      message: `${lead.leadId} · ${lead.service}`,
      lead: lead._id,
      dedupeKey: `documents_missing:${lead._id}:${today}`,
    })
  }
}

async function pendingPaymentReminders(now: Date, today: string, reminderDays: number): Promise<void> {
  const payments = await PaymentModel.find({ status: 'pending', $or: [{ dueAt: { $lte: addDays(now, reminderDays) } }, { dueAt: null }] }).limit(1000).lean()
  for (const payment of payments) {
    const lead = await LeadModel.findById(payment.lead).select('leadId name assignedTo').lean()
    if (!lead) continue
    const overdue = payment.dueAt ? payment.dueAt < now : false
    await notify([lead.assignedTo], {
      type: 'payment_pending',
      title: `${overdue ? 'Overdue payment' : 'Payment pending'}: ₹${payment.amount.toLocaleString('en-IN')} from ${lead.name}`,
      message: payment.dueAt ? `${lead.leadId} · due ${dayKey(payment.dueAt)}` : lead.leadId,
      lead: lead._id,
      dedupeKey: `payment_pending:${payment._id}:${today}`,
    })
  }
}

async function processingReminders(now: Date, today: string): Promise<void> {
  const steps = await ProcessingStepModel.find({
    $or: [{ status: 'blocked' }, { status: { $in: ['pending', 'in_progress'] }, dueAt: { $lt: now } }],
  }).limit(1000).lean()
  for (const step of steps) {
    const lead = await LeadModel.findById(step.lead).select('leadId name assignedTo').lean()
    if (!lead) continue
    await notify([step.owner ?? lead.assignedTo], {
      type: 'processing_action',
      title: step.status === 'blocked' ? `Processing blocked: ${step.title}` : `Processing step overdue: ${step.title}`,
      message: `${lead.leadId} · ${lead.name}`,
      lead: lead._id,
      dedupeKey: `processing:${step._id}:${today}`,
    })
  }
}

async function readyForConversion(): Promise<void> {
  const leads = await LeadModel.find({ stage: 'processing', archived: false }).select('_id leadId name service assignedTo customer dealValue amountPaid priority').lean()
  for (const lead of leads) {
    const steps = await ProcessingStepModel.find({ lead: lead._id }).select('status').lean()
    const processingDone = steps.length > 0 && steps.every((step) => step.status === 'done')
    const paidInFull = lead.dealValue > 0 && lead.amountPaid >= lead.dealValue
    if (!processingDone && !paidInFull) continue
    if (!(await recentlyTasked(lead._id, 'conversion'))) {
      await ensureOpenTask({
        lead: lead._id, customer: lead.customer, assignedTo: lead.assignedTo, type: 'conversion',
        title: `Mark ${lead.name} as converted`, dueAt: addHours(new Date(), 4),
        automationRule: 'Ready for Conversion → Create Conversion Task',
      })
      await refreshNextAction(lead._id)
    }
    await notifySuperAdmins({
      type: 'ready_for_conversion',
      title: `Ready for conversion: ${lead.name}`,
      message: `${lead.leadId} · ${processingDone ? 'all processing steps done' : 'paid in full'}`,
      lead: lead._id,
      dedupeKey: `ready_for_conversion:${lead._id}`,
    }, [lead.assignedTo as Types.ObjectId | null])
  }
}

let currentSweep: Promise<void> | null = null

export function runReminderSweep(): Promise<void> {
  currentSweep ??= sweep().finally(() => {
    currentSweep = null
  })
  return currentSweep
}

async function sweep(): Promise<void> {
  try {
    const now = new Date()
    const today = dayKey(now)
    const settings = await getSettings()
    await dueTaskReminders(now)
    await overdueTaskAlerts(now, settings.automation?.notifyOverdueToSuperAdmins ?? true)
    await missingDocumentReminders(today)
    await pendingPaymentReminders(now, today, settings.automation?.paymentReminderDays ?? 2)
    await processingReminders(now, today)
    await readyForConversion()
  } catch (error) {
    logger.error('Reminder sweep failed', { error })
  }
}

/** Starts the periodic sweep; the returned stop function resolves once any in-flight sweep has finished. */
export function startReminderScheduler(): () => Promise<void> {
  const intervalMs = Math.max(1, env.reminderIntervalMinutes) * 60_000
  const initial = setTimeout(() => void runReminderSweep(), 5_000)
  const timer = setInterval(() => void runReminderSweep(), intervalMs)
  return async () => {
    clearTimeout(initial)
    clearInterval(timer)
    await currentSweep
  }
}
