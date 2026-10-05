export const roles = ['super_admin', 'sales'] as const
export type Role = (typeof roles)[number]

export const permissionKeys = [
  'viewAllLeads',
  'assignLeads',
  'archiveLeads',
  'exportData',
  'viewCustomers',
  'managePayments',
  'viewSupport',
  'viewReports',
  'viewTeam',
  'viewActivityLog',
] as const
export type PermissionKey = (typeof permissionKeys)[number]

export const leadStages = ['new', 'contacted', 'interested', 'follow_up', 'documents', 'processing', 'converted', 'lost'] as const
export type LeadStage = (typeof leadStages)[number]

export const leadStatuses = [
  'new',
  'assigned',
  'calling',
  'interested',
  'follow_up',
  'documents',
  'processing',
  'converted',
  'completed',
  'lost',
] as const
export type LeadStatus = (typeof leadStatuses)[number]

export const priorities = ['low', 'medium', 'high', 'urgent'] as const
export type Priority = (typeof priorities)[number]

export const interestLevels = ['unknown', 'cold', 'warm', 'hot'] as const
export type InterestLevel = (typeof interestLevels)[number]

export const callOutcomes = [
  'connected',
  'no_answer',
  'busy',
  'callback',
  'interested',
  'not_interested',
  'wrong_number',
  'converted',
] as const
export type CallOutcome = (typeof callOutcomes)[number]

export const connectedOutcomes: readonly CallOutcome[] = ['connected', 'callback', 'interested', 'not_interested', 'converted']

export const taskTypes = ['call', 'follow_up', 'documents', 'payment', 'processing', 'conversion', 'general'] as const
export type TaskType = (typeof taskTypes)[number]

export const taskStatuses = ['open', 'done', 'cancelled'] as const
export type TaskStatus = (typeof taskStatuses)[number]

export const conversationChannels = ['whatsapp', 'email', 'sms', 'meeting', 'phone', 'other'] as const
export const conversationDirections = ['inbound', 'outbound', 'internal'] as const

export const documentStatuses = ['required', 'received', 'verified', 'rejected'] as const
export type DocumentStatus = (typeof documentStatuses)[number]

export const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'] as const
export type PaymentStatus = (typeof paymentStatuses)[number]

export const paymentMethods = ['upi', 'bank_transfer', 'card', 'cash', 'cheque', 'payment_link', 'other'] as const

export const processingStatuses = ['pending', 'in_progress', 'blocked', 'done'] as const
export type ProcessingStatus = (typeof processingStatuses)[number]

export const notificationTypes = [
  'lead_assigned',
  'call_pending',
  'task_due',
  'task_overdue',
  'documents_missing',
  'payment_pending',
  'processing_action',
  'ready_for_conversion',
  'lead_created',
  'system',
] as const
export type NotificationType = (typeof notificationTypes)[number]

export const closedStages: readonly LeadStage[] = ['converted', 'lost']

export const stageLabels: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  follow_up: 'Follow-up',
  documents: 'Documents',
  processing: 'Processing',
  converted: 'Converted',
  lost: 'Lost',
}

export const outcomeLabels: Record<CallOutcome, string> = {
  connected: 'Connected',
  no_answer: 'No Answer',
  busy: 'Busy',
  callback: 'Callback',
  interested: 'Interested',
  not_interested: 'Not Interested',
  wrong_number: 'Wrong Number',
  converted: 'Converted',
}

export const stageToStatus: Record<LeadStage, LeadStatus> = {
  new: 'new',
  contacted: 'calling',
  interested: 'interested',
  follow_up: 'follow_up',
  documents: 'documents',
  processing: 'processing',
  converted: 'converted',
  lost: 'lost',
}
