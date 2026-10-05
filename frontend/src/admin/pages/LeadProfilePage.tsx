import { useState, type FormEvent } from 'react'
import { DueLabel, InterestBadge, PriorityBadge, ScorePill, StageBadge, StatusBadge } from '../components/badges'
import { Icon } from '../components/Icon'
import { ActivityTab, CallsTab, ConversationsTab, CustomerTab, DocumentsTab, LeadTasksTab, PaymentsTab, ProcessingTab } from '../components/LeadTabs'
import { LogCallForm } from '../components/LogCallForm'
import { TaskRow } from '../components/Tasks'
import { Avatar, Badge, Button, Card, Drawer, EmptyState, ErrorState, Field, Input, Select, Spinner, Tabs, Textarea } from '../components/ui'
import { useConfirm, useSession, useToast } from '../context/contexts'
import { api, ApiError } from '../lib/api'
import { interestMeta, priorityMeta, stageMeta } from '../lib/constants'
import { formatCurrency, formatDate, formatDateTime, formatRelative, fromLocalInput, toLocalInput } from '../lib/format'
import { useQuery } from '../lib/hooks'
import { Link } from '../components/Link'
import { navigate, setSearchParams, useLocation } from '../lib/router'
import type { Lead, LeadDetail, LeadStage } from '../lib/types'

const tabIds = ['overview', 'customer', 'calls', 'conversations', 'documents', 'tasks', 'payments', 'processing', 'activity'] as const
type TabId = (typeof tabIds)[number]

