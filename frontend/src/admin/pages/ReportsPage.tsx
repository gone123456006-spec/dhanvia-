import { useState, type ReactNode } from 'react'
import { DateRange } from '../components/DateRange'
import { PageHeader } from '../components/Layout'
import { BarChart, Button, Card, EmptyState, ErrorState, HorizontalBars, Skeleton, Tabs } from '../components/ui'
import { useSession } from '../context/contexts'
import { api, qs } from '../lib/api'
import { outcomeMeta, paymentMethodLabels, stageMeta } from '../lib/constants'
import { defaultRange, formatCurrency, formatDuration, formatNumber, formatPercent, humanize, type DateRangeValue } from '../lib/format'
import { useQuery } from '../lib/hooks'
import { setSearchParams, useLocation } from '../lib/router'
import type { CallOutcome, LeadStage } from '../lib/types'

const reportTypes = [
  { id: 'lead-source', label: 'Lead sources' },
  { id: 'calling', label: 'Calling' },
  { id: 'follow-up', label: 'Follow-ups' },
  { id: 'conversion', label: 'Conversion' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'service', label: 'Services' },
  { id: 'employee', label: 'Employees' },
] as const
type ReportType = (typeof reportTypes)[number]['id']

type Row = Record<string, string | number>
interface ReportData {
  rows: Row[]
  totals?: Record<string, number>
  series?: Row[]
  methods?: Row[]
}

interface Column {
  key: string
  label: string
  format?: 'number' | 'currency' | 'percent' | 'duration' | 'stage' | 'outcome' | 'text'
}

const columnsByType: Record<ReportType, Column[]> = {
  'lead-source': [
    { key: 'source', label: 'Source' }, { key: 'leads', label: 'Leads', format: 'number' }, { key: 'hot', label: 'Hot', format: 'number' },
    { key: 'converted', label: 'Converted', format: 'number' }, { key: 'lost', label: 'Lost', format: 'number' }, { key: 'conversionRate', label: 'Conv. rate', format: 'percent' },
    { key: 'avgScore', label: 'Avg score', format: 'number' }, { key: 'pipelineValue', label: 'Pipeline value', format: 'currency' }, { key: 'revenue', label: 'Collected', format: 'currency' },
  ],
  service: [
    { key: 'service', label: 'Service' }, { key: 'leads', label: 'Leads', format: 'number' }, { key: 'hot', label: 'Hot', format: 'number' },
    { key: 'converted', label: 'Converted', format: 'number' }, { key: 'lost', label: 'Lost', format: 'number' }, { key: 'conversionRate', label: 'Conv. rate', format: 'percent' },
    { key: 'pipelineValue', label: 'Pipeline value', format: 'currency' }, { key: 'revenue', label: 'Collected', format: 'currency' },
  ],
  calling: [
    { key: 'outcome', label: 'Outcome', format: 'outcome' }, { key: 'calls', label: 'Calls', format: 'number' }, { key: 'share', label: 'Share', format: 'percent' }, { key: 'talkTime', label: 'Talk time', format: 'duration' },
  ],
  'follow-up': [
    { key: 'employee', label: 'Employee' }, { key: 'scheduled', label: 'Scheduled', format: 'number' }, { key: 'completed', label: 'Completed', format: 'number' },
    { key: 'completionRate', label: 'Completion', format: 'percent' }, { key: 'onTime', label: 'On time', format: 'number' }, { key: 'onTimeRate', label: 'On-time rate', format: 'percent' },
    { key: 'pending', label: 'Pending', format: 'number' }, { key: 'overdue', label: 'Overdue', format: 'number' }, { key: 'cancelled', label: 'Cancelled', format: 'number' },
  ],
  conversion: [
    { key: 'stage', label: 'Current stage', format: 'stage' }, { key: 'leads', label: 'Leads', format: 'number' }, { key: 'share', label: 'Share', format: 'percent' }, { key: 'value', label: 'Deal value', format: 'currency' },
  ],
  revenue: [
    { key: 'service', label: 'Service' }, { key: 'payments', label: 'Payments', format: 'number' }, { key: 'revenue', label: 'Revenue', format: 'currency' }, { key: 'share', label: 'Share', format: 'percent' },
  ],
  employee: [
    { key: 'name', label: 'Employee' }, { key: 'employeeCode', label: 'ID' }, { key: 'calls', label: 'Calls', format: 'number' }, { key: 'connected', label: 'Connected', format: 'number' },
    { key: 'connectRate', label: 'Connect rate', format: 'percent' }, { key: 'talkTime', label: 'Talk time', format: 'duration' }, { key: 'followUps', label: 'Follow-ups', format: 'number' },
    { key: 'interested', label: 'Interested', format: 'number' }, { key: 'leadsAssigned', label: 'Leads assigned', format: 'number' }, { key: 'conversions', label: 'Conversions', format: 'number' },
    { key: 'conversionRate', label: 'Conv. rate', format: 'percent' }, { key: 'revenue', label: 'Revenue', format: 'currency' },
  ],
}

