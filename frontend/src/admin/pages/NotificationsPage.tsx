import { useState } from 'react'
import { PageHeader } from '../components/Layout'
import { NotificationItem } from '../components/NotificationCenter'
import { Button, Card, EmptyState, ErrorState, Pagination, Skeleton } from '../components/ui'
import { useToast } from '../context/contexts'
import { api, qs } from '../lib/api'
import { useQuery } from '../lib/hooks'
import { navigate } from '../lib/router'
import type { Notification, Paged } from '../lib/types'

export function NotificationsPage() {
  const toast = useToast()
  const [status, setStatus] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)
  const [marking, setMarking] = useState(false)
  const { data, error, reload } = useQuery(`notifications:${status}:${page}`, () => api.get<Paged<Notification> & { unread: number }>(`/admin/notifications${qs({ status: status === 'unread' ? 'unread' : undefined, page, limit: 30 })}`), { pollMs: 30_000 })

  async function open(notification: Notification) {
    try {
      if (!notification.readAt) await api.post(`/admin/notifications/${notification._id}/read`)
      if (notification.lead) navigate(`/admin/leads/${notification.lead._id}`)
      else void reload({ silent: true })
    } catch (caught) {
      toast.error(caught)
    }
  }

  async function markAll() {
    setMarking(true)
    try {
      const result = await api.post<{ updated: number }>('/admin/notifications/read-all')
      toast.success(`${result.updated} notification${result.updated === 1 ? '' : 's'} marked read`)
      await reload({ silent: true })
    } catch (caught) {
      toast.error(caught)
    } finally {
      setMarking(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Assignments, due and overdue reminders, missing documents, pending payments and processing alerts."
        actions={<Button icon="check" onClick={() => void markAll()} loading={marking} disabled={!data?.unread}>Mark all read</Button>}
      />
      <Card padded={false}>
        <div className="crm-filters">
          <div className="crm-segmented">
            <button type="button" className={status === 'all' ? 'active' : ''} onClick={() => { setStatus('all'); setPage(1) }}>All</button>
            <button type="button" className={status === 'unread' ? 'active' : ''} onClick={() => { setStatus('unread'); setPage(1) }}>Unread{data?.unread ? ` (${data.unread})` : ''}</button>
          </div>
        </div>
        {error && !data ? <ErrorState error={error} onRetry={() => void reload()} /> : !data ? <Skeleton rows={8} /> : data.items.length === 0 ? (
          <EmptyState icon="bell" title={status === 'unread' ? 'No unread notifications' : 'No notifications yet'} description="Reminders appear here and in the bell menu automatically." />
        ) : (
          <div className="crm-notification-list crm-notification-page">
            {data.items.map((item) => <NotificationItem key={item._id} notification={item} onOpen={(notification) => void open(notification)} />)}
          </div>
        )}
        {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPage={setPage} />}
      </Card>
    </>
  )
}
