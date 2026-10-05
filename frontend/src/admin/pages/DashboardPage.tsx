import { useState } from 'react'
import { ActivityTimeline } from '../components/ActivityTimeline'
import { DateRange } from '../components/DateRange'
import { PageHeader } from '../components/Layout'
import { NotificationItem } from '../components/NotificationCenter'
import { TaskRow } from '../components/Tasks'
import { Card, EmptyState, ErrorState, HorizontalBars, ProgressBar, Skeleton, StatCard } from '../components/ui'
import { useSession, useToast } from '../context/contexts'
import { api, qs } from '../lib/api'
import { stageMeta } from '../lib/constants'
import { defaultRange, formatCurrency, formatNumber, formatPercent, formatRelative } from '../lib/format'
import { useQuery } from '../lib/hooks'
import { Link } from '../components/Link'
import { navigate } from '../lib/router'
import type { Activity, LeadStage, Notification, Task } from '../lib/types'

interface PerformanceRow {
  id: string
  name: string
  employeeCode: string
  dailyCallTarget: number
  callsToday: number
  targetProgress: number
  calls: number
  connected: number
  conversions: number
  revenue: number
  conversionRate: number
  openTasks: number
  overdueTasks: number
}

interface DashboardData {
  generatedAt: string
  metrics: {
    newLeadsToday: number
    uncontacted: number
    callsToday: number
    connectedToday: number
    pendingCalls: number
    followUpsToday: number
    overdueTasks: number
    hotLeads: number
    convertedLeads: number
    revenue: number
    pendingRevenue: number
    pendingPayments: number
    leadsCreated: number
    conversionRate: number
  }
  pipeline: Array<{ stage: LeadStage; count: number; value: number }>
  myTasks: Task[]
  recentActivity: Activity[]
  reminders: Notification[]
  performance: PerformanceRow[] | null
}

