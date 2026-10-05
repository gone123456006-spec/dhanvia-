import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useConfirm, useSession, useToast } from '../context/contexts'
import { api, ApiError, downloadFile } from '../lib/api'
import { channelLabels, paymentMethodLabels, processingStatusMeta } from '../lib/constants'
import { formatCurrency, formatDate, formatDateTime, formatDuration, fromLocalInput, humanize, toLocalInput } from '../lib/format'
import { useQuery } from '../lib/hooks'
import type { Activity, Call, Conversation, Customer, LeadDocument, Paged, Payment, ProcessingStep, Task, TaskStatus } from '../lib/types'
import { ActivityTimeline } from './ActivityTimeline'
import { DocumentStatusBadge, InterestBadge, OutcomeBadge, PaymentStatusBadge, ProcessingStatusBadge } from './badges'
import { Icon } from './Icon'
import { TaskFormModal, TaskRow } from './Tasks'
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Pagination, ProgressBar, Select, Skeleton, Textarea } from './ui'

interface TabProps {
  leadId: string
  onChanged: () => void
}

function ListState<T>({ data, error, reload, empty, children }: { data: T[] | null | undefined; error: unknown; reload: () => void; empty: { icon?: Parameters<typeof EmptyState>[0]['icon']; title: string; description?: string }; children: (items: T[]) => ReactNode }) {
  if (error && !data) return <ErrorState error={error} onRetry={reload} />
  if (!data) return <Skeleton rows={4} />
  if (data.length === 0) return <EmptyState {...empty} />
  return <>{children(data)}</>
}

// ── Calls ───────────────────────────────────────────────────────────────────

