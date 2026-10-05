import type { IconName } from '../components/Icon'
import type { CallOutcome, Interest, LeadStage, LeadStatus, PermissionKey, Priority, TaskType } from './types'

/** Lead source the backend stamps on every website form submission. */
export const WEBSITE_SOURCE = 'Website'

export type Tone = 'gray' | 'blue' | 'indigo' | 'violet' | 'amber' | 'orange' | 'teal' | 'green' | 'red' | 'pink'

export const stageMeta: Record<LeadStage, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'blue' },
  contacted: { label: 'Contacted', tone: 'indigo' },
  interested: { label: 'Interested', tone: 'violet' },
  follow_up: { label: 'Follow-up', tone: 'amber' },
  documents: { label: 'Documents', tone: 'orange' },
  processing: { label: 'Processing', tone: 'teal' },
  converted: { label: 'Converted', tone: 'green' },
  lost: { label: 'Lost', tone: 'red' },
}

export const statusMeta: Record<LeadStatus, { label: string; tone: Tone }> = {
  new: { label: 'New Lead', tone: 'blue' },
  assigned: { label: 'Assigned', tone: 'indigo' },
  calling: { label: 'Calling', tone: 'pink' },
  interested: { label: 'Interested', tone: 'violet' },
  follow_up: { label: 'Follow-up', tone: 'amber' },
  documents: { label: 'Documents', tone: 'orange' },
  processing: { label: 'Processing', tone: 'teal' },
  converted: { label: 'Converted', tone: 'green' },
  completed: { label: 'Completed', tone: 'green' },
  lost: { label: 'Lost', tone: 'red' },
}

export const priorityMeta: Record<Priority, { label: string; tone: Tone }> = {
  low: { label: 'Low', tone: 'gray' },
  medium: { label: 'Medium', tone: 'blue' },
  high: { label: 'High', tone: 'orange' },
  urgent: { label: 'Urgent', tone: 'red' },
}

export const interestMeta: Record<Interest, { label: string; tone: Tone }> = {
  unknown: { label: 'Unknown', tone: 'gray' },
  cold: { label: 'Cold', tone: 'blue' },
  warm: { label: 'Warm', tone: 'amber' },
  hot: { label: 'Hot', tone: 'red' },
}

export const outcomeMeta: Record<CallOutcome, { label: string; tone: Tone; hint: string }> = {
  connected: { label: 'Connected', tone: 'indigo', hint: 'Spoke with the customer' },
  no_answer: { label: 'No Answer', tone: 'gray', hint: 'Schedules an automatic retry' },
  busy: { label: 'Busy', tone: 'amber', hint: 'Schedules an automatic retry' },
  callback: { label: 'Callback', tone: 'blue', hint: 'Customer asked to call back' },
  interested: { label: 'Interested', tone: 'violet', hint: 'Moves to Interested + follow-up' },
  not_interested: { label: 'Not Interested', tone: 'red', hint: 'Marks the lead as lost' },
  wrong_number: { label: 'Wrong Number', tone: 'red', hint: 'Marks the lead as lost' },
  converted: { label: 'Converted', tone: 'green', hint: 'Marks the lead as converted' },
}

export const taskTypeMeta: Record<TaskType, { label: string; tone: Tone }> = {
  call: { label: 'Call', tone: 'pink' },
  follow_up: { label: 'Follow-up', tone: 'amber' },
  documents: { label: 'Documents', tone: 'orange' },
  payment: { label: 'Payment', tone: 'green' },
  processing: { label: 'Processing', tone: 'teal' },
  conversion: { label: 'Conversion', tone: 'violet' },
  general: { label: 'General', tone: 'gray' },
}

