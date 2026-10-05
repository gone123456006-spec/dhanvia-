import { interestMeta, outcomeMeta, permissionLabels, priorityMeta, stageMeta, statusMeta } from './constants'
import { formatCurrency, formatDateTime, formatDuration, humanize } from './format'
import type { Activity, CallOutcome, Interest, LeadStage, LeadStatus, PermissionKey, Priority } from './types'

const fieldLabels: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  service: 'Service',
  source: 'Lead source',
  priority: 'Priority',
  interest: 'Interest',
  dealValue: 'Deal value',
  notes: 'Notes',
  followUpAt: 'Follow-up',
  amountPaid: 'Amount paid',
  archived: 'Archived',
}

export function formatValue(field: string | undefined, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (field === 'stage') return stageMeta[value as LeadStage]?.label ?? String(value)
  if (field === 'status') return statusMeta[value as LeadStatus]?.label ?? String(value)
  if (field === 'priority') return priorityMeta[value as Priority]?.label ?? String(value)
  if (field === 'interest') return interestMeta[value as Interest]?.label ?? String(value)
  if (field === 'dealValue' || field === 'amountPaid') return formatCurrency(Number(value))
  if (field === 'followUpAt') return formatDateTime(String(value))
  if (field === 'assignedTo' && typeof value === 'object') return (value as { name?: string }).name ?? 'Unknown'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if ('status' in record && typeof record.status === 'string') return humanize(record.status)
    return Object.entries(record).filter(([, item]) => item !== null && item !== undefined).map(([key, item]) => `${humanize(key)}: ${typeof item === 'object' ? JSON.stringify(item) : item}`).join(', ')
  }
  return String(value)
}

const employeeFieldLabels: Record<string, string> = {
  name: 'name', phone: 'phone', role: 'role', customRole: 'access role', permissions: 'permissions',
  dailyCallTarget: 'daily target', acceptsLeads: 'receives leads', active: 'active status',
}

function describeChangedFields(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const fields = Object.keys(value).map((key) => employeeFieldLabels[key] ?? humanize(key))
  return fields.length ? `Changed ${fields.join(', ')}` : undefined
}

function grantedLabels(permissions: unknown): string[] {
  if (!permissions || typeof permissions !== 'object') return []
  return Object.entries(permissions as Record<string, unknown>)
    .filter(([, allowed]) => allowed === true)
    .map(([key]) => permissionLabels[key as PermissionKey]?.label ?? humanize(key))
}

function describePermissions(permissions: unknown): string {
  const granted = grantedLabels(permissions)
  return granted.length ? `Can access: ${granted.join(', ')}` : 'Own leads only'
}

function describePermissionChange(before: unknown, after: unknown): string | undefined {
  const was = new Set(grantedLabels(before))
  const now = new Set(grantedLabels(after))
  const added = [...now].filter((label) => !was.has(label))
  const removed = [...was].filter((label) => !now.has(label))
  const parts = [added.length ? `Allowed: ${added.join(', ')}` : '', removed.length ? `Removed: ${removed.join(', ')}` : ''].filter(Boolean)
  return parts.length ? parts.join(' · ') : undefined
}

export interface DescribedActivity {
  title: string
  change?: { from: string; to: string }
  detail?: string
  icon: 'activity' | 'phone' | 'leads' | 'tasks' | 'file' | 'rupee' | 'message' | 'cog' | 'edit' | 'pipeline' | 'user' | 'archive'
}

