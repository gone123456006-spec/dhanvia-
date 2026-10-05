import type { Request, Response } from 'express'
import mongoose, { mongo } from 'mongoose'
import { Readable } from 'node:stream'
import { currentUser } from '../middleware/auth.js'
import { HttpError } from '../middleware/errorHandler.js'
import { CallModel } from '../models/call.model.js'
import { ConversationModel } from '../models/conversation.model.js'
import { CustomerModel } from '../models/customer.model.js'
import { LeadDocumentModel } from '../models/document.model.js'
import { LeadModel } from '../models/lead.model.js'
import { PaymentModel } from '../models/payment.model.js'
import { ProcessingStepModel } from '../models/processingStep.model.js'
import { TaskModel } from '../models/task.model.js'
import { loadAccessibleLead, toObjectId } from '../services/access.js'
import { logActivity } from '../services/activity.js'
import { logCall, onDocumentsChanged, onPaymentsChanged, refreshNextAction } from '../services/leadLifecycle.js'
import {
  conversationSchema,
  createDocumentSchema,
  createPaymentSchema,
  createProcessingStepSchema,
  logCallSchema,
  updateCustomerSchema,
  updateDocumentSchema,
  updatePaymentSchema,
  updateProcessingStepSchema,
} from '../validation/schemas.js'
import { actorFor } from './leads.controller.js'

export const allowedUploadTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

function bucket() {
  if (!mongoose.connection.db) throw new HttpError(503, 'Database unavailable')
  return new mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'documents' })
}

// ── Calls ───────────────────────────────────────────────────────────────────

export async function listLeadCalls(request: Request, response: Response): Promise<void> {
  const lead = await loadAccessibleLead(currentUser(request), request.params.id)
  const items = await CallModel.find({ lead: lead._id }).sort({ startedAt: -1 }).populate('agent', 'name employeeCode').lean()
  response.json({ items })
}

export async function logLeadCall(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const lead = await loadAccessibleLead(user, request.params.id)
  const input = logCallSchema.parse(request.body)
  if (input.followUpAt && input.followUpAt < new Date(Date.now() - 60_000)) {
    throw new HttpError(400, 'Follow-up time must be in the future', { fields: { followUpAt: 'Choose a future date and time' } })
  }
  const call = await logCall(lead, input, actorFor(user))
  response.status(201).json({ call, lead: await LeadModel.findById(lead._id).populate('assignedTo', 'name').lean() })
}

// ── Conversations ───────────────────────────────────────────────────────────

export async function listConversations(request: Request, response: Response): Promise<void> {
  const lead = await loadAccessibleLead(currentUser(request), request.params.id)
  const items = await ConversationModel.find({ lead: lead._id }).sort({ occurredAt: -1 }).populate('author', 'name').lean()
  response.json({ items })
}

export async function addConversation(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const lead = await loadAccessibleLead(user, request.params.id)
  const input = conversationSchema.parse(request.body)
  const conversation = await ConversationModel.create({ ...input, occurredAt: input.occurredAt ?? new Date(), lead: lead._id, customer: lead.customer, author: user._id })
  lead.lastInteractionAt = conversation.occurredAt
  lead.lastInteractionSummary = `${input.channel} · ${input.summary.slice(0, 200)}`
  await lead.save()
  await logActivity({
    lead: lead._id, customer: lead.customer, actor: user._id, action: 'conversation_logged',
    newValue: { channel: input.channel, direction: input.direction }, notes: input.summary, entityType: 'conversation', entityId: conversation._id,
  })
  response.status(201).json({ conversation })
}

// ── Documents ───────────────────────────────────────────────────────────────

export async function listDocuments(request: Request, response: Response): Promise<void> {
  const lead = await loadAccessibleLead(currentUser(request), request.params.id)
  const items = await LeadDocumentModel.find({ lead: lead._id }).sort({ createdAt: 1 }).populate('file.uploadedBy', 'name').lean()
  response.json({ items })
}

export async function addDocument(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const lead = await loadAccessibleLead(user, request.params.id)
  const input = createDocumentSchema.parse(request.body)
  const document = await LeadDocumentModel.create({ ...input, lead: lead._id, customer: lead.customer, createdBy: user._id })
  await logActivity({
    lead: lead._id, customer: lead.customer, actor: user._id, action: 'document_requested',
    newValue: { name: document.name, required: document.required }, entityType: 'document', entityId: document._id,
  })
  response.status(201).json({ document })
}

