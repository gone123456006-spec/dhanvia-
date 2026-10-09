import { z } from 'zod'
import {
  callOutcomes,
  conversationChannels,
  conversationDirections,
  documentStatuses,
  interestLevels,
  leadStages,
  leadStatuses,
  paymentMethods,
  paymentStatuses,
  permissionKeys,
  priorities,
  processingStatuses,
  roles,
  taskStatuses,
  taskTypes,
} from '../domain/enums.js'

const blankToUndefined = (value: unknown) => (value === '' || value === null ? undefined : value)

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier')
const name = z.string().trim().min(2, 'Name must be at least 2 characters').max(120)
const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254)
const optionalEmail = z.preprocess(blankToUndefined, email.optional())
const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ''))
  .pipe(z.string().regex(/^\+?\d{7,15}$/, 'Enter a valid phone number'))
const optionalText = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional())
const optionalDate = z.preprocess(blankToUndefined, z.coerce.date().optional())
const nullableDate = z.preprocess((value) => (value === '' ? null : value), z.coerce.date().nullable().optional())
const money = z.coerce.number().min(0).max(1_000_000_000)

// ── Public website forms ────────────────────────────────────────────────────

/** Hidden form field humans never see; any value means a bot filled the form. */
const honeypot = z.preprocess((value) => (typeof value === 'string' ? value.trim() : ''), z.string()).optional()

export const websiteLeadSources = ['home-offer', 'service-detail-hero', 'service-detail', 'other'] as const

export const createWebsiteLeadSchema = z.object({
  name,
  email: optionalEmail,
  phone,
  callingCode: z.string().trim().regex(/^\+\d{1,4}$/, 'Invalid calling code').optional(),
  service: z.string().trim().min(1, 'Select a service').max(200),
  source: z.enum(websiteLeadSources).optional(),
  pagePath: z.string().trim().max(300).optional(),
  website: honeypot,
})

export const createSupportRequestSchema = z.object({
  name,
  email,
  phone,
  message: z.string().trim().min(30, 'Message must be at least 30 characters').max(2000),
  salesConsultation: z.boolean().optional().default(false),
  website: honeypot,
})

// ── Auth & users ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password').max(200),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

const permissionsSchema = z.object(Object.fromEntries(permissionKeys.map((key) => [key, z.boolean().optional()])) as Record<(typeof permissionKeys)[number], z.ZodOptional<z.ZodBoolean>>)

const customRoleRef = z.preprocess((value) => (value === '' ? null : value), objectId.nullable().optional())

export const roleSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  description: z.preprocess(blankToUndefined, z.string().trim().max(300).optional()),
  permissions: permissionsSchema.default({}),
})

export const activityLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  actor: z.preprocess(blankToUndefined, objectId.optional()),
  role: z.preprocess(blankToUndefined, objectId.optional()),
  kind: z.preprocess(blankToUndefined, z.enum(['changes', 'sign_ins', 'all']).optional()),
  from: optionalText(30),
  to: optionalText(30),
})