export const documentStatusMeta: Record<string, { label: string; tone: Tone }> = {
  required: { label: 'Required', tone: 'amber' },
  received: { label: 'Received', tone: 'blue' },
  verified: { label: 'Verified', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
}

export const paymentStatusMeta: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'amber' },
  paid: { label: 'Paid', tone: 'green' },
  failed: { label: 'Failed', tone: 'red' },
  refunded: { label: 'Refunded', tone: 'gray' },
}

export const processingStatusMeta: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'gray' },
  in_progress: { label: 'In progress', tone: 'blue' },
  blocked: { label: 'Blocked', tone: 'red' },
  done: { label: 'Done', tone: 'green' },
}

export const supportStatusMeta: Record<string, { label: string; tone: Tone }> = {
  open: { label: 'Open', tone: 'amber' },
  'in-progress': { label: 'In progress', tone: 'blue' },
  resolved: { label: 'Resolved', tone: 'green' },
  closed: { label: 'Closed', tone: 'gray' },
}

export const channelLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS',
  meeting: 'Meeting',
  phone: 'Phone',
  other: 'Other',
}

export const paymentMethodLabels: Record<string, string> = {
  upi: 'UPI',
  bank_transfer: 'Bank transfer',
  card: 'Card',
  cash: 'Cash',
  cheque: 'Cheque',
  payment_link: 'Payment link',
  other: 'Other',
}

export const permissionLabels: Record<PermissionKey, { label: string; description: string }> = {
  viewAllLeads: { label: 'All leads', description: 'See every lead, not only the ones assigned to them' },
  viewCustomers: { label: 'Customers', description: 'Open the Customers page' },
  viewSupport: { label: 'Support requests', description: 'Open and answer website support requests' },
  viewReports: { label: 'Reports', description: 'Open the Reports page' },
  viewTeam: { label: 'Team', description: 'See team performance and workloads' },
  viewActivityLog: { label: 'Activity log', description: 'See what everyone changed and when' },
  assignLeads: { label: 'Assign leads', description: 'Give leads to other employees' },
  archiveLeads: { label: 'Archive leads', description: 'Archive and restore leads' },
  managePayments: { label: 'Record payments', description: 'Add and edit payments on a lead' },
  exportData: { label: 'Export data', description: 'Download lead lists and reports as CSV' },
}

export const permissionGroups: Array<{ title: string; hint: string; keys: PermissionKey[] }> = [
  { title: 'Pages they can see', hint: 'Dashboard, Leads, Calls, Tasks and Pipeline are always available for their own work.', keys: ['viewAllLeads', 'viewCustomers', 'viewSupport', 'viewReports', 'viewTeam', 'viewActivityLog'] },
  { title: 'Actions they can do', hint: 'Everyone can call, add notes, tasks and documents on leads they can see.', keys: ['assignLeads', 'archiveLeads', 'managePayments', 'exportData'] },
]

/** Mirrors the backend: unset legacy permissions keep the access they had before they were configurable. */
export function effectivePermissions(stored: Partial<Record<PermissionKey, boolean>> | undefined): Record<PermissionKey, boolean> {
  const own = stored ?? {}
  const fallback: Partial<Record<PermissionKey, boolean>> = { viewCustomers: true, viewSupport: true, managePayments: true, archiveLeads: Boolean(own.assignLeads) }
  return Object.fromEntries((Object.keys(permissionLabels) as PermissionKey[]).map((key) => [key, typeof own[key] === 'boolean' ? own[key] : Boolean(fallback[key])])) as Record<PermissionKey, boolean>
}

export const notificationIcons: Record<string, IconName> = {
  lead_assigned: 'leads',
  call_pending: 'phone',
  task_due: 'clock',
  task_overdue: 'alert',
  documents_missing: 'file',
  payment_pending: 'rupee',
  processing_action: 'cog',
  ready_for_conversion: 'trophy',
  lead_created: 'plus',
  system: 'bell',
}

export const pipelineStages: LeadStage[] = ['new', 'contacted', 'interested', 'follow_up', 'documents', 'processing', 'converted', 'lost']