export function LeadProfilePage({ id }: { id: string }) {
  const { meta } = useSession()
  const toast = useToast()
  const confirm = useConfirm()
  const { search } = useLocation()
  const requestedTab = search.get('tab') as TabId | null
  const tab: TabId = requestedTab && tabIds.includes(requestedTab) ? requestedTab : 'overview'
  const [refreshKey, setRefreshKey] = useState(0)
  const [callOpen, setCallOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const { data, error, reload } = useQuery(`lead:${id}`, () => api.get<LeadDetail>(`/admin/leads/${id}`), { pollMs: 60_000 })

  const refresh = () => {
    setRefreshKey((value) => value + 1)
    void reload({ silent: true })
  }

  if (error && !data) {
    const notFound = error instanceof ApiError && (error.status === 404 || error.status === 403)
    return notFound
      ? <EmptyState icon="leads" title="Lead not found" description="It may not exist or isn’t assigned to you." action={<Button onClick={() => navigate('/admin/leads')}>Back to leads</Button>} />
      : <ErrorState error={error} onRetry={() => void reload()} />
  }
  if (!data) return <Spinner label="Loading lead" />

  const { lead, counts, openTasks, permissions } = data
  const customer = lead.customer

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true)
    try {
      await action()
      toast.success(message)
      refresh()
    } catch (caught) {
      toast.error(caught)
    } finally {
      setBusy(false)
    }
  }

  async function changeStage(stage: LeadStage) {
    if (stage === lead.stage) return
    if (stage === 'lost') {
      const reason = await confirm({ title: `Mark ${lead.name} as lost`, message: 'Open tasks are cancelled. History is kept and the lead can be revived later.', confirmLabel: 'Mark lost', tone: 'danger', input: { label: 'Lost reason', options: meta.lostReasons } })
      if (reason !== false) await run(() => api.post(`/admin/leads/${id}/stage`, { stage, lostReason: reason }), 'Lead marked as lost')
      return
    }
    const note = await confirm({ title: `Move to ${stageMeta[stage].label}?`, message: 'Next-step tasks are created automatically.', confirmLabel: 'Move lead', input: { label: 'Note', placeholder: 'Optional', required: false } })
    if (note !== false) await run(() => api.post(`/admin/leads/${id}/stage`, { stage, note: note || undefined }), `Moved to ${stageMeta[stage].label}`)
  }

  async function assign(assignedTo: string) {
    const name = assignedTo ? meta.users.find((user) => user.id === assignedTo)?.name : 'nobody'
    const note = await confirm({ title: `${lead.assignedTo ? 'Reassign' : 'Assign'} lead to ${name}?`, message: assignedTo ? 'Open tasks move to the new owner and they are notified.' : 'Open tasks stay with their current owner.', confirmLabel: 'Assign', input: { label: 'Note', placeholder: 'Optional', required: false } })
    if (note !== false) await run(() => api.post(`/admin/leads/${id}/assign`, { assignedTo: assignedTo || null, note: note || undefined }), 'Assignment updated')
  }

  async function markCompleted() {
    const note = await confirm({ title: 'Mark service as completed?', message: 'Use this once the service has been fully delivered to the customer.', confirmLabel: 'Mark completed', input: { label: 'Note', placeholder: 'Optional', required: false } })
    if (note !== false) await run(() => api.post(`/admin/leads/${id}/status`, { status: 'completed', note: note || undefined }), 'Lead completed')
  }

  async function toggleArchive() {
    const archive = !lead.archived
    const ok = await confirm({ title: archive ? 'Archive this lead?' : 'Restore this lead?', message: archive ? 'It will be hidden from lists. All history is kept.' : undefined, confirmLabel: archive ? 'Archive' : 'Restore', tone: archive ? 'danger' : 'primary' })
    if (ok !== false) await run(() => api.post('/admin/leads/bulk', { ids: [id], action: archive ? 'archive' : 'unarchive' }), archive ? 'Lead archived' : 'Lead restored')
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'customer' as const, label: 'Customer' },
    { id: 'calls' as const, label: 'Calls', count: counts.calls },
    { id: 'conversations' as const, label: 'Conversations', count: counts.conversations },
    { id: 'documents' as const, label: 'Documents', count: counts.documents, alert: counts.missingDocuments > 0 },
    { id: 'tasks' as const, label: 'Tasks', count: counts.tasks },
    { id: 'payments' as const, label: 'Payments', count: counts.payments },
    { id: 'processing' as const, label: 'Processing', count: counts.processing },
    { id: 'activity' as const, label: 'Activity', count: counts.activity },
  ]

  return (
    <div className="crm-lead-profile">
      <nav className="crm-breadcrumb"><Link to="/admin/leads">Leads</Link><span aria-hidden="true">›</span><span>{lead.leadId}</span></nav>

      <header className="crm-profile-header">
        <div className="crm-profile-identity">
          <Avatar name={lead.name} size={52} />
          <div>
            <h1>{lead.name} {lead.archived && <Badge>Archived</Badge>}</h1>
            <div className="crm-profile-sub">
              <span>{lead.leadId}</span>
              <span>{customer.customerId}</span>
              <a href={`tel:${lead.phone}`}><Icon name="phone" size={13} /> {lead.phone}</a>
              {lead.email && <a href={`mailto:${lead.email}`}>{lead.email}</a>}
            </div>
            <div className="crm-profile-badges">
              <StageBadge stage={lead.stage} />
              <PriorityBadge priority={lead.priority} />
              <InterestBadge interest={lead.interest} />
              <ScorePill score={lead.score} />
            </div>
          </div>
        </div>
        <div className="crm-profile-actions">
          <Button variant="primary" icon="phone" onClick={() => setCallOpen(true)}>Call now</Button>
          <Select value={lead.stage} disabled={busy} onChange={(event) => void changeStage(event.target.value as LeadStage)} aria-label="Change stage">
            {meta.enums.leadStages.map((stage) => <option key={stage} value={stage}>{stageMeta[stage].label}</option>)}
          </Select>
          {permissions.canAssign && (
            <Select value={lead.assignedTo?._id ?? ''} disabled={busy} onChange={(event) => void assign(event.target.value)} aria-label="Assign lead">
              <option value="">Unassigned</option>
              {meta.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </Select>
          )}
          <Button icon="edit" onClick={() => setEditOpen(true)}>Edit</Button>
          {lead.stage === 'converted' && lead.status !== 'completed' && <Button variant="success" icon="check" disabled={busy} onClick={() => void markCompleted()}>Complete</Button>}
          {permissions.canArchive && <Button variant="ghost" icon="archive" disabled={busy} onClick={() => void toggleArchive()}>{lead.archived ? 'Restore' : 'Archive'}</Button>}
        </div>
      </header>

      <section className="crm-summary-strip" aria-label="Lead summary">
        <div><span>Current status</span><StatusBadge status={lead.status} /></div>
        <div><span>Last interaction</span><strong title={lead.lastInteractionSummary}>{lead.lastInteractionAt ? formatRelative(lead.lastInteractionAt) : 'Never contacted'}</strong>{lead.lastInteractionSummary && <small className="crm-truncate">{lead.lastInteractionSummary}</small>}</div>
        <div><span>Next action</span><strong>{lead.nextAction ?? 'None scheduled'}</strong></div>
        <div><span>Assigned to</span><strong>{lead.assignedTo?.name ?? 'Unassigned'}</strong>{lead.assignedAt && <small>since {formatDate(lead.assignedAt)}</small>}</div>
        <div><span>Due</span><DueLabel date={lead.nextActionDueAt} empty="—" /></div>
      </section>

      <Tabs tabs={tabs} active={tab} onChange={(next) => setSearchParams({ tab: next === 'overview' ? undefined : next })} />

      <div className="crm-tab-panel" role="tabpanel">
        {tab === 'overview' && <OverviewTab detail={data} onChanged={refresh} onOpenTab={(next) => setSearchParams({ tab: next })} />}
        {tab === 'customer' && <CustomerTab key={customer._id + lead.updatedAt} leadId={id} customer={customer} onChanged={refresh} />}
        {tab === 'calls' && <CallsTab key={refreshKey} leadId={id} />}
        {tab === 'conversations' && <ConversationsTab leadId={id} onChanged={refresh} />}
        {tab === 'documents' && <DocumentsTab leadId={id} onChanged={refresh} />}
        {tab === 'tasks' && <LeadTasksTab key={refreshKey} leadId={id} assigneeId={lead.assignedTo?._id} onChanged={refresh} />}
        {tab === 'payments' && <PaymentsTab leadId={id} onChanged={refresh} />}
        {tab === 'processing' && <ProcessingTab leadId={id} onChanged={refresh} />}
        {tab === 'activity' && <ActivityTab leadId={id} refreshKey={refreshKey} />}
      </div>

      <Drawer open={callOpen} onClose={() => setCallOpen(false)} title={`Call ${lead.name}`} subtitle={`${lead.leadId} · ${lead.service}`}>
        {openTasks.length > 0 && <p className="crm-field-hint">Logging this call completes the open call/follow-up task automatically.</p>}
        <LogCallForm
          lead={lead}
          taskId={openTasks.find((task) => task.type === 'call' || task.type === 'follow_up')?._id}
          onLogged={() => {
            setCallOpen(false)
            refresh()
          }}
        />
      </Drawer>

      <EditLeadDrawer key={lead.updatedAt} open={editOpen} lead={lead} onClose={() => setEditOpen(false)} onSaved={refresh} />
    </div>
  )
}