export const createUserSchema = z.object({
  name,
  email,
  phone: z.preprocess(blankToUndefined, phone.optional()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  role: z.enum(roles).default('sales'),
  customRole: customRoleRef,
  permissions: permissionsSchema.optional(),
  dailyCallTarget: z.coerce.number().int().min(0).max(1000).optional(),
  acceptsLeads: z.boolean().optional(),
})

export const updateUserSchema = z.object({
  name: name.optional(),
  phone: z.preprocess(blankToUndefined, phone.optional()),
  role: z.enum(roles).optional(),
  customRole: customRoleRef,
  permissions: permissionsSchema.optional(),
  dailyCallTarget: z.coerce.number().int().min(0).max(1000).optional(),
  acceptsLeads: z.boolean().optional(),
  active: z.boolean().optional(),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

// ── Leads ───────────────────────────────────────────────────────────────────

export const createLeadSchema = z.object({
  name,
  phone,
  callingCode: z.string().trim().regex(/^\+\d{1,4}$/).optional(),
  email: optionalEmail,
  service: z.string().trim().min(1, 'Select a service').max(200),
  source: z.string().trim().min(1, 'Select a lead source').max(80),
  sourceDetail: optionalText(300),
  priority: z.enum(priorities).optional(),
  interest: z.enum(interestLevels).optional(),
  dealValue: money.optional(),
  assignedTo: z.preprocess(blankToUndefined, objectId.optional()),
  followUpAt: optionalDate,
  notes: optionalText(5000),
  company: optionalText(160),
  city: optionalText(80),
  allowDuplicate: z.boolean().optional(),
})

export const updateLeadSchema = z
  .object({
    name: name.optional(),
    email: optionalEmail,
    service: z.string().trim().min(1).max(200).optional(),
    source: z.string().trim().min(1).max(80).optional(),
    priority: z.enum(priorities).optional(),
    interest: z.enum(interestLevels).optional(),
    dealValue: money.optional(),
    followUpAt: nullableDate,
    notes: z.string().trim().max(5000).optional(),
    note: optionalText(1000),
  })
  .refine((value) => Object.keys(value).some((key) => key !== 'note'), 'Nothing to update')

export const changeStageSchema = z.object({
  stage: z.enum(leadStages),
  note: optionalText(1000),
  lostReason: optionalText(300),
})

export const changeStatusSchema = z.object({
  status: z.enum(leadStatuses),
  note: optionalText(1000),
})

export const assignLeadSchema = z.object({
  assignedTo: z.preprocess((value) => (value === '' ? null : value), objectId.nullable()),
  note: optionalText(1000),
})

export const addNoteSchema = z.object({
  note: z.string().trim().min(1, 'Write a note').max(5000),
})

const sortable = ['createdAt', 'updatedAt', 'score', 'followUpAt', 'nextActionDueAt', 'lastInteractionAt', 'name', 'leadId', 'dealValue'] as const

export const leadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(25),
  q: optionalText(100),
  stage: z.preprocess(blankToUndefined, z.string().optional()),
  status: z.preprocess(blankToUndefined, z.string().optional()),
  priority: z.preprocess(blankToUndefined, z.string().optional()),
  interest: z.preprocess(blankToUndefined, z.string().optional()),
  source: optionalText(80),
  form: z.preprocess(blankToUndefined, z.enum(['consultation', 'contact']).optional()),
  service: optionalText(200),
  assignedTo: z.preprocess(blankToUndefined, z.union([objectId, z.literal('unassigned'), z.literal('me')]).optional()),
  followUp: z.preprocess(blankToUndefined, z.enum(['today', 'overdue', 'upcoming', 'none']).optional()),
  createdFrom: optionalText(30),
  createdTo: optionalText(30),
  archived: z.preprocess(blankToUndefined, z.enum(['true', 'false', 'all']).optional()),
  sort: z.preprocess(blankToUndefined, z.enum(sortable).optional()),
  order: z.preprocess(blankToUndefined, z.enum(['asc', 'desc']).optional()),
})

export const bulkLeadSchema = z.object({
  ids: z.array(objectId).min(1, 'Select at least one lead').max(500),
  action: z.enum(['assign', 'stage', 'priority', 'archive', 'unarchive']),
  assignedTo: z.preprocess((value) => (value === '' ? null : value), objectId.nullable().optional()),
  stage: z.enum(leadStages).optional(),
  priority: z.enum(priorities).optional(),
  lostReason: optionalText(300),
})

// ── Calls, conversations, tasks ─────────────────────────────────────────────

export const logCallSchema = z.object({
  outcome: z.enum(callOutcomes),
  durationSeconds: z.coerce.number().int().min(0).max(86_400),
  startedAt: optionalDate,
  notes: optionalText(5000),
  interest: z.preprocess(blankToUndefined, z.enum(interestLevels).optional()),
  nextAction: optionalText(300),
  followUpAt: optionalDate,
  taskId: z.preprocess(blankToUndefined, objectId.optional()),
})

export const conversationSchema = z.object({
  channel: z.enum(conversationChannels),
  direction: z.enum(conversationDirections).default('outbound'),
  summary: z.string().trim().min(1, 'Write a summary').max(5000),
  occurredAt: optionalDate,
})

export const createTaskSchema = z.object({
  lead: z.preprocess(blankToUndefined, objectId.optional()),
  assignedTo: z.preprocess(blankToUndefined, objectId.optional()),
  type: z.enum(taskTypes),
  title: z.string().trim().min(2, 'Enter a task title').max(200),
  description: optionalText(2000),
  dueAt: z.coerce.date(),
  priority: z.enum(priorities).optional(),
})

export const updateTaskSchema = z
  .object({
    status: z.enum(taskStatuses).optional(),
    dueAt: optionalDate,
    assignedTo: z.preprocess(blankToUndefined, objectId.optional()),
    priority: z.enum(priorities).optional(),
    title: z.string().trim().min(2).max(200).optional(),
    outcomeNote: optionalText(1000),
  })
  .refine((value) => Object.keys(value).length > 0, 'Nothing to update')

export const taskListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(25),
  scope: z.enum(['mine', 'all']).default('mine'),
  status: z.preprocess(blankToUndefined, z.enum(taskStatuses).optional()),
  type: z.preprocess(blankToUndefined, z.enum(taskTypes).optional()),
  due: z.preprocess(blankToUndefined, z.enum(['today', 'overdue', 'upcoming', 'week']).optional()),
  assignedTo: z.preprocess(blankToUndefined, objectId.optional()),
  lead: z.preprocess(blankToUndefined, objectId.optional()),
})