export function CallsTab({ leadId }: { leadId: string }) {
  const { data, error, reload } = useQuery(`lead-calls:${leadId}`, () => api.get<{ items: Call[] }>(`/admin/leads/${leadId}/calls`))
  return (
    <Card title="Call history" actions={<span className="crm-muted">Call records are permanent and cannot be edited</span>}>
      <ListState data={data?.items} error={error} reload={() => void reload()} empty={{ icon: 'phone', title: 'No calls logged yet', description: 'Use “Call now” to dial and record the outcome.' }}>
        {(items) => (
          <ol className="crm-call-list">
            {items.map((call) => (
              <li key={call._id}>
                <div className="crm-call-head">
                  <OutcomeBadge outcome={call.outcome} />
                  <span>{formatDuration(call.durationSeconds)}</span>
                  {call.interest && call.interest !== 'unknown' && <InterestBadge interest={call.interest} />}
                  <span className="crm-muted">{formatDateTime(call.startedAt)} · {call.agent?.name}</span>
                </div>
                {call.notes && <p>{call.notes}</p>}
                {(call.nextAction || call.followUpAt) && (
                  <div className="crm-call-next">
                    Next: {call.nextAction ?? 'Follow-up'}{call.followUpAt && ` · ${formatDateTime(call.followUpAt)}`}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </ListState>
    </Card>
  )
}

// ── Conversations ───────────────────────────────────────────────────────────

export function ConversationsTab({ leadId, onChanged }: TabProps) {
  const { meta } = useSession()
  const toast = useToast()
  const { data, error, reload } = useQuery(`lead-conversations:${leadId}`, () => api.get<{ items: Conversation[] }>(`/admin/leads/${leadId}/conversations`))
  const [form, setForm] = useState({ channel: 'whatsapp', direction: 'outbound', summary: '', occurredAt: '' })
  const [summaryError, setSummaryError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!form.summary.trim()) return setSummaryError('Write a summary of the conversation')
    setSaving(true)
    try {
      await api.post(`/admin/leads/${leadId}/conversations`, { ...form, occurredAt: fromLocalInput(form.occurredAt) })
      toast.success('Conversation logged')
      setForm({ ...form, summary: '', occurredAt: '' })
      setSummaryError('')
      await reload({ silent: true })
      onChanged()
    } catch (caught) {
      toast.error(caught)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="crm-stack">
      <Card title="Log a conversation">
        <form className="crm-form-grid" onSubmit={submit} noValidate>
          <Field label="Channel">
            <Select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}>
              {meta.enums.conversationChannels.map((channel) => <option key={channel} value={channel}>{channelLabels[channel] ?? humanize(channel)}</option>)}
            </Select>
          </Field>
          <Field label="Direction">
            <Select value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value })}>
              <option value="outbound">Outbound (we contacted)</option>
              <option value="inbound">Inbound (customer contacted)</option>
            </Select>
          </Field>
          <div className="crm-span-2">
            <Field label="Summary" required error={summaryError}>
              <Textarea rows={3} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="What was discussed?" />
            </Field>
          </div>
          <Field label="When" hint="Leave empty for now">
            <Input type="datetime-local" value={form.occurredAt} max={toLocalInput(new Date())} onChange={(event) => setForm({ ...form, occurredAt: event.target.value })} />
          </Field>
          <div className="crm-form-actions"><Button type="submit" variant="primary" icon="plus" loading={saving}>Log conversation</Button></div>
        </form>
      </Card>
      <Card title="Conversation history">
        <ListState data={data?.items} error={error} reload={() => void reload()} empty={{ icon: 'message', title: 'No conversations logged', description: 'Record WhatsApp, email, SMS, or meeting interactions here.' }}>
          {(items) => (
            <ol className="crm-call-list">
              {items.map((item) => (
                <li key={item._id}>
                  <div className="crm-call-head">
                    <Badge tone="blue">{channelLabels[item.channel] ?? humanize(item.channel)}</Badge>
                    <span className="crm-muted">{item.direction === 'inbound' ? 'Inbound' : 'Outbound'}</span>
                    <span className="crm-muted">{formatDateTime(item.occurredAt)} · {item.author?.name}</span>
                  </div>
                  <p>{item.summary}</p>
                </li>
              ))}
            </ol>
          )}
        </ListState>
      </Card>
    </div>
  )
}

// ── Documents ───────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const acceptedFiles = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx'

function DocumentRow({ document, onChanged }: { document: LeadDocument; onChanged: () => void }) {
  const toast = useToast()
  const confirm = useConfirm()
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true)
    try {
      await action()
      toast.success(message)
      onChanged()
    } catch (caught) {
      toast.error(caught)
    } finally {
      setBusy(false)
    }
  }

  async function upload(file: File) {
    if (file.size > 10 * 1024 * 1024) return toast.error(new Error('Files must be 10 MB or smaller'))
    const form = new FormData()
    form.append('file', file)
    await run(() => api.upload(`/admin/documents/${document._id}/file`, form), `${document.name} uploaded`)
  }

  async function reject() {
    const reason = await confirm({ title: `Reject ${document.name}?`, message: 'The customer will need to provide it again.', confirmLabel: 'Reject', tone: 'danger', input: { label: 'Reason', required: true } })
    if (reason !== false) await run(() => api.patch(`/admin/documents/${document._id}`, { status: 'rejected', notes: reason }), 'Document rejected')
  }

  return (
    <li className="crm-doc-row">
      <div className="crm-doc-main">
        <div className="crm-task-title">
          <strong>{document.name}</strong>
          <DocumentStatusBadge status={document.status} />
          {!document.required && <Badge>Optional</Badge>}
        </div>
        <div className="crm-task-meta">
          {document.file ? (
            <button type="button" className="crm-link" onClick={() => void downloadFile(`/admin/documents/${document._id}/file`, document.file!.filename).catch(toast.error)}>
              Download {document.file.filename} ({formatBytes(document.file.size)})
            </button>
          ) : <span className="crm-muted">No file uploaded</span>}
          {document.file?.uploadedAt && <span className="crm-muted">Uploaded {formatDateTime(document.file.uploadedAt)}{document.file.uploadedBy ? ` by ${document.file.uploadedBy.name}` : ''}</span>}
        </div>
        {document.notes && <p className="crm-task-note">{document.notes}</p>}
      </div>
      <div className="crm-task-actions">
        <input ref={fileInput} type="file" hidden accept={acceptedFiles} onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void upload(file)
        }} />
        <Button size="sm" icon="upload" disabled={busy} onClick={() => fileInput.current?.click()}>{document.file ? 'Replace' : 'Upload'}</Button>
        {(document.status === 'required' || document.status === 'rejected') && (
          <Button size="sm" disabled={busy} onClick={() => void run(() => api.patch(`/admin/documents/${document._id}`, { status: 'received' }), 'Marked received')}>Mark received</Button>
        )}
        {document.status === 'received' && (
          <Button size="sm" variant="success" icon="check" disabled={busy} onClick={() => void run(() => api.patch(`/admin/documents/${document._id}`, { status: 'verified' }), 'Document verified')}>Verify</Button>
        )}
        {document.status !== 'required' && document.status !== 'rejected' && <Button size="sm" variant="ghost" disabled={busy} onClick={() => void reject()}>Reject</Button>}
      </div>
    </li>
  )
}

