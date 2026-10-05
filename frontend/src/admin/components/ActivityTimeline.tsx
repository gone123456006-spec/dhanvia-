import { describeActivity } from '../lib/activity'
import { formatDateTime } from '../lib/format'
import { Link } from './Link'
import type { Activity } from '../lib/types'
import { Badge } from './ui'

const originLabels: Record<Activity['origin'], string> = {
  user: '',
  automation: 'Automation',
  system: 'System',
  website: 'Website',
}

export function ActivityTimeline({ items, showLead = false }: { items: Activity[]; showLead?: boolean }) {
  return (
    <ol className="crm-timeline">
      {items.map((activity) => {
        const described = describeActivity(activity)
        const lead = typeof activity.lead === 'object' ? activity.lead : null
        return (
          <li key={activity._id} className={`origin-${activity.origin}`}>
            <span className="crm-timeline-icon" aria-hidden="true" />
            <div className="crm-timeline-body">
              <div className="crm-timeline-title">
                <strong>{described.title}</strong>
                {originLabels[activity.origin] && <Badge tone={activity.origin === 'automation' ? 'violet' : 'gray'}>{originLabels[activity.origin]}</Badge>}
              </div>
              {described.change && (
                <div className="crm-timeline-change">
                  <span className="from">{described.change.from}</span>
                  <span aria-label="changed to">→</span>
                  <span className="to">{described.change.to}</span>
                </div>
              )}
              {described.detail && <p className="crm-timeline-detail">{described.detail}</p>}
              <div className="crm-timeline-meta">
                <span>{activity.actor?.name ?? (activity.origin === 'website' ? 'Website visitor' : 'System')}</span>
                {activity.actor?.employeeCode && <span>{activity.actor.employeeCode}</span>}
                <time dateTime={activity.createdAt} title={new Date(activity.createdAt).toLocaleString('en-IN')}>{formatDateTime(activity.createdAt)}</time>
                {showLead && lead && <Link to={`/admin/leads/${lead._id}`}>{lead.leadId} · {lead.name}</Link>}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