// ── Documents, payments, processing ─────────────────────────────────────────

export const createDocumentSchema = z.object({
  name: z.string().trim().min(2, 'Enter a document name').max(160),
  required: z.boolean().default(true),
  notes: optionalText(1000),
})

export const updateDocumentSchema = z
  .object({
    status: z.enum(documentStatuses).optional(),
    required: z.boolean().optional(),
    notes: optionalText(1000),
    name: z.string().trim().min(2).max(160).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Nothing to update')

export const createPaymentSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be at least ₹1').max(1_000_000_000),
  method: z.enum(paymentMethods).default('upi'),
  status: z.enum(paymentStatuses).default('pending'),
  reference: optionalText(120),
  description: optionalText(300),
  dueAt: optionalDate,
  paidAt: optionalDate,
})

export const updatePaymentSchema = z
  .object({
    status: z.enum(paymentStatuses).optional(),
    reference: optionalText(120),
    method: z.enum(paymentMethods).optional(),
    dueAt: optionalDate,
    paidAt: optionalDate,
    note: optionalText(1000),
  })
  .refine((value) => Object.keys(value).some((key) => key !== 'note'), 'Nothing to update')

export const createProcessingStepSchema = z.object({
  title: z.string().trim().min(2, 'Enter a step title').max(200),
  owner: z.preprocess(blankToUndefined, objectId.optional()),
  dueAt: optionalDate,
  reference: optionalText(120),
  notes: optionalText(2000),
})

export const updateProcessingStepSchema = z
  .object({
    status: z.enum(processingStatuses).optional(),
    owner: z.preprocess(blankToUndefined, objectId.optional()),
    dueAt: optionalDate,
    reference: optionalText(120),
    notes: optionalText(2000),
    title: z.string().trim().min(2).max(200).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Nothing to update')

export const updateCustomerSchema = z
  .object({
    name: name.optional(),
    email: optionalEmail,
    alternatePhone: z.preprocess(blankToUndefined, phone.optional()),
    company: optionalText(160),
    city: optionalText(80),
    state: optionalText(80),
    address: optionalText(400),
    pan: z.preprocess(blankToUndefined, z.string().trim().toUpperCase().regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'Invalid PAN').optional()),
    gstin: z.preprocess(blankToUndefined, z.string().trim().toUpperCase().regex(/^\d{2}[A-Z0-9]{13}$/, 'Invalid GSTIN').optional()),
  })
  .refine((value) => Object.keys(value).length > 0, 'Nothing to update')

// ── Settings & misc ─────────────────────────────────────────────────────────

const socialUrl = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.union([z.literal(''), z.url({ protocol: /^https?$/, error: 'Paste the full link, starting with https://' }).max(500)]),
).default('')

export const socialAccountsSchema = z.object({
  accounts: z.array(z.object({
    _id: z.preprocess(blankToUndefined, objectId.optional()),
    name: z.string().trim().min(2, 'Enter the page or brand name').max(120),
    instagram: socialUrl,
    facebook: socialUrl,
    youtube: socialUrl,
    linkedin: socialUrl,
    twitter: socialUrl,
  })).max(50),
})

export const settingsSchema = z.object({
  services: z
    .array(
      z.object({
        _id: z.preprocess(blankToUndefined, objectId.optional()),
        name: z.string().trim().min(2).max(200),
        category: optionalText(120),
        price: money.default(0),
        active: z.boolean().default(true),
        defaultDocuments: z.array(z.string().trim().min(1).max(160)).max(50).default([]),
      }),
    )
    .max(500)
    .optional(),
  leadSources: z.array(z.string().trim().min(1).max(80)).max(100).optional(),
  lostReasons: z.array(z.string().trim().min(1).max(160)).max(100).optional(),
  automation: z
    .object({
      autoAssignNewLeads: z.boolean(),
      createCallTaskOnAssign: z.boolean(),
      callTaskDueMinutes: z.coerce.number().int().min(0).max(10_080),
      retryCallAfterHours: z.coerce.number().int().min(1).max(168),
      createFollowUpOnInterested: z.boolean(),
      followUpDelayHours: z.coerce.number().int().min(1).max(720),
      createTaskOnStageChange: z.boolean(),
      documentsCompleteToProcessing: z.boolean(),
      paymentCompleteToConverted: z.boolean(),
      notifyOverdueToSuperAdmins: z.boolean(),
      paymentReminderDays: z.coerce.number().int().min(0).max(60),
    })
    .partial()
    .optional(),
})

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: z.preprocess(blankToUndefined, z.string().optional()),
  search: optionalText(100),
})

export const updateSupportRequestSchema = z
  .object({
    status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Nothing to update')