export function DocumentsTab({ leadId, onChanged }: TabProps) {
  const toast = useToast()
  const { data, error, reload } = useQuery(`lead-documents:${leadId}`, () => api.get<{ items: LeadDocument[] }>(`/admin/leads/${leadId}/documents`))
  const [name, setName] = useState('')
  const [required, setRequired] = useState(true)
  const [saving, setSaving] = useState(false)
  const items = data?.items ?? []
  const requiredDocs = items.filter((doc) => doc.required)
  const complete = requiredDocs.filter((doc) => doc.status === 'received' || doc.status === 'verified').length

  const refresh = () => {
    void reload({ silent: true })
    onChanged()
  }

  async function add(event: FormEvent) {
    event.preventDefault()
    if (name.trim().length < 2) return toast.error(new Error('Enter a document name'))
    setSaving(true)
    try {
      await api.post(`/admin/leads/${leadId}/documents`, { name: name.trim(), required })
      setName('')
      toast.success('Document added to checklist')
      refresh()
    } catch (caught) {
      toast.error(caught)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      title="Document checklist"
      actions={requiredDocs.length > 0 && (
        <div className="crm-inline-progress">
          <span>{complete}/{requiredDocs.length} required received</span>
          <ProgressBar value={(complete / requiredDocs.length) * 100} tone={complete === requiredDocs.length ? 'green' : 'amber'} />
        </div>
      )}
    >
      <form className="crm-inline-form" onSubmit={add}>
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Add a document, e.g. PAN card" aria-label="Document name" />
        <label className="crm-checkbox"><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} /> Required</label>
        <Button type="submit" icon="plus" loading={saving}>Add</Button>
      </form>
      <ListState data={data?.items} error={error} reload={() => void reload()} empty={{ icon: 'file', title: 'No documents requested', description: 'Moving the lead to the Documents stage adds the service’s default checklist automatically.' }}>
        {(docs) => <ul className="crm-doc-list">{docs.map((doc) => <DocumentRow key={doc._id} document={doc} onChanged={refresh} />)}</ul>}
      </ListState>
      <p className="crm-field-hint">When every required document is received or verified, the lead moves to Processing automatically. Accepted: PDF, images, Word, Excel up to 10 MB.</p>
    </Card>
  )
}

// ── Payments ────────────────────────────────────────────────────────────────

