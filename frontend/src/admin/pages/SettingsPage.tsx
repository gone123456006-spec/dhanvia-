import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { serviceMegaMenus } from '../../constants/data'
import { PageHeader } from '../components/Layout'
import { Badge, Button, Card, EmptyState, ErrorState, Field, IconButton, Input, SearchInput, Skeleton, Tabs, Toggle } from '../components/ui'
import { useConfirm, useSession, useToast } from '../context/contexts'
import { api, ApiError } from '../lib/api'
import { formatCurrency } from '../lib/format'
import { useQuery } from '../lib/hooks'
import { setSearchParams, useLocation } from '../lib/router'

interface ServiceSetting {
  _id?: string
  name: string
  category?: string
  price: number
  active: boolean
  defaultDocuments: string[]
}

interface Automation {
  autoAssignNewLeads: boolean
  createCallTaskOnAssign: boolean
  callTaskDueMinutes: number
  retryCallAfterHours: number
  createFollowUpOnInterested: boolean
  followUpDelayHours: number
  createTaskOnStageChange: boolean
  documentsCompleteToProcessing: boolean
  paymentCompleteToConverted: boolean
  notifyOverdueToSuperAdmins: boolean
  paymentReminderDays: number
}

interface Settings {
  services: ServiceSetting[]
  leadSources: string[]
  lostReasons: string[]
  automation: Automation
  updatedAt?: string
}

type SettingsTab = 'services' | 'lists' | 'automation' | 'account'

export function SettingsPage() {
  const { meta } = useSession()
  const { search } = useLocation()
  const isSuperAdmin = meta.capabilities.isSuperAdmin
  const available: SettingsTab[] = isSuperAdmin ? ['services', 'lists', 'automation', 'account'] : ['account']
  const requested = search.get('tab') as SettingsTab | null
  const tab = requested && available.includes(requested) ? requested : available[0]
  const { data, error, reload } = useQuery('settings', () => api.get<{ settings: Settings }>('/admin/settings'), { enabled: isSuperAdmin })
  const labels: Record<SettingsTab, string> = { services: 'Services & pricing', lists: 'Sources & lost reasons', automation: 'Automation rules', account: 'My account' }

  return (
    <>
      <PageHeader title="Settings" description={isSuperAdmin ? 'Configure services, pick-lists and workflow automation. Every change is recorded in the audit log.' : 'Manage your account.'} />
      {available.length > 1 && <Tabs tabs={available.map((id) => ({ id, label: labels[id] }))} active={tab} onChange={(next) => setSearchParams({ tab: next })} />}
      {tab === 'account' ? <AccountSettings /> : error && !data ? <ErrorState error={error} onRetry={() => void reload()} /> : !data ? <Skeleton rows={8} /> : (
        <>
          {tab === 'services' && <ServicesSettings key={data.settings.updatedAt} initial={data.settings.services} onSaved={() => void reload({ silent: true })} />}
          {tab === 'lists' && <ListsSettings key={data.settings.updatedAt} settings={data.settings} onSaved={() => void reload({ silent: true })} />}
          {tab === 'automation' && <AutomationSettings key={data.settings.updatedAt} initial={data.settings.automation} onSaved={() => void reload({ silent: true })} />}
        </>
      )}
    </>
  )
}

function useSaveSettings(onSaved: () => void) {
  const toast = useToast()
  const { refreshMeta } = useSession()
  const [saving, setSaving] = useState(false)
  async function save(body: Partial<Settings>, message: string) {
    setSaving(true)
    try {
      await api.put('/admin/settings', body)
      toast.success(message)
      await refreshMeta()
      onSaved()
      return true
    } catch (caught) {
      toast.error(caught)
      return false
    } finally {
      setSaving(false)
    }
  }
  return { saving, save }
}

