import { useState } from 'react'
import { StageBadge } from '../components/badges'
import { PageHeader } from '../components/Layout'
import { Link } from '../components/Link'
import { Badge, Card, EmptyState, ErrorState, Pagination, SearchInput, Skeleton } from '../components/ui'
import { api, qs } from '../lib/api'
import { WEBSITE_SOURCE } from '../lib/constants'
import { formatDateTime, formatRelative } from '../lib/format'
import { useDebounced, useQuery } from '../lib/hooks'
import { navigate } from '../lib/router'
import type { Lead, Paged } from '../lib/types'

const forms = [
  { id: '', label: 'All forms' },
  { id: 'consultation', label: 'Free consultation' },
  { id: 'contact', label: 'Contact form' },
] as const

const views = [
  { id: 'new', label: 'New' },
  { id: '', label: 'All' },
] as const

function formLabel(lead: Lead): { label: string; page?: string } {
  const [label, page] = (lead.sourceDetail ?? 'Website form').split(' · ')
  return { label, page }
}

export function EnquiriesPage() {
  const [form, setForm] = useState('')
  const [stage, setStage] = useState('new')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(query.trim(), 350)
  const listQuery = { source: WEBSITE_SOURCE, form, stage, q, page, limit: 25, archived: 'false' }
  const { data, error, reload } = useQuery(`enquiries:${JSON.stringify(listQuery)}`, () => api.get<Paged<Lead>>(`/admin/leads${qs(listQuery)}`), { pollMs: 30_000 })

  return (
    <>
      <PageHeader
        title="Website enquiries"
        description="Every “Claim your Free Consultation” and contact-form submission from the website. Each one is already a lead — open it to call, assign, or follow up."
      />
      <Card padded={false}>
        <div className="crm-filters">
          <div className="crm-segmented">
            {views.map((item) => (
              <button key={item.id} type="button" className={stage === item.id ? 'active' : ''} onClick={() => { setStage(item.id); setPage(1) }}>{item.label}</button>
            ))}
          </div>
          <div className="crm-segmented">
            {forms.map((item) => (
              <button key={item.id} type="button" className={form === item.id ? 'active' : ''} onClick={() => { setForm(item.id); setPage(1) }}>{item.label}</button>
            ))}
          </div>
          <SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1) }} placeholder="Search name, phone, email, service" />
        </div>
        {error && !data ? <ErrorState error={error} onRetry={() => void reload()} /> : !data ? <Skeleton rows={8} /> : data.items.length === 0 ? (
          <EmptyState
            icon="inbox"
            title={stage === 'new' ? 'No new enquiries' : 'No website enquiries'}
            description={stage === 'new' ? 'You’re all caught up. Enquiries move out of “New” once a lead is contacted.' : 'Submissions from the website forms will appear here.'}
          />
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead><tr><th>Lead</th><th>Contact</th><th>Service</th><th>Form</th><th>Stage</th><th>Owner</th><th>Received</th></tr></thead>
              <tbody>
                {data.items.map((lead) => {
                  const { label, page: pagePath } = formLabel(lead)
                  return (
                    <tr key={lead._id} className="crm-row-clickable" onClick={() => navigate(`/admin/leads/${lead._id}`)}>
                      <td><Link to={`/admin/leads/${lead._id}`} onClick={(event) => event.stopPropagation()}><strong>{lead.name}</strong></Link><div className="crm-muted">{lead.leadId}</div></td>
                      <td><a href={`tel:${lead.phone}`} onClick={(event) => event.stopPropagation()}>{lead.phone}</a>{lead.email && <div className="crm-muted">{lead.email}</div>}</td>
                      <td>{lead.service}</td>
                      <td><Badge tone={label.startsWith('Contact') ? 'violet' : 'green'}>{label}</Badge>{pagePath && <div className="crm-muted crm-truncate">{pagePath}</div>}</td>
                      <td><StageBadge stage={lead.stage} /></td>
                      <td>{lead.assignedTo?.name ?? <span className="crm-muted">Unassigned</span>}</td>
                      <td title={formatDateTime(lead.createdAt)}>{formatRelative(lead.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPage={setPage} />}
      </Card>
    </>
  )
}
