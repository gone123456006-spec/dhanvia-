import { useState, type FormEvent } from 'react'
import { useConfirm, useSession, useToast } from '../context/contexts'
import { api, ApiError } from '../lib/api'
import { priorityMeta, taskTypeMeta } from '../lib/constants'
import { formatDateTime, fromLocalInput, toLocalInput } from '../lib/format'
import { Link } from './Link'
import type { Task, TaskType } from '../lib/types'
import { DueLabel, PriorityBadge, TaskTypeBadge } from './badges'
import { Icon } from './Icon'
import { Badge, Button, Field, IconButton, Input, Modal, Select, Textarea } from './ui'

export function TaskRow({ task, onChanged, showLead = true }: { task: Task; onChanged: () => void; showLead?: boolean }) {
  const toast = useToast()
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [dueAt, setDueAt] = useState(toLocalInput(task.dueAt))

  async function update(body: Record<string, unknown>, message: string) {
    setBusy(true)
    try {
      await api.patch(`/admin/tasks/${task._id}`, body)
      toast.success(message)
      onChanged()
    } catch (error) {
      toast.error(error)
    } finally {
      setBusy(false)
    }
  }

  async function complete() {
    const note = await confirm({ title: 'Complete task', message: task.title, confirmLabel: 'Mark done', input: { label: 'Outcome note', placeholder: 'Optional', required: false } })
    if (note === false) return
    await update({ status: 'done', outcomeNote: note || undefined }, 'Task completed')
  }

  async function cancel() {
    const reason = await confirm({ title: 'Cancel this task?', message: 'The task stays in history as cancelled.', confirmLabel: 'Cancel task', tone: 'danger', input: { label: 'Reason', required: true } })
    if (reason === false) return
    await update({ status: 'cancelled', outcomeNote: reason }, 'Task cancelled')
  }

  const open = task.status === 'open'

  return (
    <div className={`crm-task-row ${open ? '' : 'closed'}`}>
      <button type="button" className={`crm-task-check ${task.status}`} onClick={open ? complete : () => void update({ status: 'open' }, 'Task reopened')} disabled={busy} aria-label={open ? 'Mark task done' : 'Reopen task'}>
        {task.status === 'done' && <Icon name="check" size={13} />}
        {task.status === 'cancelled' && <Icon name="x" size={13} />}
      </button>
      <div className="crm-task-main">
        <div className="crm-task-title">
          <strong>{task.title}</strong>
          <TaskTypeBadge type={task.type} />
          {task.priority !== 'medium' && <PriorityBadge priority={task.priority} />}
          {task.automationRule && <Badge tone="violet">Auto</Badge>}
        </div>
        <div className="crm-task-meta">
          {open ? <DueLabel date={task.dueAt} /> : <span className="crm-muted">{task.status === 'done' ? 'Completed' : 'Cancelled'} {formatDateTime(task.completedAt)}{task.completedBy ? ` by ${task.completedBy.name}` : ''}</span>}
          {showLead && task.lead && <Link to={`/admin/leads/${task.lead._id}`}>{task.lead.leadId} · {task.lead.name}</Link>}
          {task.assignedTo && <span className="crm-muted">{task.assignedTo.name}</span>}
        </div>
        {task.outcomeNote && !open && <p className="crm-task-note">{task.outcomeNote}</p>}
        {rescheduling && (
          <div className="crm-inline-form">
            <Input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
            <Button size="sm" variant="primary" loading={busy} onClick={async () => {
              const iso = fromLocalInput(dueAt)
              if (!iso) return toast.error(new Error('Choose a valid date'))
              await update({ dueAt: iso }, 'Task rescheduled')
              setRescheduling(false)
            }}>Save</Button>
            <Button size="sm" onClick={() => setRescheduling(false)}>Cancel</Button>
          </div>
        )}
      </div>
      {open && (
        <div className="crm-task-actions">
          {task.lead && (task.type === 'call' || task.type === 'follow_up') && (
            <Link to={`/admin/calls?lead=${task.lead._id}&task=${task._id}`} className="crm-icon-btn" aria-label="Open in calling workspace" title="Call now"><Icon name="phone" /></Link>
          )}
          <IconButton icon="calendar" label="Reschedule" onClick={() => setRescheduling((value) => !value)} />
          <IconButton icon="x" label="Cancel task" onClick={cancel} />
        </div>
      )}
    </div>
  )
}

export function TaskFormModal({ open, onClose, leadId, defaultAssignee, onCreated }: { open: boolean; onClose: () => void; leadId?: string; defaultAssignee?: string; onCreated: () => void }) {
  const { meta, user } = useSession()
  const toast = useToast()
  const [form, setForm] = useState({ type: 'follow_up' as TaskType, title: '', description: '', dueAt: '', priority: 'medium', assignedTo: defaultAssignee ?? user.id })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (form.title.trim().length < 2) next.title = 'Enter a task title'
    if (!form.dueAt) next.dueAt = 'Choose a due date'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    try {
      await api.post('/admin/tasks', { ...form, lead: leadId, dueAt: fromLocalInput(form.dueAt) })
      toast.success('Task created')
      setForm((current) => ({ ...current, title: '', description: '', dueAt: '' }))
      onCreated()
      onClose()
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fields)
      toast.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New task" footer={(
      <>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" form="crm-task-form" loading={saving}>Create task</Button>
      </>
    )}>
      <form id="crm-task-form" className="crm-form-grid" onSubmit={submit} noValidate>
        <Field label="Type">
          <Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as TaskType })}>
            {meta.enums.taskTypes.map((type) => <option key={type} value={type}>{taskTypeMeta[type].label}</option>)}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
            {meta.enums.priorities.map((priority) => <option key={priority} value={priority}>{priorityMeta[priority].label}</option>)}
          </Select>
        </Field>
        <div className="crm-span-2">
          <Field label="Title" required error={errors.title}>
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} autoFocus />
          </Field>
        </div>
        <Field label="Due" required error={errors.dueAt}>
          <Input type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} />
        </Field>
        <Field label="Assign to">
          <Select value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })} disabled={!meta.capabilities.assignLeads}>
            {meta.users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
        </Field>
        <div className="crm-span-2">
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
