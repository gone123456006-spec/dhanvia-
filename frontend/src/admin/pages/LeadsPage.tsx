import { useEffect, useState } from 'react'
import { DueLabel, InterestBadge, PriorityBadge, ScorePill, StageBadge, StatusBadge } from '../components/badges'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/Layout'
import { LeadFormModal } from '../components/LeadFormModal'
import { Badge, Button, Card, EmptyState, ErrorState, Pagination, SearchInput, Select, Skeleton } from '../components/ui'
import { useConfirm, useSession, useToast } from '../context/contexts'
import { api, downloadFile, qs } from '../lib/api'
import { interestMeta, priorityMeta, stageMeta, statusMeta } from '../lib/constants'
import { formatCurrency, formatRelative } from '../lib/format'
import { useDebounced, useQuery } from '../lib/hooks'
import { Link } from '../components/Link'
import { navigate, setSearchParams, useLocation } from '../lib/router'
import type { Lead, LeadStage, Paged } from '../lib/types'

const filterKeys = ['q', 'stage', 'status', 'priority', 'interest', 'source', 'service', 'assignedTo', 'followUp', 'archived', 'sort', 'order', 'page'] as const

type SortKey = 'createdAt' | 'score' | 'followUpAt' | 'nextActionDueAt' | 'lastInteractionAt' | 'name' | 'dealValue'

function SortHeader({ field, sort, order, children }: { field: SortKey; sort: string; order: string; children: string }) {
  const active = sort === field
  return (
    <th aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : undefined}>
      <button type="button" className="crm-sort" onClick={() => setSearchParams({ sort: field, order: active && order !== 'asc' ? 'asc' : 'desc' })}>
        {children}
        {active && <Icon name="chevronDown" size={12} className={order === 'asc' ? 'crm-flip' : ''} />}
      </button>
    </th>
  )
}