function formatCell(value: string | number | undefined, format: Column['format'] = 'text'): string {
  if (value === undefined || value === null) return '—'
  switch (format) {
    case 'number': return formatNumber(Number(value))
    case 'currency': return formatCurrency(Number(value))
    case 'percent': return formatPercent(Number(value))
    case 'duration': return formatDuration(Number(value))
    case 'stage': return stageMeta[value as LeadStage]?.label ?? humanize(String(value))
    case 'outcome': return outcomeMeta[value as CallOutcome]?.label ?? humanize(String(value))
    default: return String(value)
  }
}

function downloadCsv(filename: string, columns: Column[], rows: Row[]) {
  const escape = (value: string) => {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  const lines = [columns.map((column) => escape(column.label)).join(',')]
  for (const row of rows) {
    lines.push(columns.map((column) => {
      const raw = row[column.key]
      const value = column.format === 'stage' || column.format === 'outcome' ? formatCell(raw, column.format) : raw === undefined ? '' : String(raw)
      return escape(value)
    }).join(','))
  }
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const shortDay = (date: string | number) => {
  const [, month, day] = String(date).split('-')
  return `${day}/${month}`
}

function Totals({ items }: { items: Array<{ label: string; value: ReactNode; tone?: string }> }) {
  return (
    <div className="crm-mini-stats">
      {items.map((item) => <div key={item.label}><span>{item.label}</span><strong className={item.tone}>{item.value}</strong></div>)}
    </div>
  )
}

function ReportVisuals({ type, data }: { type: ReportType; data: ReportData }) {
  const t = data.totals ?? {}
  switch (type) {
    case 'lead-source':
    case 'service': {
      const key = type === 'lead-source' ? 'source' : 'service'
      return (
        <div className="crm-grid crm-grid-2">
          <Card title="Leads"><HorizontalBars data={data.rows.slice(0, 10).map((row) => ({ label: String(row[key]), value: Number(row.leads), meta: `${formatPercent(Number(row.conversionRate))} conv.` }))} /></Card>
          <Card title="Collected revenue"><HorizontalBars data={data.rows.filter((row) => Number(row.revenue) > 0).slice(0, 10).map((row) => ({ label: String(row[key]), value: Number(row.revenue), tone: 'teal' }))} format={formatCurrency} /></Card>
        </div>
      )
    }
    case 'calling':
      return (
        <>
          <Totals items={[
            { label: 'Calls', value: formatNumber(t.calls) }, { label: 'Connected', value: formatNumber(t.connected) },
            { label: 'Connect rate', value: formatPercent(t.connectRate) }, { label: 'Talk time', value: formatDuration(t.talkTime) },
            { label: 'Avg connected call', value: formatDuration(t.avgDuration) }, { label: 'Unique leads', value: formatNumber(t.uniqueLeads) },
          ]} />
          <div className="crm-grid crm-grid-2">
            <Card title="Calls per day (shaded = connected)"><BarChart data={(data.series ?? []).map((row) => ({ label: shortDay(row.date), value: Number(row.calls), secondary: Number(row.connected) }))} tone="violet" /></Card>
            <Card title="Outcomes"><HorizontalBars data={data.rows.map((row) => ({ label: formatCell(row.outcome, 'outcome'), value: Number(row.calls), tone: outcomeMeta[row.outcome as CallOutcome]?.tone }))} /></Card>
          </div>
        </>
      )
    case 'follow-up':
      return (
        <Totals items={[
          { label: 'Scheduled', value: formatNumber(t.scheduled) }, { label: 'Completed', value: formatNumber(t.completed) },
          { label: 'Completion rate', value: formatPercent(t.completionRate) }, { label: 'On time', value: formatNumber(t.onTime) },
          { label: 'Pending', value: formatNumber(t.pending) }, { label: 'Overdue', value: formatNumber(t.overdue), tone: t.overdue ? 'crm-text-red' : undefined },
        ]} />
      )
    case 'conversion':
      return (
        <>
          <Totals items={[
            { label: 'Leads created', value: formatNumber(t.leadsCreated) }, { label: 'Converted (of created)', value: formatNumber(t.converted) },
            { label: 'Conversion rate', value: formatPercent(t.conversionRate) }, { label: 'Lost', value: formatNumber(t.lost) },
            { label: 'Conversions in period', value: formatNumber(t.conversionsInRange) }, { label: 'Avg days to convert', value: formatNumber(t.avgDaysToConvert) },
          ]} />
          <div className="crm-grid crm-grid-2">
            <Card title="Funnel (leads created in period, by current stage)"><HorizontalBars data={data.rows.map((row) => ({ label: formatCell(row.stage, 'stage'), value: Number(row.leads), tone: stageMeta[row.stage as LeadStage]?.tone }))} /></Card>
            <Card title="Conversions per day"><BarChart data={(data.series ?? []).map((row) => ({ label: shortDay(row.date), value: Number(row.conversions) }))} /></Card>
          </div>
        </>
      )
    case 'revenue':
      return (
        <>
          <Totals items={[
            { label: 'Revenue collected', value: formatCurrency(t.revenue), tone: 'crm-text-green' }, { label: 'Payments', value: formatNumber(t.payments) },
            { label: 'Average payment', value: formatCurrency(t.avgPayment) }, { label: 'Pending', value: `${formatCurrency(t.pendingAmount)} (${formatNumber(t.pendingCount)})` },
            { label: 'Overdue', value: formatCurrency(t.overdueAmount), tone: t.overdueAmount ? 'crm-text-red' : undefined }, { label: 'Refunded', value: formatCurrency(t.refunded) },
          ]} />
          <div className="crm-grid crm-grid-2">
            <Card title="Revenue per day"><BarChart data={(data.series ?? []).map((row) => ({ label: shortDay(row.date), value: Number(row.revenue) }))} format={(value) => formatCurrency(value).replace('₹', '₹ ')} tone="teal" /></Card>
            <Card title="By payment method"><HorizontalBars data={(data.methods ?? []).map((row) => ({ label: paymentMethodLabels[String(row.method)] ?? humanize(String(row.method)), value: Number(row.revenue), tone: 'teal' }))} format={formatCurrency} /></Card>
          </div>
        </>
      )
    case 'employee':
      return (
        <div className="crm-grid crm-grid-2">
          <Card title="Calls (shaded = connected)"><BarChart data={data.rows.map((row) => ({ label: String(row.name).split(' ')[0], value: Number(row.calls), secondary: Number(row.connected) }))} tone="violet" /></Card>
          <Card title="Revenue collected"><HorizontalBars data={data.rows.map((row) => ({ label: String(row.name), value: Number(row.revenue), tone: 'teal', meta: `${formatNumber(Number(row.conversions))} conv.` }))} format={formatCurrency} /></Card>
        </div>
      )
  }
}

export function ReportsPage() {
  const { meta } = useSession()
  const { search } = useLocation()
  const requested = search.get('type') as ReportType | null
  const type: ReportType = requested && reportTypes.some((item) => item.id === requested) ? requested : 'lead-source'
  const [range, setRange] = useState<DateRangeValue>(defaultRange)
  const { data, error, loading, reload } = useQuery(`report:${type}:${range.from}:${range.to}`, () => api.get<ReportData>(`/admin/reports/${type}${qs(range)}`))
  const columns = columnsByType[type]

  return (
    <>
      <PageHeader
        title="Reports"
        description={meta.capabilities.viewAllLeads ? 'Company-wide figures for the selected period.' : 'Figures for your own leads and calls.'}
        actions={<DateRange value={range} onChange={setRange} />}
      />
      <Tabs tabs={reportTypes.map((item) => ({ id: item.id, label: item.label }))} active={type} onChange={(next) => setSearchParams({ type: next })} />
      {error && !data ? <ErrorState error={error} onRetry={() => void reload()} /> : !data ? <Skeleton rows={8} /> : (
        <div className={`crm-stack ${loading ? 'crm-refreshing' : ''}`}>
          <ReportVisuals type={type} data={data} />
          <Card
            title="Details"
            padded={false}
            actions={meta.capabilities.exportData && data.rows.length > 0 && (
              <Button size="sm" icon="download" onClick={() => downloadCsv(`dhanvia-${type}-report-${range.from}-to-${range.to}.csv`, columns, data.rows)}>Export CSV</Button>
            )}
          >
            {data.rows.length === 0 ? <EmptyState icon="reports" title="No data for this period" description="Try a wider date range." /> : (
              <div className="crm-table-wrap">
                <table className="crm-table crm-table-numeric">
                  <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
                  <tbody>
                    {data.rows.map((row, index) => (
                      <tr key={index}>{columns.map((column) => <td key={column.key}>{formatCell(row[column.key], column.format)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
