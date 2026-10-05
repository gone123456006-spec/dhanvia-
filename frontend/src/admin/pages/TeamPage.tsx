import { useState, type FormEvent } from 'react'
import { DateRange } from '../components/DateRange'
import { PageHeader } from '../components/Layout'
import { Avatar, Badge, Button, Card, Drawer, EmptyState, ErrorState, Field, IconButton, Input, ProgressBar, Select, Skeleton, Toggle } from '../components/ui'
import { useConfirm, useSession, useToast } from '../context/contexts'
import { api, ApiError, qs } from '../lib/api'
import { effectivePermissions, permissionGroups, permissionLabels } from '../lib/constants'
import { defaultRange, formatCurrency, formatDate, formatDuration, formatNumber, formatPercent, formatRelative } from '../lib/format'
import { useQuery } from '../lib/hooks'
import { navigate } from '../lib/router'
import type { CustomRole, PermissionKey, Role, User } from '../lib/types'
import { AccessSummary } from './RolesPage'

interface PerformanceRow {
  id: string
  name: string
  employeeCode: string
  role: Role
  dailyCallTarget: number
  callsToday: number
  targetProgress: number
  calls: number
  connected: number
  connectRate: number
  talkTime: number
  followUps: number
  interested: number
  conversions: number
  revenue: number
  leadsAssigned: number
  conversionRate: number
  openLeads: number
  hotLeads: number
  openTasks: number
  overdueTasks: number
}