async function loadAccessibleDocument(request: Request) {
  const user = currentUser(request)
  const document = await LeadDocumentModel.findById(toObjectId(request.params.documentId, 'document id'))
  if (!document) throw new HttpError(404, 'Document not found')
  const lead = await loadAccessibleLead(user, String(document.lead))
  return { user, document, lead }
}

export async function updateDocument(request: Request, response: Response): Promise<void> {
  const { user, document, lead } = await loadAccessibleDocument(request)
  const input = updateDocumentSchema.parse(request.body)
  const previous = { status: document.status, required: document.required, name: document.name }
  if (input.status === 'verified' && !document.file && document.status !== 'received') {
    throw new HttpError(400, 'Upload the file or mark it received before verifying')
  }
  Object.assign(document, input, { updatedBy: user._id })
  await document.save()
  await logActivity({
    lead: lead._id, customer: lead.customer, actor: user._id, action: 'document_updated', field: input.status ? 'status' : undefined,
    previousValue: previous, newValue: { status: document.status, required: document.required, name: document.name },
    notes: input.notes ? `${document.name}: ${input.notes}` : document.name, entityType: 'document', entityId: document._id,
  })
  await onDocumentsChanged(lead._id, actorFor(user))
  response.json({ document })
}

export async function uploadDocumentFile(request: Request, response: Response): Promise<void> {
  const { user, document, lead } = await loadAccessibleDocument(request)
  const file = request.file
  if (!file) throw new HttpError(400, 'Choose a file to upload')
  if (!allowedUploadTypes.has(file.mimetype)) throw new HttpError(400, 'Only PDF, image, Word, or Excel files are allowed')

  const upload = bucket().openUploadStream(file.originalname, {
    metadata: { contentType: file.mimetype, lead: lead._id, document: document._id, uploadedBy: user._id },
  })
  await new Promise<void>((resolve, reject) => {
    Readable.from(file.buffer).pipe(upload).on('finish', () => resolve()).on('error', reject)
  })

  const previousFile = document.file?.filename ?? null
  document.file = {
    fileId: upload.id,
    filename: file.originalname,
    contentType: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
    uploadedBy: user._id,
  }
  const previousStatus = document.status
  if (document.status === 'required' || document.status === 'rejected') document.status = 'received'
  document.updatedBy = user._id
  await document.save()
  await logActivity({
    lead: lead._id, customer: lead.customer, actor: user._id, action: 'document_uploaded', field: 'file',
    previousValue: { file: previousFile, status: previousStatus }, newValue: { file: file.originalname, status: document.status },
    notes: document.name, entityType: 'document', entityId: document._id,
  })
  await onDocumentsChanged(lead._id, actorFor(user))
  response.json({ document })
}

