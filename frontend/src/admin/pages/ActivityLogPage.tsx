import { useState } from 'react'
import { DateRange } from '../components/DateRange'
import { PageHeader } from '../components/Layout'
import { Link } from '../components/Link'
import { Avatar, Badge, Card, EmptyState, ErrorState, Pagination, Select, Skeleton } from '../components/ui'
import { useSession } from '../context/contexts'
import { describeActivity } from '../lib/activity'
import { api, qs } from '../lib/api'
import { defaultRange, formatDate } from '../lib/format'
import { useQuery } from '../lib/hooks'
import { setSearchParams, useLocation } from '../lib/router'
import type { AuditEntry, CustomRole, Paged } from '../lib/types'

const kinds = [
  { id: 'changes', label: 'Changes' },
  { id: 'sign_ins', label: 'Sign-ins' },
  { id: 'all', label: 'Everything' },
] as const

function roleLabel(actor: AuditEntry['actor']): string {
  if (!actor) return ''
  if (actor.role === 'super_admin') return 'Super Admin'
  return actor.customRole?.name ?? 'Sales'
}

function timeOf(value: string): string {
  return new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export function ActivityLogPage() {
  const { meta } = useSession()
  const { search } = useLocation()
  const actor = search.get('actor') ?? ''
  const role = search.get('role') ?? ''
  const [kind, setKind] = useState<(typeof kinds)[number]['id']>('changes')
  const [range, setRange] = useState(defaultRange)
  const [page, setPage] = useState(1)

  const roles = useQuery('roles', () => api.get<{ items: CustomRole[] }>('/admin/roles'), { enabled: meta.capabilities.isSuperAdmin })
  const filters = { actor, role: actor ? '' : role, kind, from: range.from, to: range.to, page, limit: 40 }
  const { data, error, reload } = useQuery(`activity-log:${JSON.stringify(filters)}`, () => api.get<Paged<AuditEntry>>(`/admin/activity${qs(filters)}`), { pollMs: 60_000 })

  const setFilter = (key: 'actor' | 'role', value: string) => {
    setPage(1)
    setSearchParams(key === 'actor' ? { actor: value, role: null } : { role: value, actor: null })
  }

  const days: Array<{ day: string; items: AuditEntry[] }> = []
  for (const entry of data?.items ?? []) {
    const day = formatDate(entry.createdAt)
    const last = days[days.length - 1]
    if (last?.day === day) last.items.push(entry)
    else days.push({ day, items: [entry] })
  }

  return (
    <>
      <PageHeader
        title="Activity log"
        description="Who did what, and when. Every change in the CRM is recorded here and cannot be edited or deleted."
        actions={<DateRange value={range} onChange={(value) => { setRange(value); setPage(1) }} />}
      />
      <Card padded={false}>
        <div className="crm-filters">
          <div className="crm-segmented">
            {kinds.map((item) => (
              <button key={item.id} type="button" className={kind === item.id ? 'active' : ''} onClick={() => { setKind(item.id); setPage(1) }}>{item.label}</button>
            ))}
          </div>
          <Select value={actor} onChange={(event) => setFilter('actor', event.target.value)} aria-label="Person">
            <option value="">Everyone</option>
            {meta.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </Select>
          {meta.capabilities.isSuperAdmin && (
            <Select value={actor ? '' : role} onChange={(event) => setFilter('role', event.target.value)} aria-label="Role" disabled={Boolean(actor)}>
              <option value="">All roles</option>
              {(roles.data?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          )}
        </div>

        {error && !data ? <ErrorState error={error} onRetry={() => void reload()} /> : !data ? <Skeleton rows={8} /> : data.items.length === 0 ? (
          <EmptyState title="Nothing recorded" description="No activity matches these filters in the selected period." />
        ) : (
          <div className="crm-audit">
            {days.map((group) => (
              <section key={group.day}>
                <h3 className="crm-audit-day">{group.day}</h3>
                <ol>
                  {group.items.map((entry) => {
                    const described = describeActivity(entry)
                    const lead = entry.lead && typeof entry.lead === 'object' ? entry.lead : null
                    return (
                      <li key={entry._id} className="crm-audit-row">
                        <time dateTime={entry.createdAt} title={new Date(entry.createdAt).toLocaleString('en-IN')}>{timeOf(entry.createdAt)}</time>
                        <Avatar name={entry.actor?.name} size={28} />
                        <div className="crm-audit-body">
                          <div className="crm-audit-who">
                            <strong>{entry.actor?.name ?? 'System'}</strong>
                            {entry.actor && <Badge tone={entry.actor.role === 'super_admin' ? 'violet' : entry.actor.customRole ? 'blue' : 'gray'}>{roleLabel(entry.actor)}</Badge>}
                          </div>
                          <p className="crm-audit-what">
                            {described.title}
                            {lead && <> on <Link to={`/admin/leads/${lead._id}`}>{lead.name} <small className="crm-muted">{lead.leadId}</small></Link></>}
                          </p>
                          {described.change && (
                            <div className="crm-timeline-change">
                              <span className="from">{described.change.from}</span>
                              <span aria-label="changed to">→</span>
                              <span className="to">{described.change.to}</span>
                            </div>
                          )}
                          {described.detail && <p className="crm-timeline-detail">{described.detail}</p>}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </section>
            ))}
          </div>
        )}
        {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPage={setPage} />}
      </Card>
    </>
  )
}