function OverviewTab({ detail, onChanged, onOpenTab }: { detail: LeadDetail; onChanged: () => void; onOpenTab: (tab: TabId) => void }) {
  const toast = useToast()
  const { lead, openTasks, counts } = detail
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function addNote(event: FormEvent) {
    event.preventDefault()
    if (!note.trim()) return
    setSaving(true)
    try {
      await api.post(`/admin/leads/${lead._id}/notes`, { note: note.trim() })
      setNote('')
      toast.success('Note added')
      onChanged()
    } catch (caught) {
      toast.error(caught)
    } finally {
      setSaving(false)
    }
  }

  const balance = Math.max(0, lead.dealValue - lead.amountPaid)

  return (
    <div className="crm-grid crm-grid-profile">
      <div className="crm-stack">
        <Card title="Open tasks" actions={<Button size="sm" variant="ghost" onClick={() => onOpenTab('tasks')}>All tasks</Button>}>
          {openTasks.length === 0
            ? <EmptyState icon="tasks" title="No open tasks" description="Schedule a follow-up or create a task so this lead isn’t forgotten." />
            : <div className="crm-task-list">{openTasks.map((task) => <TaskRow key={task._id} task={task} showLead={false} onChanged={onChanged} />)}</div>}
        </Card>
        <Card title="Add a note">
          <form className="crm-note-form" onSubmit={addNote}>
            <Textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Notes are saved permanently in the activity log" maxLength={5000} />
            <Button type="submit" variant="primary" disabled={!note.trim()} loading={saving}>Save note</Button>
          </form>
        </Card>
        {lead.notes && (
          <Card title="Lead notes">
            <p className="crm-pre">{lead.notes}</p>
          </Card>
        )}
      </div>
      <div className="crm-stack">
        <Card title="Lead details">
          <dl className="crm-dl">
            <div><dt>Service</dt><dd>{lead.service}</dd></div>
            <div><dt>Source</dt><dd>{lead.source}{lead.sourceDetail && <small className="crm-muted"> · {lead.sourceDetail}</small>}</dd></div>
            <div><dt>Follow-up</dt><dd><DueLabel date={lead.followUpAt} /></dd></div>
            <div><dt>Call attempts</dt><dd>{lead.callAttempts} ({lead.connectedCalls} connected)</dd></div>
            <div><dt>Created</dt><dd>{formatDateTime(lead.createdAt)}{lead.createdBy && ` by ${lead.createdBy.name}`}</dd></div>
            <div><dt>Stage since</dt><dd>{lead.stageChangedAt ? formatRelative(lead.stageChangedAt) : '—'}</dd></div>
            {lead.convertedAt && <div><dt>Converted</dt><dd>{formatDateTime(lead.convertedAt)}</dd></div>}
            {lead.completedAt && <div><dt>Completed</dt><dd>{formatDateTime(lead.completedAt)}</dd></div>}
            {lead.lostReason && <div><dt>Lost reason</dt><dd>{lead.lostReason}</dd></div>}
          </dl>
        </Card>
        <Card title="Value" actions={<Button size="sm" variant="ghost" onClick={() => onOpenTab('payments')}>Payments</Button>}>
          <dl className="crm-dl">
            <div><dt>Deal value</dt><dd>{formatCurrency(lead.dealValue)}</dd></div>
            <div><dt>Collected</dt><dd className="crm-text-green">{formatCurrency(lead.amountPaid)}</dd></div>
            <div><dt>Balance</dt><dd>{formatCurrency(balance)}</dd></div>
          </dl>
        </Card>
        {counts.missingDocuments > 0 && (
          <button type="button" className="crm-alert-card" onClick={() => onOpenTab('documents')}>
            <span><strong>{counts.missingDocuments} required document{counts.missingDocuments > 1 ? 's' : ''} missing</strong><small>Open the checklist</small></span>
          </button>
        )}
      </div>
    </div>
  )
}

