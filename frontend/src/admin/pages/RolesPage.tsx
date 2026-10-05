import { useState, type FormEvent } from 'react'
import { PageHeader } from '../components/Layout'
import { Avatar, Badge, Button, Card, Drawer, EmptyState, ErrorState, Field, Input, Skeleton, Toggle } from '../components/ui'
import { useConfirm, useSession, useToast } from '../context/contexts'
import { api, ApiError } from '../lib/api'
import { permissionGroups, permissionLabels } from '../lib/constants'
import { formatRelative } from '../lib/format'
import { useQuery } from '../lib/hooks'
import { navigate } from '../lib/router'
import type { CustomRole, PermissionKey, User } from '../lib/types'

type PermissionMap = Partial<Record<PermissionKey, boolean>>

export function AccessSummary({ permissions }: { permissions: PermissionMap }) {
  return (
    <div className="crm-access-summary">
      {permissionGroups.map((group) => {
        const granted = group.keys.filter((key) => permissions[key])
        return (
          <div key={group.title}>
            <span className="crm-access-label">{group.title === 'Pages they can see' ? 'Can see' : 'Can do'}</span>
            {granted.length === 0
              ? <span className="crm-muted">{group.title === 'Pages they can see' ? 'Only their own leads, calls & tasks' : 'Only work on their own leads'}</span>
              : granted.map((key) => <Badge key={key} tone={group.title === 'Pages they can see' ? 'blue' : 'green'}>{permissionLabels[key].label}</Badge>)}
          </div>
        )
      })}
    </div>
  )
}

