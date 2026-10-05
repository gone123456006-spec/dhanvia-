import { useState } from 'react'
import { PageHeader } from '../components/Layout'
import { Card, EmptyState, ErrorState, Pagination, SearchInput, Skeleton } from '../components/ui'
import { api, qs } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/format'
import { useDebounced, useQuery } from '../lib/hooks'
import { Link } from '../components/Link'
import type { Customer, Paged } from '../lib/types'

export function CustomersPage() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const search = useDebounced(query, 350)
  const { data, error, loading, reload } = useQuery(`customers:${search}:${page}`, () => api.get<Paged<Customer>>(`/admin/customers${qs({ search, page, limit: 25 })}`))

  return (
    <>
      <PageHeader title="Customers" description={data ? `${data.total.toLocaleString('en-IN')} customers · one per phone number` : undefined} />
      <Card padded={false}>
        <div className="crm-filters">
          <SearchInput value={query} onChange={(value) => {
            setQuery(value)
            setPage(1)
          }} placeholder="Search name, phone, email or ID" />
        </div>
        {error && !data ? <ErrorState error={error} onRetry={() => void reload()} /> : !data ? <Skeleton rows={8} /> : data.items.length === 0 ? (
          <EmptyState title={search ? 'No customers match your search' : 'No customers yet'} description={search ? undefined : 'A customer is added automatically with their first lead.'} />
        ) : (
          <div className={`crm-table-wrap ${loading ? 'crm-refreshing' : ''}`}>
            <table className="crm-table crm-table-compact">
              <thead><tr><th>Customer</th><th>Phone</th><th>Leads</th><th>Paid</th><th>Since</th></tr></thead>
              <tbody>
                {data.items.map((customer) => {
                  const place = [customer.company, customer.city].filter(Boolean).join(' · ')
                  return (
                    <tr key={customer._id}>
                      <td><strong>{customer.name}</strong><div className="crm-muted crm-small">{customer.customerId}{place ? ` · ${place}` : ''}</div></td>
                      <td><a href={`tel:${customer.phone}`}>{customer.phone}</a></td>
                      <td><Link to={`/admin/leads?q=${encodeURIComponent(customer.phone)}&archived=all`}>{customer.leads ?? 0} lead{customer.leads === 1 ? '' : 's'}</Link></td>
                      <td>{customer.revenue ? formatCurrency(customer.revenue) : <span className="crm-muted">—</span>}</td>
                      <td>{formatDate(customer.createdAt)}</td>
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
