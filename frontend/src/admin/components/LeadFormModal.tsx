import { useState, type FormEvent } from 'react'
import { useConfirm, useSession, useToast } from '../context/contexts'
import { api, ApiError } from '../lib/api'
import { interestMeta, priorityMeta } from '../lib/constants'
import { fromLocalInput } from '../lib/format'
import { navigate } from '../lib/router'
import type { Lead } from '../lib/types'
import { Button, Field, Input, Modal, Select, Textarea } from './ui'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  service: '',
  source: '',
  priority: 'medium',
  interest: 'unknown',
  dealValue: '',
  assignedTo: '',
  followUpAt: '',
  company: '',
  city: '',
  notes: '',
}

export function LeadFormModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (lead: Lead) => void }) {
  const { meta, user } = useSession()
  const toast = useToast()
  const confirm = useConfirm()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const canAssign = meta.capabilities.assignLeads

  const set = (key: keyof typeof emptyForm) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  function validate() {
    const next: Record<string, string> = {}
    if (form.name.trim().length < 2) next.name = 'Enter the customer’s name'
    if (!/^\+?\d{7,15}$/.test(form.phone.replace(/[\s()-]/g, ''))) next.phone = 'Enter a valid phone number'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email'
    if (!form.service.trim()) next.service = 'Select or type a service'
    if (!form.source.trim()) next.source = 'Select or type a lead source'
    if (form.followUpAt && new Date(form.followUpAt).getTime() < Date.now()) next.followUpAt = 'Choose a future time'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit(event: FormEvent, allowDuplicate = false) {
    event.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const { lead } = await api.post<{ lead: Lead }>('/admin/leads', {
        ...form,
        dealValue: form.dealValue ? Number(form.dealValue) : undefined,
        followUpAt: fromLocalInput(form.followUpAt),
        assignedTo: canAssign ? form.assignedTo || undefined : undefined,
        allowDuplicate,
      })
      toast.success(`Lead ${lead.leadId} created`)
      setForm(emptyForm)
      onClose()
      onCreated?.(lead)
      navigate(`/admin/leads/${lead._id}`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && error.data.duplicateId) {
        const choice = await confirm({
          title: 'Possible duplicate lead',
          message: `${error.message}. Open the existing lead instead, or create a separate lead anyway?`,
          confirmLabel: 'Create anyway',
        })
        if (choice) return submit(event, true)
        onClose()
        navigate(`/admin/leads/${error.data.duplicateId}`)
        return
      }
      if (error instanceof ApiError) setErrors(error.fields)
      toast.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add new lead"
      size="lg"
      footer={(
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="crm-lead-form" loading={saving}>Create lead</Button>
        </>
      )}
    >
      <form id="crm-lead-form" className="crm-form-grid" onSubmit={(event) => void submit(event)} noValidate>
        <Field label="Customer name" required error={errors.name} htmlFor="lead-name">
          <Input id="lead-name" value={form.name} onChange={set('name')} autoFocus />
        </Field>
        <Field label="Phone" required error={errors.phone} htmlFor="lead-phone">
          <Input id="lead-phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Email" error={errors.email} htmlFor="lead-email">
          <Input id="lead-email" type="email" value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Company" htmlFor="lead-company">
          <Input id="lead-company" value={form.company} onChange={set('company')} />
        </Field>
        <Field label="Service" required error={errors.service} htmlFor="lead-service" hint="Pick from the catalogue or type a new one">
          <Input id="lead-service" list="crm-services" value={form.service} onChange={set('service')} />
          <datalist id="crm-services">{meta.services.map((service) => <option key={service} value={service} />)}</datalist>
        </Field>
        <Field label="Lead source" required error={errors.source} htmlFor="lead-source">
          <Input id="lead-source" list="crm-sources" value={form.source} onChange={set('source')} />
          <datalist id="crm-sources">{meta.leadSources.map((source) => <option key={source} value={source} />)}</datalist>
        </Field>
        <Field label="Priority" htmlFor="lead-priority">
          <Select id="lead-priority" value={form.priority} onChange={set('priority')}>
            {meta.enums.priorities.map((priority) => <option key={priority} value={priority}>{priorityMeta[priority].label}</option>)}
          </Select>
        </Field>
        <Field label="Interest" htmlFor="lead-interest">
          <Select id="lead-interest" value={form.interest} onChange={set('interest')}>
            {meta.enums.interestLevels.map((interest) => <option key={interest} value={interest}>{interestMeta[interest].label}</option>)}
          </Select>
        </Field>
        <Field label="Deal value (₹)" htmlFor="lead-deal" hint="Leave empty to use the service price">
          <Input id="lead-deal" type="number" min={0} value={form.dealValue} onChange={set('dealValue')} />
        </Field>
        <Field label="Assign to" htmlFor="lead-assign" hint={canAssign ? 'Leave empty for automatic round-robin assignment' : 'New leads you create are assigned to you'}>
          <Select id="lead-assign" value={canAssign ? form.assignedTo : user.id} onChange={set('assignedTo')} disabled={!canAssign}>
            {canAssign && <option value="">Auto-assign</option>}
            {meta.users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
        </Field>
        <Field label="City" htmlFor="lead-city">
          <Input id="lead-city" value={form.city} onChange={set('city')} />
        </Field>
        <Field label="First follow-up" error={errors.followUpAt} htmlFor="lead-follow">
          <Input id="lead-follow" type="datetime-local" value={form.followUpAt} onChange={set('followUpAt')} />
        </Field>
        <div className="crm-span-2">
          <Field label="Notes" htmlFor="lead-notes">
            <Textarea id="lead-notes" rows={3} value={form.notes} onChange={set('notes')} />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