export function RolesPage() {
  const toast = useToast()
  const confirm = useConfirm()
  const roles = useQuery('roles', () => api.get<{ items: CustomRole[] }>('/admin/roles'))
  const users = useQuery('users', () => api.get<{ items: User[] }>('/admin/users'))
  const [editing, setEditing] = useState<CustomRole | 'new' | null>(null)

  const staff = (users.data?.items ?? []).filter((user) => user.role !== 'super_admin')
  const membersOf = (roleId: string) => staff.filter((user) => user.customRole === roleId)
  const individual = staff.filter((user) => !user.customRole)

  async function remove(role: CustomRole) {
    const ok = await confirm({ title: `Delete “${role.name}”?`, message: 'This cannot be undone. The change is recorded in the activity log.', confirmLabel: 'Delete role', tone: 'danger' })
    if (!ok) return
    try {
      await api.delete(`/admin/roles/${role.id}`)
      toast.success(`Role “${role.name}” deleted`)
      void roles.reload({ silent: true })
    } catch (caught) {
      toast.error(caught)
    }
  }

  const reloadAll = () => {
    void roles.reload({ silent: true })
    void users.reload({ silent: true })
  }

  return (
    <>
      <PageHeader
        title="Roles & Access"
        description="Create a role such as “Team Leader” or “Accounts”, choose exactly what it can see and do, then add sub-admins to it."
        actions={<Button variant="primary" icon="plus" onClick={() => setEditing('new')}>New role</Button>}
      />

      {(roles.error && !roles.data) || (users.error && !users.data) ? (
        <ErrorState error={roles.error ?? users.error} onRetry={reloadAll} />
      ) : !roles.data || !users.data ? <Skeleton rows={6} /> : (
        <div className="crm-stack">
          {roles.data.items.length === 0 && (
            <Card>
              <EmptyState
                title="No roles yet"
                description="A role is a reusable set of permissions. Create one, add people to it, and change everyone’s access in one place."
                action={<Button variant="primary" onClick={() => setEditing('new')}>Create your first role</Button>}
              />
            </Card>
          )}

          <div className="crm-role-grid">
            {roles.data.items.map((role) => {
              const members = membersOf(role.id)
              return (
                <Card
                  key={role.id}
                  className="crm-role-card"
                  title={<span className="crm-role-title">{role.name}<small>{members.length} {members.length === 1 ? 'person' : 'people'}</small></span>}
                  actions={<Button size="sm" onClick={() => setEditing(role)}>Edit</Button>}
                >
                  {role.description && <p className="crm-muted crm-role-desc">{role.description}</p>}
                  <AccessSummary permissions={role.permissions} />
                  <div className="crm-role-members">
                    {members.length === 0 ? <span className="crm-muted">No one has this role yet.</span> : members.map((user) => (
                      <span key={user.id} className={`crm-member-chip ${user.active ? '' : 'crm-row-muted'}`} title={user.lastLoginAt ? `Last login ${formatRelative(user.lastLoginAt)}` : 'Never signed in'}>
                        <Avatar name={user.name} size={22} />{user.name}
                      </span>
                    ))}
                  </div>
                  <div className="crm-role-footer">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/activity?role=${role.id}`)}>See what they changed</Button>
                    <Button size="sm" variant="ghost" onClick={() => void remove(role)} disabled={members.length > 0} title={members.length > 0 ? 'Move its members to another role first' : undefined}>Delete</Button>
                  </div>
                </Card>
              )
            })}
          </div>

          <Card title="Built-in access">
            <div className="crm-builtin-roles">
              <div>
                <strong>Super Admin</strong>
                <p className="crm-muted">Sees and does everything, including this page, Team and Settings.</p>
              </div>
              <div>
                <strong>Individual permissions</strong>
                <p className="crm-muted">
                  {individual.length === 0 ? 'Everyone is in a role.' : `${individual.map((user) => user.name).join(', ')} — set one by one on the Team page.`}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {editing && users.data && (
        <RoleDrawer
          key={editing === 'new' ? 'new' : editing.id}
          role={editing === 'new' ? null : editing}
          staff={staff}
          roles={roles.data?.items ?? []}
          onClose={() => setEditing(null)}
          onSaved={reloadAll}
        />
      )}
    </>
  )
}

function RoleDrawer({ role, staff, roles, onClose, onSaved }: { role: CustomRole | null; staff: User[]; roles: CustomRole[]; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const { refreshMeta } = useSession()
  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [permissions, setPermissions] = useState<PermissionMap>({ ...(role?.permissions ?? {}) })
  const initialMembers = new Set(role ? staff.filter((user) => user.customRole === role.id).map((user) => user.id) : [])
  const [members, setMembers] = useState<Set<string>>(initialMembers)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const roleName = (id?: string | null) => roles.find((item) => item.id === id)?.name

  function toggleMember(id: string, on: boolean) {
    const next = new Set(members)
    if (on) next.add(id)
    else next.delete(id)
    setMembers(next)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (name.trim().length < 2) return setErrors({ name: 'Give the role a name, e.g. Team Leader' })
    setSaving(true)
    try {
      const body = { name: name.trim(), description, permissions: Object.fromEntries(Object.keys(permissionLabels).map((key) => [key, Boolean(permissions[key as PermissionKey])])) }
      const saved = role
        ? (await api.put<{ role: CustomRole }>(`/admin/roles/${role.id}`, body)).role
        : (await api.post<{ role: CustomRole }>('/admin/roles', body)).role
      const added = [...members].filter((id) => !initialMembers.has(id))
      const removed = [...initialMembers].filter((id) => !members.has(id))
      await Promise.all([
        ...added.map((id) => api.patch(`/admin/users/${id}`, { customRole: saved.id })),
        ...removed.map((id) => api.patch(`/admin/users/${id}`, { customRole: null })),
      ])
      toast.success(role ? `“${saved.name}” updated` : `“${saved.name}” created`)
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

  return (
    <Drawer
      open
      onClose={onClose}
      title={role ? `Edit “${role.name}”` : 'New role'}
      subtitle="Changes apply the next time each person loads a page."
      footer={(
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="crm-role-form" loading={saving}>{role ? 'Save role' : 'Create role'}</Button>
        </>
      )}
    >
      <form id="crm-role-form" className="crm-form-grid" onSubmit={submit} noValidate>
        <Field label="Role name" required error={errors.name}><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Team Leader" autoFocus /></Field>
        <Field label="Short description"><Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Manages the calling team" /></Field>

        {permissionGroups.map((group) => (
          <div key={group.title} className="crm-span-2">
            <h3 className="crm-subheading">{group.title}</h3>
            <p className="crm-field-hint">{group.hint}</p>
            <div className="crm-toggle-list">
              {group.keys.map((key) => (
                <Toggle key={key} label={permissionLabels[key].label} description={permissionLabels[key].description} checked={Boolean(permissions[key])} onChange={(value) => setPermissions({ ...permissions, [key]: value })} />
              ))}
            </div>
          </div>
        ))}

        <div className="crm-span-2">
          <h3 className="crm-subheading">People in this role</h3>
          <p className="crm-field-hint">Someone removed from a role goes back to their individual permissions from the Team page.</p>
          {staff.length === 0 ? <p className="crm-muted">Add employees on the Team page first.</p> : (
            <div className="crm-toggle-list">
              {staff.map((user) => {
                const other = user.customRole && user.customRole !== role?.id ? roleName(user.customRole) : undefined
                return (
                  <Toggle
                    key={user.id}
                    label={user.name}
                    description={[user.employeeCode, !user.active && 'inactive', other && `in “${other}”${members.has(user.id) ? ' — will move here' : ''}`].filter(Boolean).join(' · ')}
                    checked={members.has(user.id)}
                    onChange={(value) => toggleMember(user.id, value)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </form>
    </Drawer>
  )
}
