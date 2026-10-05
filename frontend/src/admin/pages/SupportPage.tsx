import { useState } from 'react'
import { SupportStatusBadge } from '../components/badges'
import { PageHeader } from '../components/Layout'
import { Badge, Button, Card, Drawer, EmptyState, ErrorState, Field, Pagination, SearchInput, Select, Skeleton, Textarea } from '../components/ui'
import { useToast } from '../context/contexts'
import { api, qs } from '../lib/api'
import { supportStatusMeta } from '../lib/constants'
import { formatDateTime, formatRelative } from '../lib/format'
import { useDebounced, useQuery } from '../lib/hooks'
import { Link } from '../components/Link'
import type { Paged, UserRef } from '../lib/types'

interface SupportRequest {
  _id: string
  ticketNumber: string
  name: string
  email: string
  phone: string
  message: string
  salesConsultation: boolean
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  notes?: string
  lead?: { _id: string; leadId: string } | null
  handledBy?: UserRef | null
  createdAt: string
  updatedAt: string
}

const statuses = ['open', 'in-progress', 'resolved', 'closed'] as const

export function SupportPage() {
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<SupportRequest | null>(null)
  const search = useDebounced(query, 350)
  const { data, error, reload } = useQuery(`support:${status}:${search}:${page}`, () => api.get<Paged<SupportRequest> & { counts: Record<string, number> }>(`/admin/support-requests${qs({ status, search, page, limit: 25 })}`), { pollMs: 60_000 })

  return (
    <>
      <PageHeader title="Support inbox" description="Messages from the website contact form. Requests for a sales consultation also create a lead automatically." />
      <Card padded={false}>
        <div className="crm-filters">
          <div className="crm-segmented">
            <button type="button" className={status === '' ? 'active' : ''} onClick={() => { setStatus(''); setPage(1) }}>All</button>
            {statuses.map((item) => (
              <button key={item} type="button" className={status === item ? 'active' : ''} onClick={() => { setStatus(item); setPage(1) }}>
                {supportStatusMeta[item].label}{data?.counts[item] ? ` (${data.counts[item]})` : ''}
              </button>
            ))}
          </div>
          <SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1) }} placeholder="Search ticket, name, email, phone, message" />
        </div>
        {error && !data ? <ErrorState error={error} onRetry={() => void reload()} /> : !data ? <Skeleton rows={8} /> : data.items.length === 0 ? (
          <EmptyState icon="support" title="No support requests" description={status || search ? 'Try clearing the filters.' : 'Contact form submissions will appear here.'} />
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead><tr><th>Ticket</th><th>From</th><th>Message</th><th>Status</th><th>Lead</th><th>Received</th></tr></thead>
              <tbody>
                {data.items.map((ticket) => (
                  <tr key={ticket._id} onClick={() => setSelected(ticket)} className="crm-row-clickable">
                    <td><strong>{ticket.ticketNumber}</strong>{ticket.salesConsultation && <div><Badge tone="violet">Sales consult</Badge></div>}</td>
                    <td>{ticket.name}<div className="crm-muted">{ticket.email}</div></td>
                    <td><div className="crm-truncate crm-truncate-wide">{ticket.message}</div></td>
                    <td><SupportStatusBadge status={ticket.status} />{ticket.handledBy && <div className="crm-muted">{ticket.handledBy.name}</div>}</td>
                    <td>{ticket.lead ? <Link to={`/admin/leads/${ticket.lead._id}`} onClick={(event) => event.stopPropagation()}>{ticket.lead.leadId}</Link> : '—'}</td>
                    <td>{formatRelative(ticket.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPage={setPage} />}
      </Card>
      {selected && (
        <TicketDrawer
          key={selected._id}
          ticket={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null)
            void reload({ silent: true })
          }}
        />
      )}
    </>
  )
}

function TicketDrawer({ ticket, onClose, onSaved }: { ticket: SupportRequest; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const [status, setStatus] = useState(ticket.status)
  const [notes, setNotes] = useState(ticket.notes ?? '')
  const [saving, setSaving] = useState(false)
  const changed = status !== ticket.status || notes !== (ticket.notes ?? '')

  async function save() {
    setSaving(true)
    try {
      await api.patch(`/admin/support-requests/${ticket._id}`, { status, notes })
      toast.success(`${ticket.ticketNumber} updated`)
      onSaved()
    } catch (caught) {
      toast.error(caught)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open onClose={onClose} title={ticket.ticketNumber} subtitle={`Received ${formatDateTime(ticket.createdAt)}`} footer={(
      <>
        <Button onClick={onClose}>Close</Button>
        <Button variant="primary" onClick={() => void save()} loading={saving} disabled={!changed}>Save</Button>
      </>
    )}>
      <dl className="crm-dl">
        <div><dt>Name</dt><dd>{ticket.name}</dd></div>
        <div><dt>Email</dt><dd><a href={`mailto:${ticket.email}`}>{ticket.email}</a></dd></div>
        <div><dt>Phone</dt><dd><a href={`tel:${ticket.phone}`}>{ticket.phone}</a></dd></div>
        <div><dt>Sales consultation</dt><dd>{ticket.salesConsultation ? 'Requested' : 'No'}</dd></div>
        {ticket.lead && <div><dt>Lead</dt><dd><Link to={`/admin/leads/${ticket.lead._id}`}>{ticket.lead.leadId}</Link></dd></div>}
        {ticket.handledBy && <div><dt>Last handled by</dt><dd>{ticket.handledBy.name} · {formatRelative(ticket.updatedAt)}</dd></div>}
      </dl>
      <h3 className="crm-subheading">Message</h3>
      <p className="crm-pre crm-message-box">{ticket.message}</p>
      <div className="crm-form-grid">
        <Field label="Status">
          <Select value={status} onChange={(event) => setStatus(event.target.value as SupportRequest['status'])}>
            {statuses.map((item) => <option key={item} value={item}>{supportStatusMeta[item].label}</option>)}
          </Select>
        </Field>
        <div className="crm-span-2">
          <Field label="Internal notes"><Textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} /></Field>
        </div>
      </div>
    </Drawer>
  )
}
