import { useState, type DragEvent } from 'react'
import { DueLabel, PriorityBadge } from '../components/badges'
import { PageHeader } from '../components/Layout'
import { LeadFormModal } from '../components/LeadFormModal'
import { Avatar, Button, ErrorState, SearchInput, Select, Skeleton } from '../components/ui'
import { useConfirm, useSession, useToast } from '../context/contexts'
import { api, qs } from '../lib/api'
import { stageMeta } from '../lib/constants'
import { formatCurrency } from '../lib/format'
import { useDebounced, useQuery } from '../lib/hooks'
import { Link } from '../components/Link'
import type { Lead, LeadStage } from '../lib/types'

interface Column {
  stage: LeadStage
  items: Lead[]
  count: number
  value: number
}

const DRAG_TYPE = 'application/x-crm-lead'

export function PipelinePage() {
  const { meta } = useSession()
  const toast = useToast()
  const confirm = useConfirm()
  const [query, setQuery] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [service, setService] = useState('')
  const [creating, setCreating] = useState(false)
  const [dragOver, setDragOver] = useState<LeadStage | null>(null)
  const [moving, setMoving] = useState<string | null>(null)
  const [optimistic, setOptimistic] = useState<{ id: string; stage: LeadStage } | null>(null)
  const q = useDebounced(query, 350)
  const filters = { q, assignedTo, service, perStage: 50 }
  const { data, error, reload } = useQuery(`pipeline:${JSON.stringify(filters)}`, () => api.get<{ columns: Column[] }>(`/admin/leads/pipeline${qs(filters)}`), { pollMs: 60_000 })

  const columns = (data?.columns ?? []).map((column) => {
    if (!optimistic) return column
    const items = column.items.filter((lead) => lead._id !== optimistic.id)
    if (column.stage === optimistic.stage) {
      const moved = data?.columns.flatMap((item) => item.items).find((lead) => lead._id === optimistic.id)
      if (moved && moved.stage !== optimistic.stage) return { ...column, items: [{ ...moved, stage: optimistic.stage }, ...items], count: column.count + 1 }
    }
    return { ...column, items, count: items.length < column.items.length ? column.count - 1 : column.count }
  })

  async function moveLead(lead: Lead, stage: LeadStage) {
    if (lead.stage === stage) return
    let lostReason: string | undefined
    if (stage === 'lost') {
      const reason = await confirm({ title: `Mark ${lead.name} as lost`, confirmLabel: 'Mark lost', tone: 'danger', input: { label: 'Lost reason', options: meta.lostReasons } })
      if (reason === false) return
      lostReason = reason
    } else if (stage === 'converted') {
      const ok = await confirm({ title: `Mark ${lead.name} as converted?`, message: 'Use this when the customer has committed and payment is confirmed. Payment records drive revenue reports.', confirmLabel: 'Convert' })
      if (!ok) return
    }
    setOptimistic({ id: lead._id, stage })
    setMoving(lead._id)
    try {
      await api.post(`/admin/leads/${lead._id}/stage`, { stage, lostReason })
      toast.success(`${lead.name} → ${stageMeta[stage].label}`)
      await reload({ silent: true })
    } catch (caught) {
      toast.error(caught)
    } finally {
      setOptimistic(null)
      setMoving(null)
    }
  }

  function onDrop(event: DragEvent, stage: LeadStage) {
    event.preventDefault()
    setDragOver(null)
    const id = event.dataTransfer.getData(DRAG_TYPE)
    const lead = data?.columns.flatMap((column) => column.items).find((item) => item._id === id)
    if (lead) void moveLead(lead, stage)
  }

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Drag a card to another column to change its stage. Every move is logged."
        actions={<Button variant="primary" icon="plus" onClick={() => setCreating(true)}>Add lead</Button>}
      />
      <div className="crm-filters crm-filters-bare">
        <SearchInput value={query} onChange={setQuery} placeholder="Search leads" />
        <Select value={service} onChange={(event) => setService(event.target.value)} aria-label="Service">
          <option value="">All services</option>
          {meta.services.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        {meta.capabilities.viewAllLeads && (
          <Select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} aria-label="Assigned to">
            <option value="">Everyone</option>
            <option value="me">My leads</option>
            <option value="unassigned">Unassigned</option>
            {meta.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </Select>
        )}
      </div>

      {error && !data ? <ErrorState error={error} onRetry={() => void reload()} /> : !data ? <Skeleton rows={8} /> : (
        <div className="crm-kanban">
          {columns.map((column) => (
            <section
              key={column.stage}
              className={`crm-kanban-col ${dragOver === column.stage ? 'drag-over' : ''}`}
              onDragOver={(event) => {
                if (!event.dataTransfer.types.includes(DRAG_TYPE)) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                if (dragOver !== column.stage) setDragOver(column.stage)
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(null)
              }}
              onDrop={(event) => onDrop(event, column.stage)}
              aria-label={`${stageMeta[column.stage].label} column`}
            >
              <header className={`crm-kanban-head crm-tone-${stageMeta[column.stage].tone}`}>
                <span className="crm-kanban-title"><span className="crm-badge-dot" />{stageMeta[column.stage].label}</span>
                <span className="crm-kanban-count">{column.count}</span>
                <small>{formatCurrency(column.value)}</small>
              </header>
              <div className="crm-kanban-body">
                {column.items.length === 0 && <p className="crm-kanban-empty">Drop leads here</p>}
                {column.items.map((lead) => (
                  <article
                    key={lead._id}
                    className={`crm-kanban-card ${moving === lead._id ? 'moving' : ''}`}
                    draggable={moving !== lead._id}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(DRAG_TYPE, lead._id)
                      event.dataTransfer.effectAllowed = 'move'
                    }}
                  >
                    <div className="crm-kanban-card-top">
                      <Link to={`/admin/leads/${lead._id}`} draggable={false}><strong>{lead.name}</strong></Link>
                      <PriorityBadge priority={lead.priority} />
                    </div>
                    <div className="crm-kanban-meta">{lead.leadId} · {lead.service}</div>
                    {lead.nextAction && <div className="crm-kanban-next">Next: {lead.nextAction}</div>}
                    <div className="crm-kanban-card-foot">
                      {lead.nextActionDueAt ? <DueLabel date={lead.nextActionDueAt} /> : <span className="crm-muted">No due date</span>}
                      <span className="crm-kanban-owner" title={lead.assignedTo?.name ?? 'Unassigned'}>
                        {lead.dealValue > 0 && <small>{formatCurrency(lead.dealValue)}</small>}
                        <Avatar name={lead.assignedTo?.name} size={22} />
                      </span>
                    </div>
                    <label className="crm-kanban-move">
                      <span className="crm-sr-only">Move {lead.name} to stage</span>
                      <select value={lead.stage} disabled={moving === lead._id} onChange={(event) => void moveLead(lead, event.target.value as LeadStage)}>
                        {meta.enums.leadStages.map((stage) => <option key={stage} value={stage}>{stageMeta[stage].label}</option>)}
                      </select>
                    </label>
                  </article>
                ))}
                {column.count > column.items.length && (
                  <Link className="crm-kanban-more" to={`/admin/leads?stage=${column.stage}`}>View all {column.count} →</Link>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
      <LeadFormModal open={creating} onClose={() => setCreating(false)} onCreated={() => void reload({ silent: true })} />
    </>
  )
}