export async function downloadDocumentFile(request: Request, response: Response): Promise<void> {
  const { document } = await loadAccessibleDocument(request)
  if (!document.file) throw new HttpError(404, 'No file uploaded for this document')
  response.setHeader('Content-Type', document.file.contentType)
  const asciiName = document.file.filename.replace(/[^\x20-\x7e]|["\\]/g, '_')
  response.setHeader('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(document.file.filename)}`)
  response.setHeader('X-Content-Type-Options', 'nosniff')
  bucket().openDownloadStream(document.file.fileId).on('error', () => response.destroy()).pipe(response)
}

// ── Payments ────────────────────────────────────────────────────────────────

export async function listPayments(request: Request, response: Response): Promise<void> {
  const lead = await loadAccessibleLead(currentUser(request), request.params.id)
  const items = await PaymentModel.find({ lead: lead._id }).sort({ createdAt: -1 }).populate('recordedBy', 'name').lean()
  response.json({ items, dealValue: lead.dealValue, amountPaid: lead.amountPaid })
}

export async function addPayment(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const lead = await loadAccessibleLead(user, request.params.id)
  const input = createPaymentSchema.parse(request.body)
  const payment = await PaymentModel.create({
    ...input,
    paidAt: input.status === 'paid' ? input.paidAt ?? new Date() : undefined,
    lead: lead._id,
    customer: lead.customer,
    service: lead.service,
    recordedBy: user._id,
    collectedBy: lead.assignedTo ?? user._id,
  })
  await logActivity({
    lead: lead._id, customer: lead.customer, actor: user._id, action: 'payment_recorded',
    newValue: { amount: payment.amount, status: payment.status, method: payment.method, reference: payment.reference },
    entityType: 'payment', entityId: payment._id,
  })
  await onPaymentsChanged(lead._id, actorFor(user))
  response.status(201).json({ payment })
}

export async function updatePayment(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const payment = await PaymentModel.findById(toObjectId(request.params.paymentId, 'payment id'))
  if (!payment) throw new HttpError(404, 'Payment not found')
  const lead = await loadAccessibleLead(user, String(payment.lead))
  const { note, ...input } = updatePaymentSchema.parse(request.body)
  const previous = { status: payment.status, reference: payment.reference, method: payment.method }
  Object.assign(payment, input)
  if (input.status === 'paid' && !payment.paidAt) payment.paidAt = new Date()
  await payment.save()
  await logActivity({
    lead: lead._id, customer: lead.customer, actor: user._id, action: 'payment_updated', field: input.status ? 'status' : undefined,
    previousValue: previous, newValue: { status: payment.status, reference: payment.reference, method: payment.method },
    notes: note, entityType: 'payment', entityId: payment._id,
  })
  await onPaymentsChanged(lead._id, actorFor(user))
  response.json({ payment })
}

// ── Processing ──────────────────────────────────────────────────────────────

export async function listProcessing(request: Request, response: Response): Promise<void> {
  const lead = await loadAccessibleLead(currentUser(request), request.params.id)
  const items = await ProcessingStepModel.find({ lead: lead._id }).sort({ order: 1, createdAt: 1 }).populate('owner', 'name').lean()
  response.json({ items })
}

export async function addProcessingStep(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const lead = await loadAccessibleLead(user, request.params.id)
  const input = createProcessingStepSchema.parse(request.body)
  const order = await ProcessingStepModel.countDocuments({ lead: lead._id })
  const step = await ProcessingStepModel.create({ ...input, lead: lead._id, order, owner: input.owner ?? lead.assignedTo ?? user._id })
  await logActivity({
    lead: lead._id, customer: lead.customer, actor: user._id, action: 'processing_step_added',
    newValue: { title: step.title, dueAt: step.dueAt }, entityType: 'processing', entityId: step._id,
  })
  response.status(201).json({ step })
}

export async function updateProcessingStep(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const step = await ProcessingStepModel.findById(toObjectId(request.params.stepId, 'step id'))
  if (!step) throw new HttpError(404, 'Processing step not found')
  const lead = await loadAccessibleLead(user, String(step.lead))
  const input = updateProcessingStepSchema.parse(request.body)
  const previous = { status: step.status, dueAt: step.dueAt, title: step.title }
  Object.assign(step, input)
  if (input.status === 'done' && !step.completedAt) step.completedAt = new Date()
  if (input.status && input.status !== 'done') step.completedAt = undefined
  await step.save()
  await logActivity({
    lead: lead._id, customer: lead.customer, actor: user._id, action: 'processing_step_updated', field: input.status ? 'status' : undefined,
    previousValue: previous, newValue: { status: step.status, dueAt: step.dueAt, title: step.title }, notes: input.notes ?? step.title,
    entityType: 'processing', entityId: step._id,
  })
  if (input.status === 'done' || input.status === 'in_progress') {
    await TaskModel.updateMany(
      { lead: lead._id, type: 'processing', status: 'open', automationRule: { $exists: true } },
      { $set: { status: 'done', completedAt: new Date(), completedBy: user._id, outcomeNote: `Processing started: ${step.title}` } },
    )
    await refreshNextAction(lead._id)
  }
  response.json({ step })
}

// ── Customer ────────────────────────────────────────────────────────────────

export async function updateCustomer(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const lead = await loadAccessibleLead(user, request.params.id)
  const customer = await CustomerModel.findById(lead.customer)
  if (!customer) throw new HttpError(404, 'Customer not found')
  const input = updateCustomerSchema.parse(request.body)
  const before = customer.toObject() as Record<string, unknown>
  Object.assign(customer, input)
  await customer.save()

  const changed = Object.keys(input).filter((key) => before[key] !== (customer.toObject() as Record<string, unknown>)[key])
  if (changed.length) {
    await logActivity({
      lead: lead._id, customer: customer._id, actor: user._id, action: 'customer_updated',
      previousValue: Object.fromEntries(changed.map((key) => [key, before[key] ?? null])),
      newValue: Object.fromEntries(changed.map((key) => [key, (customer.toObject() as Record<string, unknown>)[key] ?? null])),
      entityType: 'customer', entityId: customer._id,
    })
    const sync: Record<string, unknown> = {}
    if (input.name) sync.name = input.name
    if (input.email) sync.email = input.email
    if (Object.keys(sync).length) await LeadModel.updateMany({ customer: customer._id }, { $set: sync })
  }
  response.json({ customer })
}