export function PaymentsTab({ leadId, onChanged }: TabProps) {
  const { meta } = useSession()
  const toast = useToast()
  const confirm = useConfirm()
  const { data, error, reload } = useQuery(`lead-payments:${leadId}`, () => api.get<{ items: Payment[]; dealValue: number; amountPaid: number }>(`/admin/leads/${leadId}/payments`))
  const [form, setForm] = useState({ amount: '', method: 'upi', status: 'pending', reference: '', description: '', dueAt: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = () => {
    void reload({ silent: true })
    onChanged()
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount < 1) return setErrors({ amount: 'Enter an amount of at least ₹1' })
    setSaving(true)
    try {
      await api.post(`/admin/leads/${leadId}/payments`, { ...form, amount, dueAt: form.dueAt ? new Date(`${form.dueAt}T23:59:00`).toISOString() : undefined })
      toast.success(form.status === 'paid' ? 'Payment recorded' : 'Payment request added')
      setForm({ ...form, amount: '', reference: '', description: '', dueAt: '' })
      setErrors({})
      refresh()
    } catch (caught) {
      if (caught instanceof ApiError) setErrors(caught.fields)
      toast.error(caught)
    } finally {
      setSaving(false)
    }
  }

  async function update(payment: Payment, status: Payment['status']) {
    const reference = status === 'paid'
      ? await confirm({ title: `Mark ${formatCurrency(payment.amount)} as paid?`, confirmLabel: 'Mark paid', input: { label: 'Transaction reference', placeholder: 'UTR / receipt number (optional)', required: false } })
      : await confirm({ title: `Mark payment as ${status}?`, tone: 'danger', confirmLabel: 'Confirm', input: { label: 'Note', required: true } })
    if (reference === false) return
    setBusyId(payment._id)
    try {
      await api.patch(`/admin/payments/${payment._id}`, status === 'paid' ? { status, reference: reference || undefined } : { status, note: reference })
      toast.success('Payment updated')
      refresh()
    } catch (caught) {
      toast.error(caught)
    } finally {
      setBusyId(null)
    }
  }

  const due = Math.max(0, (data?.dealValue ?? 0) - (data?.amountPaid ?? 0))
  const canManage = meta.capabilities.managePayments

  return (
    <div className="crm-stack">
      {data && (
        <div className="crm-mini-stats">
          <div><span>Deal value</span><strong>{formatCurrency(data.dealValue)}</strong></div>
          <div><span>Collected</span><strong className="crm-text-green">{formatCurrency(data.amountPaid)}</strong></div>
          <div><span>Balance</span><strong className={due ? 'crm-text-amber' : ''}>{formatCurrency(due)}</strong></div>
        </div>
      )}
      {canManage && <Card title="Record a payment">
        <form className="crm-form-grid crm-form-grid-3" onSubmit={submit} noValidate>
          <Field label="Amount (₹)" required error={errors.amount}>
            <Input type="number" min={1} step="1" inputMode="numeric" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder={due ? String(due) : undefined} />
          </Field>
          <Field label="Method">
            <Select value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>
              {meta.enums.paymentMethods.map((method) => <option key={method} value={method}>{paymentMethodLabels[method] ?? humanize(method)}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="pending">Pending (request)</option>
              <option value="paid">Paid (received)</option>
            </Select>
          </Field>
          <Field label="Reference">
            <Input value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} placeholder="UTR / invoice no." />
          </Field>
          {form.status === 'pending' && (
            <Field label="Due date">
              <Input type="date" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} />
            </Field>
          )}
          <Field label="Description">
            <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="e.g. Advance, Govt. fee" />
          </Field>
          <div className="crm-form-actions crm-span-3"><Button type="submit" variant="primary" icon="plus" loading={saving}>Save payment</Button></div>
        </form>
      </Card>}
      <Card title="Payments" padded={false}>
        <ListState data={data?.items} error={error} reload={() => void reload()} empty={{ icon: 'rupee', title: 'No payments yet', description: 'When all payments are marked paid, the lead converts automatically.' }}>
          {(items) => (
            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead><tr><th>Amount</th><th>Status</th><th>Method</th><th>Reference</th><th>Due / Paid</th><th>Recorded by</th><th /></tr></thead>
                <tbody>
                  {items.map((payment) => (
                    <tr key={payment._id}>
                      <td><strong>{formatCurrency(payment.amount)}</strong>{payment.description && <div className="crm-muted">{payment.description}</div>}</td>
                      <td><PaymentStatusBadge status={payment.status} /></td>
                      <td>{paymentMethodLabels[payment.method] ?? humanize(payment.method)}</td>
                      <td>{payment.reference ?? '—'}</td>
                      <td>{payment.paidAt ? `Paid ${formatDate(payment.paidAt)}` : payment.dueAt ? `Due ${formatDate(payment.dueAt)}` : '—'}</td>
                      <td>{payment.recordedBy?.name ?? '—'}<div className="crm-muted">{formatDateTime(payment.createdAt)}</div></td>
                      <td className="crm-row-actions">
                        {canManage && payment.status === 'pending' && <Button size="sm" variant="success" icon="check" disabled={busyId === payment._id} onClick={() => void update(payment, 'paid')}>Mark paid</Button>}
                        {canManage && payment.status === 'pending' && <Button size="sm" variant="ghost" disabled={busyId === payment._id} onClick={() => void update(payment, 'failed')}>Failed</Button>}
                        {canManage && payment.status === 'paid' && <Button size="sm" variant="ghost" disabled={busyId === payment._id} onClick={() => void update(payment, 'refunded')}>Refund</Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ListState>
      </Card>
    </div>
  )
}

// ── Processing ──────────────────────────────────────────────────────────────

export function ProcessingTab({ leadId, onChanged }: TabProps) {
  const { meta } = useSession()
  const toast = useToast()
  const { data, error, reload } = useQuery(`lead-processing:${leadId}`, () => api.get<{ items: ProcessingStep[] }>(`/admin/leads/${leadId}/processing`))
  const [form, setForm] = useState({ title: '', owner: '', dueAt: '', reference: '' })
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const items = data?.items ?? []
  const done = items.filter((step) => step.status === 'done').length

  const refresh = () => {
    void reload({ silent: true })
    onChanged()
  }

  async function add(event: FormEvent) {
    event.preventDefault()
    if (form.title.trim().length < 2) return toast.error(new Error('Enter a step title'))
    setSaving(true)
    try {
      await api.post(`/admin/leads/${leadId}/processing`, { ...form, dueAt: fromLocalInput(form.dueAt) })
      setForm({ title: '', owner: '', dueAt: '', reference: '' })
      toast.success('Processing step added')
      refresh()
    } catch (caught) {
      toast.error(caught)
    } finally {
      setSaving(false)
    }
  }

  async function setStatus(step: ProcessingStep, status: string) {
    setBusyId(step._id)
    try {
      await api.patch(`/admin/processing/${step._id}`, { status })
      toast.success(`Step marked ${processingStatusMeta[status]?.label.toLowerCase() ?? status}`)
      refresh()
    } catch (caught) {
      toast.error(caught)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card
      title="Processing / filing steps"
      actions={items.length > 0 && (
        <div className="crm-inline-progress"><span>{done}/{items.length} done</span><ProgressBar value={(done / items.length) * 100} tone="teal" /></div>
      )}
    >
      <form className="crm-form-grid crm-form-grid-4" onSubmit={add} noValidate>
        <Field label="Step"><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. File application" /></Field>
        <Field label="Owner">
          <Select value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })}>
            <option value="">Lead owner</option>
            {meta.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </Select>
        </Field>
        <Field label="Due"><Input type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} /></Field>
        <Field label="Reference / ARN"><Input value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} /></Field>
        <div className="crm-form-actions crm-span-4"><Button type="submit" icon="plus" loading={saving}>Add step</Button></div>
      </form>
      <ListState data={data?.items} error={error} reload={() => void reload()} empty={{ icon: 'cog', title: 'No processing steps yet', description: 'Track government filings, approvals, and internal work for this service.' }}>
        {(steps) => (
          <ol className="crm-steps">
            {steps.map((step, index) => (
              <li key={step._id} className={`status-${step.status}`}>
                <span className="crm-step-index">{step.status === 'done' ? <Icon name="check" size={13} /> : index + 1}</span>
                <div className="crm-doc-main">
                  <div className="crm-task-title"><strong>{step.title}</strong><ProcessingStatusBadge status={step.status} /></div>
                  <div className="crm-task-meta">
                    {step.owner && <span>{step.owner.name}</span>}
                    {step.dueAt && step.status !== 'done' && <span>Due {formatDateTime(step.dueAt)}</span>}
                    {step.completedAt && <span>Completed {formatDateTime(step.completedAt)}</span>}
                    {step.reference && <span>Ref: {step.reference}</span>}
                  </div>
                  {step.notes && <p className="crm-task-note">{step.notes}</p>}
                </div>
                <Select value={step.status} disabled={busyId === step._id} onChange={(event) => void setStatus(step, event.target.value)} aria-label={`Status of ${step.title}`}>
                  {meta.enums.processingStatuses.map((status) => <option key={status} value={status}>{processingStatusMeta[status]?.label ?? humanize(status)}</option>)}
                </Select>
              </li>
            ))}
          </ol>
        )}
      </ListState>
    </Card>
  )
}

// ── Customer ────────────────────────────────────────────────────────────────

const customerFields: Array<{ key: keyof Customer; label: string; placeholder?: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'alternatePhone', label: 'Alternate phone' },
  { key: 'company', label: 'Company' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'pan', label: 'PAN', placeholder: 'ABCDE1234F' },
  { key: 'gstin', label: 'GSTIN', placeholder: '22ABCDE1234F1Z5' },
  { key: 'address', label: 'Address' },
]

export function CustomerTab({ leadId, customer, onChanged }: TabProps & { customer: Customer }) {
  const toast = useToast()
  const initial = Object.fromEntries(customerFields.map(({ key }) => [key, String(customer[key] ?? '')]))
  const [form, setForm] = useState<Record<string, string>>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const changed = customerFields.filter(({ key }) => form[key] !== initial[key])
  const filled = customerFields.filter(({ key }) => initial[key])
  const missing = customerFields.length - filled.length

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!changed.length) return
    setSaving(true)
    try {
      await api.patch(`/admin/leads/${leadId}/customer`, Object.fromEntries(changed.map(({ key }) => [key, form[key]])))
      toast.success('Customer updated')
      setErrors({})
      setEditing(false)
      onChanged()
    } catch (caught) {
      if (caught instanceof ApiError) setErrors(caught.fields)
      toast.error(caught)
    } finally {
      setSaving(false)
    }
  }

  const phone = (
    <a href={`tel:${customer.phone}`}>{customer.callingCode && !customer.phone.startsWith('+') ? `${customer.callingCode} ` : ''}{customer.phone}</a>
  )

  if (!editing) {
    return (
      <Card
        title={`Customer ${customer.customerId}`}
        actions={<Button size="sm" onClick={() => setEditing(true)}>Edit details</Button>}
      >
        <dl className="crm-dl crm-dl-compact">
          <div><dt>Phone</dt><dd>{phone}</dd></div>
          {filled.map(({ key, label }) => (
            <div key={key}><dt>{label}</dt><dd className={key === 'address' ? 'crm-pre' : undefined}>{initial[key]}</dd></div>
          ))}
          <div><dt>Customer since</dt><dd>{formatDate(customer.createdAt)}</dd></div>
        </dl>
        {missing > 0 && <p className="crm-field-hint">{missing} detail{missing > 1 ? 's' : ''} not added yet (PAN, GSTIN, address…). Tap “Edit details” to add them.</p>}
      </Card>
    )
  }

  return (
    <Card title={`Edit customer ${customer.customerId}`} actions={<span className="crm-muted">Phone {phone}</span>}>
      <form className="crm-form-grid crm-form-grid-3" onSubmit={submit} noValidate>
        {customerFields.map(({ key, label, placeholder }) => (
          <div key={key} className={key === 'address' ? 'crm-span-3' : undefined}>
            <Field label={label} error={errors[key]}>
              {key === 'address'
                ? <Textarea rows={2} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
                : <Input value={form[key]} placeholder={placeholder} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />}
            </Field>
          </div>
        ))}
        <div className="crm-form-actions crm-span-3">
          <Button onClick={() => { setForm(initial); setErrors({}); setEditing(false) }}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!changed.length} loading={saving}>Save customer</Button>
        </div>
      </form>
    </Card>
  )
}

