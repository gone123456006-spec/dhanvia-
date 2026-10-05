import { useEffect, useRef, useState } from 'react'
import { useToast } from '../context/contexts'
import { api, qs } from '../lib/api'
import { formatRelative } from '../lib/format'
import { useQuery } from '../lib/hooks'
import { Link } from './Link'
import { navigate } from '../lib/router'
import type { Notification, Paged } from '../lib/types'
import { Icon } from './Icon'
import { Button, EmptyState, Spinner } from './ui'

export function NotificationItem({ notification, onOpen }: { notification: Notification; onOpen: (notification: Notification) => void }) {
  return (
    <button type="button" className={`crm-notification ${notification.readAt ? '' : 'unread'} type-${notification.type}`} onClick={() => onOpen(notification)}>
      <span className="crm-notification-text">
        <strong>{notification.title}</strong>
        {notification.message && <span>{notification.message}</span>}
        <small>{formatRelative(notification.createdAt)}</small>
      </span>
    </button>
  )
}

export function NotificationCenter() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { data, loading, reload } = useQuery('notifications-panel', () => api.get<Paged<Notification> & { unread: number }>(`/admin/notifications${qs({ limit: 15 })}`), { pollMs: 30_000 })
  const unread = data?.unread ?? 0

  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) Dhanvia CRM` : 'Dhanvia CRM'
  }, [unread])

  async function openNotification(notification: Notification) {
    try {
      if (!notification.readAt) await api.post(`/admin/notifications/${notification._id}/read`)
      setOpen(false)
      if (notification.lead) navigate(`/admin/leads/${notification.lead._id}`)
      void reload({ silent: true })
    } catch (error) {
      toast.error(error)
    }
  }

  async function markAll() {
    try {
      await api.post('/admin/notifications/read-all')
      await reload({ silent: true })
    } catch (error) {
      toast.error(error)
    }
  }

  return (
    <div className="crm-notification-center" ref={panelRef}>
      <button
        type="button"
        className="crm-icon-btn crm-bell"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value)
          if (!open) void reload({ silent: true })
        }}
      >
        <Icon name="bell" />
        {unread > 0 && <span className="crm-bell-count">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="crm-notification-panel" role="dialog" aria-label="Notifications">
          <header>
            <strong>Notifications</strong>
            <Button size="sm" variant="ghost" onClick={markAll} disabled={unread === 0}>Mark all read</Button>
          </header>
          <div className="crm-notification-list">
            {loading && !data ? <Spinner /> : data && data.items.length > 0 ? (
              data.items.map((item) => <NotificationItem key={item._id} notification={item} onOpen={openNotification} />)
            ) : (
              <EmptyState icon="bell" title="You’re all caught up" description="Reminders for calls, follow-ups, documents, and payments appear here." />
            )}
          </div>
          <footer><Link to="/admin/notifications" onClick={() => setOpen(false)}>View all notifications</Link></footer>
        </div>
      )}
    </div>
  )
}
