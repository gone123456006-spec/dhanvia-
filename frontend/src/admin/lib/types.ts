export type Role = 'super_admin' | 'sales'
export type PermissionKey =
  | 'viewAllLeads' | 'assignLeads' | 'archiveLeads' | 'exportData' | 'viewCustomers'
  | 'managePayments' | 'viewSupport' | 'viewReports' | 'viewTeam' | 'viewActivityLog'
export type LeadStage = 'new' | 'contacted' | 'interested' | 'follow_up' | 'documents' | 'processing' | 'converted' | 'lost'
export type LeadStatus = 'new' | 'assigned' | 'calling' | 'interested' | 'follow_up' | 'documents' | 'processing' | 'converted' | 'completed' | 'lost'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type Interest = 'unknown' | 'cold' | 'warm' | 'hot'
export type CallOutcome = 'connected' | 'no_answer' | 'busy' | 'callback' | 'interested' | 'not_interested' | 'wrong_number' | 'converted'
export type TaskType = 'call' | 'follow_up' | 'documents' | 'payment' | 'processing' | 'conversion' | 'general'
export type TaskStatus = 'open' | 'done' | 'cancelled'

export interface UserRef {
  _id: string
  name: string
  employeeCode?: string
  email?: string
  phone?: string
}

export interface User {
  id: string
  _id: string
  employeeCode: string
  name: string
  email: string
  phone?: string
  role: Role
  permissions: Partial<Record<PermissionKey, boolean>>
  customRole?: string | null
  customRoleName?: string | null
  active: boolean
  acceptsLeads: boolean
  dailyCallTarget: number
  lastLoginAt?: string
  createdAt: string
}

export interface Customer {
  _id: string
  customerId: string
  name: string
  phone: string
  callingCode?: string
  alternatePhone?: string
  email?: string
  company?: string
  city?: string
  state?: string
  address?: string
  pan?: string
  gstin?: string
  createdAt: string
  leads?: number
  revenue?: number
}

export interface Lead {
  _id: string
  leadId: string
  customer: Customer | { _id: string; customerId: string } | string
  name: string
  phone: string
  email?: string
  service: string
  source: string
  sourceDetail?: string
  assignedTo: UserRef | null
  assignedAt?: string
  priority: Priority
  interest: Interest
  score: number
  stage: LeadStage
  status: LeadStatus
  stageChangedAt?: string
  dealValue: number
  amountPaid: number
  lastInteractionAt?: string
  lastInteractionSummary?: string
  nextAction?: string | null
  nextActionDueAt?: string | null
  followUpAt?: string | null
  callAttempts: number
  connectedCalls: number
  notes?: string
  lostReason?: string
  convertedAt?: string
  completedAt?: string
  archived: boolean
  createdBy?: UserRef | null
  createdAt: string
  updatedAt: string
}

export interface Task {
  _id: string
  lead?: Pick<Lead, '_id' | 'leadId' | 'name' | 'phone' | 'service' | 'stage' | 'priority'> | null
  assignedTo?: UserRef | null
  type: TaskType
  title: string
  description?: string
  dueAt: string
  priority: Priority
  status: TaskStatus
  completedAt?: string
  completedBy?: UserRef | null
  outcomeNote?: string
  automationRule?: string
  createdAt: string
}

export interface Call {
  _id: string
  lead: string | Pick<Lead, '_id' | 'leadId' | 'name' | 'service' | 'stage'>
  agent: UserRef
  phone: string
  outcome: CallOutcome
  connected: boolean
  durationSeconds: number
  startedAt: string
  notes?: string
  interest?: Interest
  nextAction?: string
  followUpAt?: string
}

export interface Conversation {
  _id: string
  author: UserRef | null
  channel: string
  direction: 'inbound' | 'outbound'
  summary: string
  occurredAt: string
}

export interface LeadDocument {
  _id: string
  name: string
  required: boolean
  status: 'required' | 'received' | 'verified' | 'rejected'
  notes?: string
  file?: { filename: string; contentType: string; size: number; uploadedAt: string; uploadedBy?: UserRef | null } | null
  updatedAt: string
}

export interface Payment {
  _id: string
  amount: number
  method: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  reference?: string
  description?: string
  dueAt?: string
  paidAt?: string
  recordedBy?: UserRef | null
  createdAt: string
}

export interface ProcessingStep {
  _id: string
  title: string
  status: 'pending' | 'in_progress' | 'blocked' | 'done'
  owner?: UserRef | null
  dueAt?: string
  reference?: string
  notes?: string
  completedAt?: string
}

export interface LeadDetail {
  lead: Lead & { customer: Customer; createdBy?: UserRef | null }
  counts: Record<'calls' | 'conversations' | 'documents' | 'missingDocuments' | 'tasks' | 'payments' | 'processing' | 'activity', number>
  openTasks: Task[]
  permissions: { canAssign: boolean; canArchive: boolean; canExport: boolean; isSuperAdmin: boolean }
}

export interface Activity {
  _id: string
  lead?: string | { _id: string; leadId: string; name: string }
  actor: UserRef | null
  origin: 'user' | 'automation' | 'system' | 'website'
  action: string
  field?: string
  previousValue: unknown
  newValue: unknown
  notes?: string
  createdAt: string
}

export interface Notification {
  _id: string
  type: string
  title: string
  message?: string
  lead?: { _id: string; leadId: string; name: string } | null
  readAt: string | null
  createdAt: string
}

export interface Paged<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Meta {
  enums: {
    leadStages: LeadStage[]
    leadStatuses: LeadStatus[]
    priorities: Priority[]
    interestLevels: Interest[]
    callOutcomes: CallOutcome[]
    taskTypes: TaskType[]
    conversationChannels: string[]
    documentStatuses: string[]
    paymentStatuses: string[]
    paymentMethods: string[]
    processingStatuses: string[]
    permissionKeys: PermissionKey[]
  }
  services: string[]
  leadSources: string[]
  lostReasons: string[]
  users: Array<{ id: string; name: string; employeeCode: string; role: Role }>
  timezone: string
  capabilities: { isSuperAdmin: boolean; roleName: string | null } & Record<PermissionKey, boolean>
}

export interface SocialAccount {
  _id?: string
  name: string
  instagram: string
  facebook: string
  youtube: string
}

export interface CustomRole {
  _id: string
  id: string
  name: string
  description?: string
  permissions: Partial<Record<PermissionKey, boolean>>
  members: number
  activeMembers: number
  createdAt: string
  updatedAt: string
}

export interface AuditEntry extends Omit<Activity, 'actor'> {
  actor: (UserRef & { role: Role; customRole?: { _id: string; name: string } | null }) | null
  entityType?: string
  entityId?: string
}