export function TeamPage() {
  const { meta } = useSession()
  const isSuperAdmin = meta.capabilities.isSuperAdmin
  const [range, setRange] = useState(defaultRange)
  const performance = useQuery(`team:${range.from}:${range.to}`, () => api.get<{ rows: PerformanceRow[] }>(`/admin/team/performance${qs(range)}`), { pollMs: 120_000 })
  const users = useQuery('users', () => api.get<{ items: User[] }>('/admin/users'), { enabled: isSuperAdmin })
  const [editing, setEditing] = useState<User | 'new' | null>(null)

  const rows = performance.data?.rows ?? []
  const roleNames = new Map((users.data?.items ?? []).filter((user) => user.customRoleName).map((user) => [user.id, user.customRoleName as string]))
  const totals = rows.reduce((sum, row) => ({
    calls: sum.calls + row.calls,
    connected: sum.connected + row.connected,
    conversions: sum.conversions + row.conversions,
    revenue: sum.revenue + row.revenue,
    overdue: sum.overdue + row.overdueTasks,
  }), { calls: 0, connected: 0, conversions: 0, revenue: 0, overdue: 0 })

  return (
    <>
      <PageHeader
        title="Team"
        description="Targets, calling activity, follow-ups, conversions, revenue and workload per employee."
        actions={<DateRange value={range} onChange={setRange} />}
      />

      <div className="crm-mini-stats">
        <div><span>Calls</span><strong>{formatNumber(totals.calls)}</strong></div>
        <div><span>Connected</span><strong>{formatNumber(totals.connected)}</strong></div>
        <div><span>Conversions</span><strong>{formatNumber(totals.conversions)}</strong></div>
        <div><span>Revenue collected</span><strong className="crm-text-green">{formatCurrency(totals.revenue)}</strong></div>
        <div><span>Overdue tasks</span><strong className={totals.overdue ? 'crm-text-red' : ''}>{formatNumber(totals.overdue)}</strong></div>
      </div>

      <Card title="Performance" padded={false}>
        {performance.error && !performance.data ? <ErrorState error={performance.error} onRetry={() => void performance.reload()} /> : !performance.data ? <Skeleton rows={5} /> : rows.length === 0 ? (
          <EmptyState icon="team" title="No active employees" />
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table crm-table-numeric">
              <thead>
                <tr>
                  <th>Employee</th><th>Today vs target</th><th>Calls</th><th>Connected</th><th>Talk time</th><th>Follow-ups</th>
                  <th>Interested</th><th>Conversions</th><th>Conv. rate</th><th>Revenue</th><th>Workload</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button type="button" className="crm-person crm-link-plain" onClick={() => navigate(`/admin/leads?assignedTo=${row.id}`)} title="View their leads">
                        <Avatar name={row.name} />
                        <span><strong>{row.name}</strong><small>{row.employeeCode}{row.role === 'super_admin' ? ' · Super Admin' : roleNames.get(row.id) ? ` · ${roleNames.get(row.id)}` : ''}</small></span>
                      </button>
                    </td>
                    <td className="crm-target-cell">
                      <span>{row.callsToday}/{row.dailyCallTarget || '—'}</span>
                      {row.dailyCallTarget > 0 && <ProgressBar value={row.targetProgress} tone={row.targetProgress >= 100 ? 'green' : row.targetProgress >= 50 ? 'amber' : 'red'} />}
                    </td>
                    <td>{formatNumber(row.calls)}</td>
                    <td>{formatNumber(row.connected)} <small className="crm-muted">{formatPercent(row.connectRate)}</small></td>
                    <td>{formatDuration(row.talkTime)}</td>
                    <td>{formatNumber(row.followUps)}</td>
                    <td>{formatNumber(row.interested)}</td>
                    <td>{formatNumber(row.conversions)}</td>
                    <td>{formatPercent(row.conversionRate)} <small className="crm-muted">of {row.leadsAssigned}</small></td>
                    <td>{formatCurrency(row.revenue)}</td>
                    <td>
                      <div className="crm-workload">
                        <span title="Open leads">{row.openLeads} leads</span>
                        <span title="Open tasks">{row.openTasks} tasks</span>
                        {row.overdueTasks > 0 && <Badge tone="red">{row.overdueTasks} overdue</Badge>}
                        {row.hotLeads > 0 && <Badge tone="red">{row.hotLeads} hot</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {isSuperAdmin && (
        <Card title="Employees" actions={<Button variant="primary" size="sm" icon="plus" onClick={() => setEditing('new')}>Add employee</Button>} padded={false}>
          {users.error && !users.data ? <ErrorState error={users.error} onRetry={() => void users.reload()} /> : !users.data ? <Skeleton rows={4} /> : (
            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead><tr><th>Employee</th><th>Access</th><th>Receives leads</th><th>Daily target</th><th>Last login</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {users.data.items.map((user) => {
                    const granted = user.role === 'super_admin' ? [] : meta.enums.permissionKeys.filter((key) => effectivePermissions(user.permissions)[key])
                    return (
                      <tr key={user.id} className={user.active ? '' : 'crm-row-muted'}>
                        <td><div className="crm-person"><Avatar name={user.name} /><span><strong>{user.name}</strong><small>{user.employeeCode} · {user.email}</small></span></div></td>
                        <td className="crm-perm-list">
                          {user.role === 'super_admin' ? <Badge tone="violet">Super Admin</Badge>
                            : user.customRoleName ? <Badge tone="blue">{user.customRoleName}</Badge>
                            : <span className="crm-muted" title={granted.map((key) => permissionLabels[key].label).join(', ')}>Sales · {granted.length ? `${granted.length} permission${granted.length > 1 ? 's' : ''}` : 'own leads only'}</span>}
                        </td>
                        <td>{user.acceptsLeads ? 'Yes' : 'No'}</td>
                        <td>{user.dailyCallTarget} calls</td>
                        <td>{user.lastLoginAt ? formatRelative(user.lastLoginAt) : 'Never'}</td>
                        <td>{user.active ? <Badge tone="green" dot>Active</Badge> : <Badge tone="gray" dot>Inactive</Badge>}</td>
                        <td className="crm-row-actions">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/activity?actor=${user.id}`)}>Activity</Button>
                          <IconButton icon="edit" label={`Edit ${user.name}`} onClick={() => setEditing(user)} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {editing && (
        <EmployeeDrawer
          key={editing === 'new' ? 'new' : editing.id}
          user={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            void users.reload({ silent: true })
            void performance.reload({ silent: true })
          }}
        />
      )}
    </>
  )
}

function EmployeeDrawer({ user, onClose, onSaved }: { user: User | null; onClose: () => void; onSaved: () => void }) {
  const { user: me, refreshMeta } = useSession()
  const toast = useToast()
  const confirm = useConfirm()
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    password: '',
    role: (user?.role ?? 'sales') as Role,
    dailyCallTarget: String(user?.dailyCallTarget ?? 40),
    acceptsLeads: user?.acceptsLeads ?? true,
    active: user?.active ?? true,
    customRole: user?.customRole ?? '',
    permissions: effectivePermissions(user?.permissions) as Partial<Record<PermissionKey, boolean>>,
  })
  const roles = useQuery('roles', () => api.get<{ items: CustomRole[] }>('/admin/roles'))
  const selectedRole = roles.data?.items.find((role) => role.id === form.customRole)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const isSelf = user?.id === me.id

  function validate() {
    const next: Record<string, string> = {}
    if (form.name.trim().length < 2) next.name = 'Enter the employee’s name'
    if (!user && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email'
    if (!user && (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))) next.password = 'At least 8 characters with letters and numbers'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return
    setSaving(true)
    const body = {
      name: form.name.trim(),
      phone: form.phone,
      role: form.role,
      dailyCallTarget: Number(form.dailyCallTarget) || 0,
      acceptsLeads: form.acceptsLeads,
      customRole: form.role === 'super_admin' ? null : form.customRole || null,
      permissions: form.permissions,
      ...(user ? { active: form.active } : { email: form.email.trim(), password: form.password }),
    }
    try {
      if (user) await api.patch(`/admin/users/${user.id}`, body)
      else await api.post('/admin/users', body)
      toast.success(user ? 'Employee updated' : `${body.name} added. Share their email and password with them securely.`)
      await refreshMeta()
      onSaved()
      onClose()
    } catch (caught) {
      if (caught instanceof ApiError) setErrors(caught.fields)
      toast.error(caught)
    } finally {
      setSaving(false)
    }
  }

  async function resetPassword() {
    if (!user) return
    const password = await confirm({ title: `Reset password for ${user.name}`, message: 'They will be signed out of every device.', confirmLabel: 'Reset password', tone: 'danger', input: { label: 'New password', placeholder: 'At least 8 characters, letters and numbers', required: true } })
    if (password === false) return
    try {
      const result = await api.post<{ message: string }>(`/admin/users/${user.id}/reset-password`, { password })
      toast.success(result.message)
    } catch (caught) {
      toast.error(caught)
    }
  }

  return (
    <Drawer open onClose={onClose} title={user ? `Edit ${user.name}` : 'Add employee'} subtitle={user ? `${user.employeeCode} · joined ${formatDate(user.createdAt)}` : 'Employee ID is generated automatically'} footer={(
      <>
        {user && <Button variant="ghost" onClick={() => void resetPassword()}>Reset password</Button>}
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" form="crm-employee-form" loading={saving}>{user ? 'Save changes' : 'Create employee'}</Button>
      </>
    )}>
      <form id="crm-employee-form" className="crm-form-grid" onSubmit={submit} noValidate>
        <Field label="Full name" required error={errors.name}><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoFocus /></Field>
        <Field label="Phone" error={errors.phone}><Input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
        <Field label="Email (login)" required={!user} error={errors.email}><Input type="email" value={form.email} disabled={Boolean(user)} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="off" /></Field>
        {!user && <Field label="Temporary password" required error={errors.password}><Input type="text" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" /></Field>}
        <Field label="Role">
          <Select value={form.role} disabled={isSelf} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
            <option value="sales">Sales</option>
            <option value="super_admin">Super Admin</option>
          </Select>
        </Field>
        <Field label="Daily call target"><Input type="number" min={0} max={1000} value={form.dailyCallTarget} onChange={(event) => setForm({ ...form, dailyCallTarget: event.target.value })} /></Field>
        <div className="crm-span-2 crm-toggle-list">
          <Toggle label="Receives new leads" description="Included in automatic round-robin assignment" checked={form.acceptsLeads} onChange={(value) => setForm({ ...form, acceptsLeads: value })} />
          {user && <Toggle label="Active" description={isSelf ? 'You cannot deactivate yourself' : 'Inactive employees cannot sign in'} checked={form.active} disabled={isSelf} onChange={(value) => setForm({ ...form, active: value })} />}
        </div>
        <div className="crm-span-2">
          <h3 className="crm-subheading">Access</h3>
          {form.role === 'super_admin' ? <p className="crm-muted">Super Admins can see and do everything.</p> : (
            <>
              <Field label="Access role" hint="Pick a role to give the same access as everyone in it, or set permissions one by one.">
                <Select value={form.customRole} onChange={(event) => setForm({ ...form, customRole: event.target.value })}>
                  <option value="">Individual permissions</option>
                  {(roles.data?.items ?? []).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </Select>
              </Field>
              {form.customRole ? (
                selectedRole ? (
                  <div className="crm-role-preview">
                    <AccessSummary permissions={selectedRole.permissions} />
                    <Button size="sm" variant="ghost" onClick={() => navigate('/admin/roles')}>Change what “{selectedRole.name}” can do</Button>
                  </div>
                ) : <Skeleton rows={2} />
              ) : permissionGroups.map((group) => (
                <div key={group.title}>
                  <h4 className="crm-subheading">{group.title}</h4>
                  <div className="crm-toggle-list">
                    {group.keys.map((key) => (
                      <Toggle key={key} label={permissionLabels[key].label} description={permissionLabels[key].description} checked={Boolean(form.permissions[key])} onChange={(value) => setForm({ ...form, permissions: { ...form.permissions, [key]: value } })} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </form>
    </Drawer>
  )
}