// ── Services ────────────────────────────────────────────────────────────────

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (values: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const value = draft.trim()
    if (value && !values.some((item) => item.toLowerCase() === value.toLowerCase())) onChange([...values, value])
    setDraft('')
  }
  return (
    <div className="crm-tag-input">
      {values.map((value) => (
        <span key={value} className="crm-tag">
          {value}
          <button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((item) => item !== value))}>×</button>
        </span>
      ))}
      <input
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault()
            add()
          } else if (event.key === 'Backspace' && !draft && values.length) {
            onChange(values.slice(0, -1))
          }
        }}
        onBlur={add}
      />
    </div>
  )
}

function websiteCatalog(): ServiceSetting[] {
  const seen = new Set<string>()
  const services: ServiceSetting[] = []
  for (const menu of serviceMegaMenus) {
    for (const category of menu.categories) {
      for (const name of category.services) {
        const key = name.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        services.push({ name, category: `${menu.label} · ${category.category}`, price: 0, active: true, defaultDocuments: [] })
      }
    }
  }
  return services
}

function ServicesSettings({ initial, onSaved }: { initial: ServiceSetting[]; onSaved: () => void }) {
  const confirm = useConfirm()
  const [services, setServices] = useState(initial)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [newName, setNewName] = useState('')
  const { saving, save } = useSaveSettings(onSaved)
  const dirty = JSON.stringify(services) !== JSON.stringify(initial)
  const update = (index: number, patch: Partial<ServiceSetting>) => setServices(services.map((service, i) => (i === index ? { ...service, ...patch } : service)))
  const visible = services.map((service, index) => ({ service, index })).filter(({ service }) => !query || `${service.name} ${service.category ?? ''}`.toLowerCase().includes(query.toLowerCase()))

  async function importWebsite() {
    const existing = new Set(services.map((service) => service.name.toLowerCase()))
    const missing = websiteCatalog().filter((service) => !existing.has(service.name.toLowerCase()))
    if (!missing.length) return void confirm({ title: 'Already up to date', message: 'Every service from the website menu is already in your list.', confirmLabel: 'OK' })
    const ok = await confirm({ title: `Add ${missing.length} services from the website?`, message: 'They are added with price ₹0 so you can set prices and document checklists before saving.', confirmLabel: 'Add services' })
    if (ok !== false) setServices([...services, ...missing])
  }

  function addService(event: FormEvent) {
    event.preventDefault()
    const name = newName.trim()
    if (name.length < 2 || services.some((service) => service.name.toLowerCase() === name.toLowerCase())) return
    setServices([{ name, price: 0, active: true, defaultDocuments: [] }, ...services])
    setNewName('')
    setExpanded(0)
  }

  return (
    <Card
      title={`Services (${services.length})`}
      actions={(
        <>
          <Button size="sm" icon="download" onClick={() => void importWebsite()}>Import from website</Button>
          {dirty && <Button size="sm" onClick={() => setServices(initial)}>Discard</Button>}
          <Button size="sm" variant="primary" disabled={!dirty} loading={saving} onClick={() => void save({ services }, 'Services saved')}>Save services</Button>
        </>
      )}
    >
      <p className="crm-field-hint">The price becomes the default deal value for new leads. Default documents are added to the checklist when a lead reaches the Documents stage.</p>
      <div className="crm-filters crm-filters-bare">
        <SearchInput value={query} onChange={setQuery} placeholder="Filter services" />
        <form className="crm-inline-form" onSubmit={addService}>
          <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="New service name" aria-label="New service name" />
          <Button type="submit" icon="plus" disabled={newName.trim().length < 2}>Add</Button>
        </form>
      </div>
      {services.length === 0 ? (
        <EmptyState icon="settings" title="No services configured" description="Import the services listed on your website, or add them one by one." action={<Button variant="primary" icon="download" onClick={() => void importWebsite()}>Import from website</Button>} />
      ) : (
        <ul className="crm-service-list">
          {visible.map(({ service, index }) => (
            <li key={service._id ?? `new-${service.name}`} className={service.active ? '' : 'inactive'}>
              <div className="crm-service-row">
                <button type="button" className="crm-service-name" onClick={() => setExpanded(expanded === index ? null : index)} aria-expanded={expanded === index}>
                  <strong>{service.name}</strong>
                  <small>{service.category || 'No category'} · {service.defaultDocuments.length} default docs</small>
                </button>
                <span className="crm-service-price">{formatCurrency(service.price)}</span>
                {!service.active && <Badge>Hidden</Badge>}
                <IconButton icon="edit" label={`Edit ${service.name}`} onClick={() => setExpanded(expanded === index ? null : index)} />
              </div>
              {expanded === index && (
                <div className="crm-form-grid crm-form-grid-3 crm-service-editor">
                  <Field label="Name"><Input value={service.name} onChange={(event) => update(index, { name: event.target.value })} /></Field>
                  <Field label="Category"><Input value={service.category ?? ''} onChange={(event) => update(index, { category: event.target.value })} /></Field>
                  <Field label="Price (₹)"><Input type="number" min={0} value={service.price} onChange={(event) => update(index, { price: Number(event.target.value) || 0 })} /></Field>
                  <div className="crm-span-3">
                    <Field label="Default documents" hint="Press Enter after each document">
                      <TagInput values={service.defaultDocuments} onChange={(defaultDocuments) => update(index, { defaultDocuments })} placeholder="e.g. PAN card" />
                    </Field>
                  </div>
                  <div className="crm-span-3">
                    <Toggle label="Active" description="Inactive services are hidden from new lead forms but kept on existing leads" checked={service.active} onChange={(active) => update(index, { active })} />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

// ── Pick-lists ──────────────────────────────────────────────────────────────

function ListsSettings({ settings, onSaved }: { settings: Settings; onSaved: () => void }) {
  const [leadSources, setLeadSources] = useState(settings.leadSources)
  const [lostReasons, setLostReasons] = useState(settings.lostReasons)
  const { saving, save } = useSaveSettings(onSaved)
  const dirty = JSON.stringify({ leadSources, lostReasons }) !== JSON.stringify({ leadSources: settings.leadSources, lostReasons: settings.lostReasons })
  return (
    <Card title="Pick-lists" actions={<Button size="sm" variant="primary" disabled={!dirty} loading={saving} onClick={() => void save({ leadSources, lostReasons }, 'Lists saved')}>Save lists</Button>}>
      <div className="crm-form-grid">
        <div className="crm-span-2">
          <Field label="Lead sources" hint="“Website” is used automatically for website form leads. Sources already used on leads always stay available as filters.">
            <TagInput values={leadSources} onChange={setLeadSources} placeholder="e.g. Referral, Google Ads, Walk-in" />
          </Field>
        </div>
        <div className="crm-span-2">
          <Field label="Lost reasons" hint="Offered when a lead is marked lost. Staff can still type a custom reason.">
            <TagInput values={lostReasons} onChange={setLostReasons} placeholder="e.g. Price too high, Chose competitor" />
          </Field>
        </div>
      </div>
    </Card>
  )
}

// ── Automation ──────────────────────────────────────────────────────────────

const automationRules: Array<{ key: keyof Automation; label: string; description: string; number?: { key: keyof Automation; label: string; unit: string; min: number; max: number } }> = [
  { key: 'autoAssignNewLeads', label: 'New lead → auto-assign', description: 'Round-robin new leads to active employees who receive leads.' },
  { key: 'createCallTaskOnAssign', label: 'Assigned → call task', description: 'Create a call task for the assignee as soon as a lead is assigned.', number: { key: 'callTaskDueMinutes', label: 'Due within', unit: 'minutes', min: 0, max: 10_080 } },
  { key: 'createFollowUpOnInterested', label: 'Interested → follow-up', description: 'Schedule a follow-up when a call outcome is Interested and no date was chosen.', number: { key: 'followUpDelayHours', label: 'Follow up after', unit: 'hours', min: 1, max: 720 } },
  { key: 'createTaskOnStageChange', label: 'Stage change → next task', description: 'Create the next task (documents, payment, processing, onboarding) when a lead changes stage.' },
  { key: 'documentsCompleteToProcessing', label: 'Documents complete → Processing', description: 'Move the lead to Processing when every required document is received or verified.' },
  { key: 'paymentCompleteToConverted', label: 'Payment complete → Converted', description: 'Convert the lead when all its payments are paid.', number: { key: 'paymentReminderDays', label: 'Payment task due after', unit: 'days', min: 0, max: 60 } },
  { key: 'notifyOverdueToSuperAdmins', label: 'Overdue → notify Super Admins', description: 'Overdue tasks always notify the assignee; also notify every Super Admin.' },
]

function AutomationSettings({ initial, onSaved }: { initial: Automation; onSaved: () => void }) {
  const [automation, setAutomation] = useState(initial)
  const { saving, save } = useSaveSettings(onSaved)
  const dirty = JSON.stringify(automation) !== JSON.stringify(initial)
  return (
    <Card title="Automation rules" actions={<Button size="sm" variant="primary" disabled={!dirty} loading={saving} onClick={() => void save({ automation }, 'Automation rules saved')}>Save rules</Button>}>
      <div className="crm-rule-list">
        {automationRules.map((rule) => (
          <div key={rule.key} className="crm-rule">
            <Toggle label={rule.label} description={rule.description} checked={Boolean(automation[rule.key])} onChange={(value) => setAutomation({ ...automation, [rule.key]: value })} />
            {rule.number && (
              <label className="crm-rule-number">
                <span>{rule.number.label}</span>
                <Input type="number" min={rule.number.min} max={rule.number.max} value={Number(automation[rule.number.key])} onChange={(event) => setAutomation({ ...automation, [rule.number!.key]: Number(event.target.value) })} />
                <span>{rule.number.unit}</span>
              </label>
            )}
          </div>
        ))}
        <div className="crm-rule">
          <div className="crm-toggle-text">
            <span>Unanswered call → retry</span>
            <small>After No Answer or Busy, a retry call task is scheduled automatically.</small>
          </div>
          <label className="crm-rule-number">
            <span>Retry after</span>
            <Input type="number" min={1} max={168} value={automation.retryCallAfterHours} onChange={(event) => setAutomation({ ...automation, retryCallAfterHours: Number(event.target.value) })} />
            <span>hours</span>
          </label>
        </div>
      </div>
    </Card>
  )
}

// ── Account ─────────────────────────────────────────────────────────────────

function AccountSettings() {
  const { user } = useSession()
  const toast = useToast()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!form.currentPassword) next.currentPassword = 'Enter your current password'
    if (form.newPassword.length < 8 || !/[A-Za-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) next.newPassword = 'At least 8 characters with letters and numbers'
    if (form.confirm !== form.newPassword) next.confirm = 'Passwords do not match'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    try {
      await api.post('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword })
      toast.success('Password changed. Other sessions have been signed out.')
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (caught) {
      if (caught instanceof ApiError) setErrors(caught.fields)
      toast.error(caught)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="crm-grid crm-grid-2">
      <Card title="Profile">
        <dl className="crm-dl">
          <div><dt>Name</dt><dd>{user.name}</dd></div>
          <div><dt>Employee ID</dt><dd>{user.employeeCode}</dd></div>
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div><dt>Role</dt><dd>{user.role === 'super_admin' ? 'Super Admin' : 'Sales'}</dd></div>
          <div><dt>Daily call target</dt><dd>{user.dailyCallTarget} calls</dd></div>
        </dl>
        <p className="crm-field-hint">Contact a Super Admin to change your name, role, or permissions.</p>
      </Card>
      <Card title="Change password">
        <form className="crm-form-stack" onSubmit={submit} noValidate>
          <Field label="Current password" error={errors.currentPassword}><Input type="password" autoComplete="current-password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} /></Field>
          <Field label="New password" error={errors.newPassword}><Input type="password" autoComplete="new-password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /></Field>
          <Field label="Confirm new password" error={errors.confirm}><Input type="password" autoComplete="new-password" value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} /></Field>
          <Button type="submit" variant="primary" loading={saving}>Update password</Button>
        </form>
      </Card>
    </div>
  )
}