export function DashboardPage() {
  const { user } = useSession()
  const toast = useToast()
  const [range, setRange] = useState(defaultRange)
  const { data, error, loading, reload } = useQuery(`dashboard:${range.from}:${range.to}`, () => api.get<DashboardData>(`/admin/dashboard${qs(range)}`), { pollMs: 30_000 })

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'

  async function openReminder(notification: Notification) {
    try {
      if (!notification.readAt) await api.post(`/admin/notifications/${notification._id}/read`)
      if (notification.lead) navigate(`/admin/leads/${notification.lead._id}`)
      else void reload({ silent: true })
    } catch (caught) {
      toast.error(caught)
    }
  }

  return (
    <>
      <PageHeader
        title={`${greeting}, ${user.name.split(' ')[0]}`}
        description={data ? <>Live overview · updated {formatRelative(data.generatedAt)} <span className="crm-live-dot" aria-hidden="true" /></> : 'Live overview of your sales activity'}
        actions={<DateRange value={range} onChange={setRange} />}
      />
      {error && !data ? <ErrorState error={error} onRetry={() => void reload()} /> : !data ? <Card><Skeleton rows={8} /></Card> : (
        <div className={loading ? 'crm-refreshing' : ''}>
          <div className="crm-stat-grid">
            <StatCard label="New leads today" value={formatNumber(data.metrics.newLeadsToday)} icon="leads" tone="blue" hint={`${data.metrics.uncontacted} not yet contacted`} onClick={() => navigate('/admin/leads?stage=new')} />
            <StatCard label="Calls today" value={formatNumber(data.metrics.callsToday)} icon="phone" tone="pink" hint={`${data.metrics.connectedToday} connected`} onClick={() => navigate('/admin/calls')} />
            <StatCard label="Pending calls" value={formatNumber(data.metrics.pendingCalls)} icon="clock" tone="amber" hint="Due today or earlier" onClick={() => navigate('/admin/calls')} />
            <StatCard label="Follow-ups today" value={formatNumber(data.metrics.followUpsToday)} icon="calendar" tone="violet" onClick={() => navigate('/admin/tasks?type=follow_up&due=today')} />
            <StatCard label="Overdue tasks" value={formatNumber(data.metrics.overdueTasks)} icon="alert" tone={data.metrics.overdueTasks ? 'red' : 'gray'} onClick={() => navigate('/admin/tasks?due=overdue')} />
            <StatCard label="Hot leads" value={formatNumber(data.metrics.hotLeads)} icon="flame" tone="orange" onClick={() => navigate('/admin/leads?interest=hot')} />
            <StatCard label="Converted" value={formatNumber(data.metrics.convertedLeads)} icon="trophy" tone="green" hint="In selected period" onClick={() => navigate('/admin/leads?stage=converted')} />
            <StatCard label="Revenue" value={formatCurrency(data.metrics.revenue)} icon="rupee" tone="teal" hint={`${formatCurrency(data.metrics.pendingRevenue)} pending`} />
            <StatCard label="Conversion rate" value={formatPercent(data.metrics.conversionRate)} icon="percent" tone="indigo" hint={`of ${data.metrics.leadsCreated} leads created`} />
          </div>

          <div className="crm-grid-2">
            <Card title="My tasks due today" actions={<Link to="/admin/tasks" className="crm-link">View all</Link>} padded={false}>
              {data.myTasks.length === 0 ? <EmptyState icon="tasks" title="Nothing due today" description="New calls and follow-ups will show up here automatically." /> : (
                <div className="crm-task-list">{data.myTasks.map((task) => <TaskRow key={task._id} task={task} onChanged={() => void reload({ silent: true })} />)}</div>
              )}
            </Card>
            <Card title="Reminders" actions={<Link to="/admin/notifications" className="crm-link">Notification center</Link>} padded={false}>
              {data.reminders.length === 0 ? <EmptyState icon="bell" title="No unread reminders" /> : (
                <div className="crm-notification-list">{data.reminders.map((item) => <NotificationItem key={item._id} notification={item} onOpen={openReminder} />)}</div>
              )}
            </Card>
          </div>

          <div className="crm-grid-2">
            <Card title="Pipeline" actions={<Link to="/admin/pipeline" className="crm-link">Open board</Link>}>
              <HorizontalBars
                data={data.pipeline.map((row) => ({ label: stageMeta[row.stage].label, value: row.count, tone: stageMeta[row.stage].tone, meta: row.value ? formatCurrency(row.value) : undefined }))}
                format={formatNumber}
              />
            </Card>
            <Card title="Recent activity" padded={false}>
              {data.recentActivity.length === 0 ? <EmptyState icon="activity" title="No activity yet" /> : <div className="crm-scroll-panel"><ActivityTimeline items={data.recentActivity} showLead /></div>}
            </Card>
          </div>

          {data.performance && (
            <Card title="Employee performance" actions={<Link to="/admin/team" className="crm-link">Team details</Link>} padded={false}>
              {data.performance.length === 0 ? <EmptyState icon="team" title="No employees yet" /> : (
                <div className="crm-table-wrap">
                  <table className="crm-table">
                    <thead><tr><th>Employee</th><th>Calls today / target</th><th>Calls</th><th>Connected</th><th>Conversions</th><th>Revenue</th><th>Conv. rate</th><th>Open tasks</th></tr></thead>
                    <tbody>
                      {data.performance.map((row) => (
                        <tr key={row.id}>
                          <td><strong>{row.name}</strong><div className="crm-muted crm-small">{row.employeeCode}</div></td>
                          <td className="crm-target-cell"><span>{row.callsToday} / {row.dailyCallTarget}</span><ProgressBar value={row.targetProgress} tone={row.targetProgress >= 100 ? 'green' : row.targetProgress >= 50 ? 'amber' : 'red'} /></td>
                          <td>{formatNumber(row.calls)}</td>
                          <td>{formatNumber(row.connected)}</td>
                          <td>{formatNumber(row.conversions)}</td>
                          <td>{formatCurrency(row.revenue)}</td>
                          <td>{formatPercent(row.conversionRate)}</td>
                          <td>{row.openTasks}{row.overdueTasks > 0 && <span className="crm-overdue-count">{row.overdueTasks} overdue</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </>
  )
}
