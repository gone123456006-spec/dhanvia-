import { useRef, useState } from 'react'
import { DueLabel, InterestBadge, OutcomeBadge, PriorityBadge, ScorePill, StageBadge, TaskTypeBadge } from '../components/badges'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/Layout'
import { CallsTab } from '../components/LeadTabs'
import { LogCallForm } from '../components/LogCallForm'
import { Button, Card, EmptyState, ErrorState, Pagination, Select, Skeleton, Spinner, StatCard, Tabs } from '../components/ui'
import { useSession } from '../context/contexts'
import { api, qs } from '../lib/api'
import { outcomeMeta } from '../lib/constants'
import { formatDateTime, formatDuration, formatNumber, formatRelative, isOverdue, isoDay } from '../lib/format'
import { useQuery } from '../lib/hooks'
import { Link } from '../components/Link'
import { setSearchParams, useLocation } from '../lib/router'
import type { Call, Lead, LeadDetail, Paged, Task } from '../lib/types'

type QueueLead = Pick<Lead, '_id' | 'leadId' | 'name' | 'phone' | 'service' | 'stage' | 'priority' | 'interest' | 'score' | 'lastInteractionAt' | 'lastInteractionSummary' | 'callAttempts' | 'followUpAt'>
type QueueTask = Omit<Task, 'lead'> & { lead: QueueLead }

interface Queue {
  due: QueueTask[]
  upcoming: QueueTask[]
  untouched: QueueLead[]
  today: { calls: number; connected: number; talkTime: number }
}

type QueueTab = 'due' | 'untouched' | 'upcoming'