function EditLeadDrawer({ open, lead, onClose, onSaved }: { open: boolean; lead: Lead; onClose: () => void; onSaved: () => void }) {
  const { meta } = useSession()
  const toast = useToast()
  const initial = {
    name: lead.name,
    email: lead.email ?? '',
    service: lead.service,
    source: lead.source,
    priority: lead.priority as string,
    interest: lead.interest as string,
    dealValue: String(lead.dealValue ?? 0),
    followUpAt: toLocalInput(lead.followUpAt),
    notes: lead.notes ?? '',
  }
  const [form, setForm] = useState(initial)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const changedKeys = (Object.keys(initial) as Array<keyof typeof initial>).filter((key) => form[key] !== initial[key])

  const services = meta.services.includes(lead.service) ? meta.services : [lead.service, ...meta.services]
  const sources = meta.leadSources.includes(lead.source) ? meta.leadSources : [lead.source, ...meta.leadSources]

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!changedKeys.length) return onClose()
    const body: Record<string, unknown> = {}
    for (const key of changedKeys) {
      if (key === 'dealValue') body.dealValue = Number(form.dealValue) || 0
      else if (key === 'followUpAt') body.followUpAt = form.followUpAt ? fromLocalInput(form.followUpAt) : null
      else body[key] = form[key]
    }
    if (note.trim()) body.note = note.trim()
    setSaving(true)
    try {
      await api.patch(`/admin/leads/${lead._id}`, body)
      toast.success('Lead updated')
      onSaved()
      onClose()
    } catch (caught) {
      if (caught instanceof ApiError) setErrors(caught.fields)
      toast.error(caught)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Edit lead" subtitle={lead.leadId} footer={(
      <>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" form="crm-edit-lead" loading={saving} disabled={!changedKeys.length}>Save changes</Button>
      </>
    )}>
      <form id="crm-edit-lead" className="crm-form-grid" onSubmit={submit} noValidate>
        <Field label="Name" error={errors.name}><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Email" error={errors.email}><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
        <Field label="Service">
          <Select value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })}>
            {services.map((service) => <option key={service} value={service}>{service}</option>)}
          </Select>
        </Field>
        <Field label="Source">
          <Select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>
            {sources.map((source) => <option key={source} value={source}>{source}</option>)}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
            {meta.enums.priorities.map((priority) => <option key={priority} value={priority}>{priorityMeta[priority].label}</option>)}
          </Select>
        </Field>
        <Field label="Interest">
          <Select value={form.interest} onChange={(event) => setForm({ ...form, interest: event.target.value })}>
            {meta.enums.interestLevels.map((interest) => <option key={interest} value={interest}>{interestMeta[interest].label}</option>)}
          </Select>
        </Field>
        <Field label="Deal value (₹)" error={errors.dealValue}><Input type="number" min={0} value={form.dealValue} onChange={(event) => setForm({ ...form, dealValue: event.target.value })} /></Field>
        <Field label="Follow-up" hint="Clear to cancel the follow-up" error={errors.followUpAt}>
          <Input type="datetime-local" value={form.followUpAt} onChange={(event) => setForm({ ...form, followUpAt: event.target.value })} />
        </Field>
        <div className="crm-span-2"><Field label="Lead notes"><Textarea rows={4} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field></div>
        <div className="crm-span-2"><Field label="Reason for change" hint="Saved with the activity log entry"><Input value={note} onChange={(event) => setNote(event.target.value)} /></Field></div>
      </form>
    </Drawer>
  )
}