// ── Tasks ───────────────────────────────────────────────────────────────────

export function LeadTasksTab({ leadId, assigneeId, onChanged }: TabProps & { assigneeId?: string }) {
  const [status, setStatus] = useState<TaskStatus>('open')
  const [creating, setCreating] = useState(false)
  const { data, error, reload } = useQuery(`lead-tasks:${leadId}:${status}`, () => api.get<Paged<Task>>(`/admin/tasks?lead=${leadId}&status=${status}&limit=100`))
  const refresh = () => {
    void reload({ silent: true })
    onChanged()
  }
  return (
    <Card
      title="Tasks"
      actions={(
        <>
          <div className="crm-segmented">
            {(['open', 'done', 'cancelled'] as const).map((item) => <button key={item} type="button" className={status === item ? 'active' : ''} onClick={() => setStatus(item)}>{humanize(item)}</button>)}
          </div>
          <Button size="sm" variant="primary" icon="plus" onClick={() => setCreating(true)}>Task</Button>
        </>
      )}
    >
      <ListState data={data?.items} error={error} reload={() => void reload()} empty={{ icon: 'tasks', title: status === 'open' ? 'No open tasks' : `No ${status} tasks` }}>
        {(items) => <div className="crm-task-list">{items.map((task) => <TaskRow key={task._id} task={task} showLead={false} onChanged={refresh} />)}</div>}
      </ListState>
      <TaskFormModal open={creating} onClose={() => setCreating(false)} leadId={leadId} defaultAssignee={assigneeId} onCreated={refresh} />
    </Card>
  )
}

// ── Activity ────────────────────────────────────────────────────────────────

export function ActivityTab({ leadId, refreshKey }: { leadId: string; refreshKey: number }) {
  const [page, setPage] = useState(1)
  const { data, error, reload } = useQuery(`lead-activity:${leadId}:${page}:${refreshKey}`, () => api.get<Paged<Activity>>(`/admin/leads/${leadId}/activity?page=${page}&limit=30`))
  return (
    <Card title="Activity log" actions={<span className="crm-muted">Complete, permanent audit trail</span>}>
      <ListState data={data?.items} error={error} reload={() => void reload()} empty={{ icon: 'activity', title: 'No activity yet' }}>
        {(items) => <ActivityTimeline items={items} />}
      </ListState>
      {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPage={setPage} />}
    </Card>
  )
}
