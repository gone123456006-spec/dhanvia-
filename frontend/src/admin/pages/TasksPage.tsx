import { useState } from 'react'
import { PageHeader } from '../components/Layout'
import { TaskFormModal, TaskRow } from '../components/Tasks'
import { Button, Card, EmptyState, ErrorState, Pagination, Select, Skeleton } from '../components/ui'
import { useSession } from '../context/contexts'
import { api, qs } from '../lib/api'
import { taskTypeMeta } from '../lib/constants'
import { useQuery } from '../lib/hooks'
import { setSearchParams, useLocation } from '../lib/router'
import type { Paged, Task } from '../lib/types'

export function TasksPage() {
  const { meta } = useSession()
  const { search } = useLocation()
  const [creating, setCreating] = useState(false)
  const canSeeTeam = meta.capabilities.viewAllLeads || meta.capabilities.viewTeam
  const filters = {
    scope: canSeeTeam ? search.get('scope') ?? 'mine' : 'mine',
    status: search.get('status') ?? 'open',
    type: search.get('type') ?? '',
    due: search.get('due') ?? '',
    assignedTo: search.get('assignedTo') ?? '',
    page: Number(search.get('page')) || 1,
    limit: 30,
  }
  const { data, error, loading, reload } = useQuery(`tasks:${JSON.stringify(filters)}`, () => api.get<Paged<Task>>(`/admin/tasks${qs(filters)}`), { pollMs: 60_000 })
  const set = (key: string, value: string) => setSearchParams({ [key]: value, page: undefined })

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Calls, follow-ups, document chases, payments and processing work. Most tasks are created automatically by the workflow."
        actions={<Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New task</Button>}
      />
      <Card padded={false}>
        <div className="crm-filters">
          {canSeeTeam && (
            <div className="crm-segmented">
              <button type="button" className={filters.scope === 'mine' ? 'active' : ''} onClick={() => setSearchParams({ scope: undefined, assignedTo: undefined, page: undefined })}>My tasks</button>
              <button type="button" className={filters.scope === 'all' ? 'active' : ''} onClick={() => set('scope', 'all')}>Team</button>
            </div>
          )}
          <Select value={filters.status} onChange={(event) => set('status', event.target.value === 'open' ? '' : event.target.value)} aria-label="Status">
            <option value="open">Open</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select value={filters.due} onChange={(event) => set('due', event.target.value)} aria-label="Due">
            <option value="">Any due date</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due today</option>
            <option value="week">Next 7 days</option>
            <option value="upcoming">After today</option>
          </Select>
          <Select value={filters.type} onChange={(event) => set('type', event.target.value)} aria-label="Type">
            <option value="">All types</option>
            {meta.enums.taskTypes.map((type) => <option key={type} value={type}>{taskTypeMeta[type].label}</option>)}
          </Select>
          {canSeeTeam && filters.scope === 'all' && (
            <Select value={filters.assignedTo} onChange={(event) => set('assignedTo', event.target.value)} aria-label="Assignee">
              <option value="">Everyone</option>
              {meta.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </Select>
          )}
        </div>
        {error && !data ? <ErrorState error={error} onRetry={() => void reload()} /> : !data ? <Skeleton rows={8} /> : data.items.length === 0 ? (
          <EmptyState icon="tasks" title={filters.status === 'open' ? 'Nothing to do here' : `No ${filters.status} tasks`} description={filters.status === 'open' ? 'No open tasks match these filters.' : undefined} />
        ) : (
          <div className={`crm-task-list crm-task-list-page ${loading ? 'crm-refreshing' : ''}`}>
            {data.items.map((task) => <TaskRow key={task._id} task={task} onChanged={() => void reload({ silent: true })} />)}
          </div>
        )}
        {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPage={(page) => setSearchParams({ page })} />}
      </Card>
      <TaskFormModal open={creating} onClose={() => setCreating(false)} onCreated={() => void reload({ silent: true })} />
    </>
  )
}