export function CallingPage() {
  const { meta, user } = useSession()
  const { search } = useLocation()
  const leadId = search.get('lead') ?? ''
  const taskId = search.get('task') ?? ''
  const [queueTab, setQueueTab] = useState<QueueTab>('due')
  const [agent, setAgent] = useState('')
  const canPickAgent = meta.capabilities.viewTeam
  const queue = useQuery(`call-queue:${agent}`, () => api.get<Queue>(`/admin/calls/queue${qs({ agent })}`), { pollMs: 60_000 })
  const [historyKey, setHistoryKey] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  const entries: Array<{ leadId: string; taskId?: string; lead: QueueLead; task?: QueueTask }> = queue.data
    ? queueTab === 'untouched'
      ? queue.data.untouched.map((lead) => ({ leadId: lead._id, lead }))
      : queue.data[queueTab].map((task) => ({ leadId: task.lead._id, taskId: task._id, lead: task.lead, task }))
    : []

  function select(entry?: { leadId: string; taskId?: string }, reveal = false) {
    setSearchParams({ lead: entry?.leadId, task: entry?.taskId })
    // On stacked (single-column) layouts the call panel sits below the queue.
    if (reveal && entry && window.matchMedia('(max-width: 1024px)').matches) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }

  async function onLogged() {
    const currentIndex = entries.findIndex((entry) => entry.leadId === leadId && (entry.taskId ?? '') === taskId)
    await queue.reload({ silent: true })
    setHistoryKey((value) => value + 1)
    const next = entries.filter((_, index) => index !== currentIndex)[Math.max(0, currentIndex)]
    select(next)
  }

  const today = queue.data?.today
  const viewingSelf = !agent || agent === user.id

  return (
    <>
      <PageHeader
        title="Calling workspace"
        description="Work through your queue: call, capture the outcome, and the next step is scheduled automatically."
        actions={canPickAgent && (
          <Select value={agent} onChange={(event) => {
            setAgent(event.target.value)
            select(undefined)
          }} aria-label="Agent queue">
            <option value="">My queue</option>
            {meta.users.filter((item) => item.id !== user.id).map((item) => <option key={item.id} value={item.id}>{item.name}’s queue</option>)}
          </Select>
        )}
      />

      <div className="crm-stats crm-stats-4">
        <StatCard label="Due now" value={formatNumber(queue.data?.due.length)} icon="phone" tone="pink" hint="Calls & follow-ups due today or overdue" />
        <StatCard label="Never contacted" value={formatNumber(queue.data?.untouched.length)} icon="leads" tone="blue" hint="Assigned leads with no call yet" />
        <StatCard label="Calls today" value={formatNumber(today?.calls)} icon="activity" tone="violet" hint={`${formatNumber(today?.connected)} connected`} />
        <StatCard label="Talk time today" value={formatDuration(today?.talkTime)} icon="clock" tone="teal" />
      </div>

      <div className="crm-calling">
        <Card padded={false} className="crm-queue">
          <Tabs<QueueTab>
            tabs={[
              { id: 'due', label: 'Due', count: queue.data?.due.length, alert: Boolean(queue.data?.due.some((task) => isOverdue(task.dueAt))) },
              { id: 'untouched', label: 'New', count: queue.data?.untouched.length },
              { id: 'upcoming', label: 'Upcoming', count: queue.data?.upcoming.length },
            ]}
            active={queueTab}
            onChange={setQueueTab}
          />
          {queue.error && !queue.data ? <ErrorState error={queue.error} onRetry={() => void queue.reload()} /> : !queue.data ? <Skeleton rows={6} /> : entries.length === 0 ? (
            <EmptyState icon="check" title={queueTab === 'due' ? 'Queue clear' : 'Nothing here'} description={queueTab === 'due' ? 'No calls or follow-ups are due. Check new leads or upcoming calls.' : undefined} />
          ) : (
            <ul className="crm-queue-list">
              {entries.map((entry) => {
                const active = entry.leadId === leadId && (entry.taskId ?? '') === taskId
                return (
                  <li key={entry.taskId ?? entry.leadId}>
                    <button type="button" className={active ? 'active' : ''} onClick={() => select(entry, true)}>
                      <span className="crm-queue-top">
                        <strong>{entry.lead.name}</strong>
                        <PriorityBadge priority={entry.lead.priority} />
                      </span>
                      <span className="crm-queue-meta">{entry.lead.service}</span>
                      <span className="crm-queue-meta">
                        {entry.task ? <><TaskTypeBadge type={entry.task.type} /> <DueLabel date={entry.task.dueAt} /></> : <span>{entry.lead.leadId} · Never called · score {entry.lead.score}</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <div className="crm-stack crm-call-panel-col" ref={panelRef}>
          {leadId ? (
            <CallPanel key={`${leadId}:${taskId}`} leadId={leadId} taskId={taskId || undefined} task={entries.find((entry) => entry.taskId === taskId)?.task} canLog={viewingSelf || meta.capabilities.viewAllLeads} onLogged={() => void onLogged()} />
          ) : (
            <Card>
              <EmptyState
                icon="phone"
                title="Select a lead to start calling"
                description="Pick someone from the queue. Calls are dialled through your phone’s dialer and timed automatically."
                action={entries[0] && <Button variant="primary" icon="play" onClick={() => select(entries[0], true)}>Start with {entries[0].lead.name}</Button>}
              />
            </Card>
          )}
          <TodayCalls key={historyKey} agent={agent} />
        </div>
      </div>
    </>
  )
}

function CallPanel({ leadId, taskId, task, canLog, onLogged }: { leadId: string; taskId?: string; task?: QueueTask; canLog: boolean; onLogged: () => void }) {
  const { data, error, reload } = useQuery(`call-lead:${leadId}`, () => api.get<LeadDetail>(`/admin/leads/${leadId}`))
  if (error && !data) return <Card><ErrorState error={error} onRetry={() => void reload()} /></Card>
  if (!data) return <Card><Spinner label="Loading lead" /></Card>
  const { lead } = data
  return (
    <>
      <Card
        title={(
          <span className="crm-call-title">
            {lead.name}
            <small>{lead.leadId} · {lead.service}</small>
          </span>
        )}
        actions={<Link to={`/admin/leads/${lead._id}`} className="crm-btn crm-btn-ghost crm-btn-sm"><span>Open profile</span></Link>}
      >
        <div className="crm-call-summary">
          <a className="crm-call-phone" href={`tel:${lead.phone}`}><Icon name="phone" size={16} />{lead.phone}</a>
          <StageBadge stage={lead.stage} />
          <InterestBadge interest={lead.interest} />
          <ScorePill score={lead.score} />
          <span className="crm-muted">{lead.callAttempts} attempt{lead.callAttempts === 1 ? '' : 's'} · last {lead.lastInteractionAt ? formatRelative(lead.lastInteractionAt) : 'never'}</span>
        </div>
        {task && (
          <div className="crm-call-task">
            <TaskTypeBadge type={task.type} /> <strong>{task.title}</strong> <DueLabel date={task.dueAt} />
            {task.description && <p>{task.description}</p>}
          </div>
        )}
        {lead.lastInteractionSummary && <p className="crm-call-last">Last: {lead.lastInteractionSummary}</p>}
        {lead.notes && <details className="crm-call-notes"><summary>Lead notes</summary><p className="crm-pre">{lead.notes}</p></details>}
        {canLog ? <LogCallForm lead={lead} taskId={taskId} onLogged={onLogged} /> : <p className="crm-muted">You are viewing another agent’s queue.</p>}
      </Card>
      <CallsTab leadId={leadId} />
    </>
  )
}

function TodayCalls({ agent }: { agent: string }) {
  const [page, setPage] = useState(1)
  const day = isoDay(new Date())
  const { data, error, reload } = useQuery(`calls-today:${agent}:${page}`, () => api.get<Paged<Call>>(`/admin/calls${qs({ from: day, to: day, agent, page, limit: 10 })}`))
  return (
    <Card title="Today’s calls" padded={false}>
      {error && !data ? <ErrorState error={error} onRetry={() => void reload()} /> : !data ? <Skeleton rows={3} /> : data.items.length === 0 ? (
        <EmptyState icon="phone" title="No calls logged today" />
      ) : (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead><tr><th>Time</th><th>Lead</th><th>Outcome</th><th>Duration</th><th>Agent</th><th>Notes</th></tr></thead>
            <tbody>
              {data.items.map((call) => {
                const lead = typeof call.lead === 'object' ? call.lead : null
                return (
                  <tr key={call._id}>
                    <td>{formatDateTime(call.startedAt)}</td>
                    <td>{lead ? <Link to={`/admin/leads/${lead._id}`}>{lead.name}<small className="crm-muted"> {lead.leadId}</small></Link> : '—'}</td>
                    <td><OutcomeBadge outcome={call.outcome} /></td>
                    <td>{formatDuration(call.durationSeconds)}</td>
                    <td>{call.agent?.name}</td>
                    <td className="crm-truncate" title={call.notes}>{call.notes ?? <span className="crm-muted">{outcomeMeta[call.outcome].hint}</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPage={setPage} />}
    </Card>
  )
}