export function describeActivity(activity: Activity): DescribedActivity {
  const value = (activity.newValue ?? {}) as Record<string, unknown>
  const change = activity.field ? { from: formatValue(activity.field, activity.previousValue), to: formatValue(activity.field, activity.newValue) } : undefined

  switch (activity.action) {
    case 'lead_created':
      return { title: `Lead ${value.leadId ?? ''} created from ${value.source ?? 'CRM'}`, detail: activity.notes, icon: 'leads' }
    case 'customer_created':
      return { title: `Customer ${value.customerId ?? ''} created`, icon: 'user' }
    case 'repeat_enquiry':
      return { title: 'Customer enquired again from the website', detail: activity.notes, icon: 'leads' }
    case 'assigned':
    case 'reassigned':
      return { title: activity.action === 'assigned' ? 'Lead assigned' : 'Lead reassigned', change, detail: activity.notes, icon: 'user' }
    case 'stage_changed':
      return { title: 'Stage changed', change, detail: activity.notes, icon: 'pipeline' }
    case 'status_changed':
      return { title: 'Status changed', change, detail: activity.notes, icon: 'pipeline' }
    case 'interest_changed':
      return { title: 'Interest updated', change, icon: 'edit' }
    case 'call_logged': {
      const outcome = outcomeMeta[value.outcome as CallOutcome]?.label ?? String(value.outcome)
      return { title: `Call logged · ${outcome} · ${formatDuration(Number(value.durationSeconds))}`, detail: activity.notes, icon: 'phone' }
    }
    case 'task_created':
      return { title: `Task created: ${value.title ?? ''}`, detail: [value.dueAt ? `Due ${formatDateTime(String(value.dueAt))}` : '', activity.notes].filter(Boolean).join(' · '), icon: 'tasks' }
    case 'task_completed':
    case 'task_cancelled':
    case 'task_reopened':
    case 'task_updated':
      return { title: `${humanize(activity.action)}: ${(value.title as string) ?? ''}`, detail: activity.notes !== value.title ? activity.notes : undefined, icon: 'tasks' }
    case 'field_updated':
    case 'notes_updated':
      return { title: `${fieldLabels[activity.field ?? ''] ?? humanize(activity.field)} updated`, change: activity.action === 'notes_updated' ? undefined : change, detail: activity.action === 'notes_updated' ? String(activity.newValue ?? '') : activity.notes, icon: 'edit' }
    case 'follow_up_scheduled':
      return { title: activity.newValue ? 'Follow-up scheduled' : 'Follow-up cleared', change, detail: activity.notes, icon: 'tasks' }
    case 'note_added':
      return { title: 'Note added', detail: activity.notes, icon: 'message' }
    case 'conversation_logged':
      return { title: `Conversation logged · ${humanize(String(value.channel))} (${value.direction})`, detail: activity.notes, icon: 'message' }
    case 'document_requested':
      return { title: `Document requested: ${value.name}`, icon: 'file' }
    case 'documents_checklist_created':
      return { title: 'Document checklist created', detail: Array.isArray(activity.newValue) ? (activity.newValue as string[]).join(', ') : undefined, icon: 'file' }
    case 'document_updated':
    case 'document_uploaded':
      return { title: `${activity.action === 'document_uploaded' ? 'Document uploaded' : 'Document updated'}: ${activity.notes ?? ''}`, change: activity.field ? { from: formatValue('doc', activity.previousValue), to: formatValue('doc', activity.newValue) } : undefined, icon: 'file' }
    case 'payment_recorded':
      return { title: `Payment recorded · ${formatCurrency(Number(value.amount))} (${humanize(String(value.status))})`, detail: value.reference ? `Ref: ${value.reference}` : undefined, icon: 'rupee' }
    case 'payment_updated':
      return { title: 'Payment updated', change: { from: formatValue('payment', activity.previousValue), to: formatValue('payment', activity.newValue) }, detail: activity.notes, icon: 'rupee' }
    case 'amount_paid_updated':
      return { title: 'Amount paid updated', change, icon: 'rupee' }
    case 'processing_step_added':
      return { title: `Processing step added: ${value.title}`, icon: 'cog' }
    case 'processing_step_updated':
      return { title: `Processing step updated: ${value.title ?? ''}`, change: activity.field ? { from: formatValue('step', activity.previousValue), to: formatValue('step', activity.newValue) } : undefined, icon: 'cog' }
    case 'customer_updated':
      return { title: 'Customer details updated', detail: formatValue(undefined, activity.newValue), icon: 'user' }
    case 'archived':
    case 'unarchived':
      return { title: activity.action === 'archived' ? 'Lead archived' : 'Lead restored', icon: 'archive' }
    case 'leads_exported':
      return { title: `Exported ${value.count ?? ''} leads to CSV`, icon: 'file' }
    case 'support_request_updated':
      return { title: 'Support request updated', change, detail: activity.notes, icon: 'message' }
    case 'settings_updated':
      return { title: 'CRM settings changed', icon: 'cog' }
    case 'social_links_updated':
      return { title: 'Social media links updated', icon: 'cog' }
    case 'signed_in':
      return { title: 'Signed in', icon: 'user' }
    case 'password_changed':
      return { title: 'Changed their own password', icon: 'user' }
    case 'password_reset':
      return { title: `Reset the password of ${activity.notes ?? 'an employee'}`, icon: 'user' }
    case 'employee_created':
      return { title: `Added employee ${value.name ?? ''}`, detail: value.email ? String(value.email) : undefined, icon: 'user' }
    case 'employee_updated':
      return { title: `Updated employee ${activity.notes ?? ''}`.trim(), detail: describeChangedFields(activity.newValue), icon: 'user' }
    case 'role_created':
      return { title: `Created role “${value.name ?? ''}”`, detail: describePermissions(value.permissions), icon: 'user' }
    case 'role_updated': {
      const before = (activity.previousValue ?? {}) as Record<string, unknown>
      return {
        title: `Edited role “${value.name ?? ''}”`,
        change: before.name !== value.name ? { from: String(before.name ?? '—'), to: String(value.name ?? '—') } : undefined,
        detail: describePermissionChange(before.permissions, value.permissions),
        icon: 'user',
      }
    }
    case 'role_deleted':
      return { title: `Deleted role “${(activity.previousValue as { name?: string } | null)?.name ?? ''}”`, icon: 'user' }
    default:
      return { title: humanize(activity.action), change, detail: activity.notes, icon: 'activity' }
  }
}