export function LeadsPage() {
  const { meta } = useSession()
  const toast = useToast()
  const confirm = useConfirm()
  const { search } = useLocation()
  const params = Object.fromEntries(filterKeys.map((key) => [key, search.get(key) ?? ''])) as Record<(typeof filterKeys)[number], string>
  const [query, setQuery] = useState(params.q)
  const debouncedQuery = useDebounced(query, 350)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const caps = meta.capabilities

  useEffect(() => {
    if (debouncedQuery !== (search.get('q') ?? '')) setSearchParams({ q: debouncedQuery, page: undefined })
  }, [debouncedQuery, search])

  const page = Number(params.page) || 1
  const listQuery = { ...params, page, limit: 25 }
  const key = JSON.stringify(listQuery)
  const { data, error, loading, reload } = useQuery(`leads:${key}`, () => api.get<Paged<Lead>>(`/admin/leads${qs(listQuery)}`), { pollMs: 60_000 })

  const setFilter = (name: string, value: string) => {
    setSearchParams({ [name]: value, page: undefined })
    setSelected(new Set())
  }

  const sortProps = { sort: params.sort, order: params.order }

  const items = data?.items ?? []
  const allSelected = items.length > 0 && items.every((lead) => selected.has(lead._id))
  const activeFilters = filterKeys.filter((name) => !['q', 'sort', 'order', 'page'].includes(name) && params[name]).length

  async function runBulk(body: Record<string, unknown>, label: string) {
    setBulkBusy(true)
    try {
      const result = await api.post<{ updated: number; failed: Array<{ leadId: string; error: string }>; skipped: number }>('/admin/leads/bulk', { ids: [...selected], ...body })
      if (result.failed.length) toast.error(new Error(`${result.updated} updated, ${result.failed.length} failed: ${result.failed[0].leadId} – ${result.failed[0].error}`))
      else toast.success(`${label}: ${result.updated} lead(s) updated`)
      setSelected(new Set())
      await reload({ silent: true })
    } catch (caught) {
      toast.error(caught)
    } finally {
      setBulkBusy(false)
    }
  }

  async function bulkStage(stage: string) {
    if (!stage) return
    let lostReason: string | undefined
    if (stage === 'lost') {
      const reason = await confirm({ title: `Mark ${selected.size} lead(s) as lost`, confirmLabel: 'Mark lost', tone: 'danger', input: { label: 'Lost reason', options: meta.lostReasons } })
      if (reason === false) return
      lostReason = reason
    } else {
      const ok = await confirm({ title: `Move ${selected.size} lead(s) to ${stageMeta[stage as LeadStage].label}?`, message: 'Each lead’s stage change is recorded in its activity timeline and next tasks are created automatically.', confirmLabel: 'Move leads' })
      if (!ok) return
    }
    await runBulk({ action: 'stage', stage, lostReason }, 'Stage changed')
  }

  async function bulkAssign(assignedTo: string) {
    if (!assignedTo) return
    const name = assignedTo === 'none' ? 'nobody (unassign)' : meta.users.find((user) => user.id === assignedTo)?.name
    const ok = await confirm({ title: `Assign ${selected.size} lead(s) to ${name}?`, confirmLabel: 'Assign' })
    if (ok) await runBulk({ action: 'assign', assignedTo: assignedTo === 'none' ? null : assignedTo }, 'Assigned')
  }

  async function bulkArchive(archive: boolean) {
    const ok = await confirm({
      title: `${archive ? 'Archive' : 'Restore'} ${selected.size} lead(s)?`,
      message: archive ? 'Archived leads are hidden from lists but all history is kept.' : undefined,
      confirmLabel: archive ? 'Archive' : 'Restore',
      tone: archive ? 'danger' : 'primary',
    })
    if (ok) await runBulk({ action: archive ? 'archive' : 'unarchive' }, archive ? 'Archived' : 'Restored')
  }

  async function exportLeads(onlySelected: boolean) {
    setExporting(true)
    try {
      const exportQuery = onlySelected ? { ids: [...selected] } : { ...params, page: undefined }
      await downloadFile(`/admin/leads/export${qs(exportQuery)}`, 'leads.csv')
      toast.success('Export ready')
    } catch (caught) {
      toast.error(caught)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Leads"
        description={data ? `${data.total.toLocaleString('en-IN')} lead${data.total === 1 ? '' : 's'}${caps.viewAllLeads ? '' : ' assigned to you'}` : undefined}
        actions={(
          <>
            {caps.exportData && <Button icon="download" loading={exporting} onClick={() => void exportLeads(false)}>Export</Button>}
            <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>Add lead</Button>
          </>
        )}
      />

      <Card padded={false}>
        <div className="crm-filters">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, phone, email, Lead ID, service" />
          <Button className="crm-filter-toggle" icon="filter" aria-expanded={filtersOpen} aria-controls="lead-filters" onClick={() => setFiltersOpen((open) => !open)}>
            Filters{activeFilters > 0 ? ` (${activeFilters})` : ''}
          </Button>
          <div id="lead-filters" className={`crm-filter-extra ${filtersOpen ? 'open' : ''}`}>
          <Select value={params.stage} onChange={(event) => setFilter('stage', event.target.value)} aria-label="Stage">
            <option value="">All stages</option>
            {meta.enums.leadStages.map((stage) => <option key={stage} value={stage}>{stageMeta[stage].label}</option>)}
          </Select>
          <Select value={params.status} onChange={(event) => setFilter('status', event.target.value)} aria-label="Status">
            <option value="">All statuses</option>
            {meta.enums.leadStatuses.map((status) => <option key={status} value={status}>{statusMeta[status].label}</option>)}
          </Select>
          <Select value={params.priority} onChange={(event) => setFilter('priority', event.target.value)} aria-label="Priority">
            <option value="">Any priority</option>
            {meta.enums.priorities.map((priority) => <option key={priority} value={priority}>{priorityMeta[priority].label}</option>)}
          </Select>
          <Select value={params.interest} onChange={(event) => setFilter('interest', event.target.value)} aria-label="Interest">
            <option value="">Any interest</option>
            {meta.enums.interestLevels.map((interest) => <option key={interest} value={interest}>{interestMeta[interest].label}</option>)}
          </Select>
          <Select value={params.followUp} onChange={(event) => setFilter('followUp', event.target.value)} aria-label="Follow-up">
            <option value="">Any follow-up</option>
            <option value="today">Due today</option>
            <option value="overdue">Overdue</option>
            <option value="upcoming">Upcoming</option>
            <option value="none">Not scheduled</option>
          </Select>
          <Select value={params.source} onChange={(event) => setFilter('source', event.target.value)} aria-label="Source">
            <option value="">All sources</option>
            {meta.leadSources.map((source) => <option key={source} value={source}>{source}</option>)}
          </Select>
          <Select value={params.service} onChange={(event) => setFilter('service', event.target.value)} aria-label="Service">
            <option value="">All services</option>
            {meta.services.map((service) => <option key={service} value={service}>{service}</option>)}
          </Select>
          {caps.viewAllLeads && (
            <Select value={params.assignedTo} onChange={(event) => setFilter('assignedTo', event.target.value)} aria-label="Assigned to">
              <option value="">Everyone</option>
              <option value="me">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
              {meta.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </Select>
          )}
          <Select value={params.archived} onChange={(event) => setFilter('archived', event.target.value)} aria-label="Archived">
            <option value="">Active leads</option>
            <option value="true">Archived</option>
            <option value="all">Active + archived</option>
          </Select>
          </div>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" icon="x" onClick={() => {
              setQuery('')
              navigate('/admin/leads', { replace: true })
            }}>Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}</Button>
          )}
        </div>

        {selected.size > 0 && (
          <div className="crm-bulk-bar" role="region" aria-label="Bulk actions">
            <strong>{selected.size} selected</strong>
            {caps.assignLeads && (
              <Select value="" onChange={(event) => void bulkAssign(event.target.value)} disabled={bulkBusy} aria-label="Assign selected">
                <option value="">Assign to…</option>
                {meta.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                <option value="none">Unassign</option>
              </Select>
            )}
            <Select value="" onChange={(event) => void bulkStage(event.target.value)} disabled={bulkBusy} aria-label="Move selected to stage">
              <option value="">Move to stage…</option>
              {meta.enums.leadStages.map((stage) => <option key={stage} value={stage}>{stageMeta[stage].label}</option>)}
            </Select>
            <Select value="" onChange={(event) => event.target.value && void runBulk({ action: 'priority', priority: event.target.value }, 'Priority updated')} disabled={bulkBusy} aria-label="Set priority">
              <option value="">Set priority…</option>
              {meta.enums.priorities.map((priority) => <option key={priority} value={priority}>{priorityMeta[priority].label}</option>)}
            </Select>
            {caps.exportData && <Button size="sm" icon="download" onClick={() => void exportLeads(true)} loading={exporting}>Export selected</Button>}
            {caps.archiveLeads && (params.archived === 'true'
              ? <Button size="sm" icon="refresh" onClick={() => void bulkArchive(false)} disabled={bulkBusy}>Restore</Button>
              : <Button size="sm" variant="danger" icon="archive" onClick={() => void bulkArchive(true)} disabled={bulkBusy}>Archive</Button>)}
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}

        {error && !data ? <ErrorState error={error} onRetry={() => void reload()} /> : !data ? <Skeleton rows={10} /> : items.length === 0 ? (
          <EmptyState
            icon="leads"
            title={activeFilters || params.q ? 'No leads match these filters' : 'No leads yet'}
            description={activeFilters || params.q ? 'Try clearing some filters.' : 'Leads from the website forms appear here automatically, or add one manually.'}
            action={<Button variant="primary" icon="plus" onClick={() => setCreating(true)}>Add lead</Button>}
          />
        ) : (
          <div className={`crm-table-wrap ${loading ? 'crm-refreshing' : ''}`}>
            <table className="crm-table crm-table-leads">
              <thead>
                <tr>
                  <th className="crm-check-col">
                    <input type="checkbox" aria-label="Select all on this page" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((lead) => lead._id)))} />
                  </th>
                  <SortHeader field="name" {...sortProps}>Lead</SortHeader>
                  <th>Service / Source</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <SortHeader field="score" {...sortProps}>Score</SortHeader>
                  <th>Assigned</th>
                  <SortHeader field="lastInteractionAt" {...sortProps}>Last interaction</SortHeader>
                  <SortHeader field="nextActionDueAt" {...sortProps}>Next action</SortHeader>
                  <SortHeader field="dealValue" {...sortProps}>Value</SortHeader>
                  <SortHeader field="createdAt" {...sortProps}>Created</SortHeader>
                </tr>
              </thead>
              <tbody>
                {items.map((lead) => (
                  <tr key={lead._id} className={selected.has(lead._id) ? 'selected' : ''} onClick={(event) => {
                    if ((event.target as HTMLElement).closest('input, a, button')) return
                    navigate(`/admin/leads/${lead._id}`)
                  }}>
                    <td className="crm-check-col">
                      <input type="checkbox" aria-label={`Select ${lead.name}`} checked={selected.has(lead._id)} onChange={() => {
                        const next = new Set(selected)
                        if (next.has(lead._id)) next.delete(lead._id)
                        else next.add(lead._id)
                        setSelected(next)
                      }} />
                    </td>
                    <td>
                      <Link to={`/admin/leads/${lead._id}`} className="crm-lead-cell">
                        <strong>{lead.name}</strong>
                        <small>{lead.leadId} · {lead.phone}</small>
                      </Link>
                      {lead.archived && <Badge>Archived</Badge>}
                    </td>
                    <td><div>{lead.service}</div><small className="crm-muted">{lead.source}</small></td>
                    <td><StageBadge stage={lead.stage} /></td>
                    <td><StatusBadge status={lead.status} /></td>
                    <td><PriorityBadge priority={lead.priority} />{lead.interest === 'hot' && <InterestBadge interest="hot" />}</td>
                    <td><ScorePill score={lead.score} /></td>
                    <td>{lead.assignedTo?.name ?? <span className="crm-muted">Unassigned</span>}</td>
                    <td><div className="crm-truncate" title={lead.lastInteractionSummary}>{lead.lastInteractionSummary ?? '—'}</div><small className="crm-muted">{lead.lastInteractionAt ? formatRelative(lead.lastInteractionAt) : 'Never contacted'}</small></td>
                    <td><div className="crm-truncate" title={lead.nextAction ?? undefined}>{lead.nextAction ?? <span className="crm-muted">None</span>}</div>{lead.nextActionDueAt && <DueLabel date={lead.nextActionDueAt} />}</td>
                    <td>{lead.dealValue ? formatCurrency(lead.dealValue) : '—'}</td>
                    <td><small>{formatRelative(lead.createdAt)}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPage={(next) => setSearchParams({ page: next })} />}
      </Card>

      <LeadFormModal open={creating} onClose={() => setCreating(false)} />
    </>
  )
}
