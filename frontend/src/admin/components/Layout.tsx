import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { useSession } from '../context/contexts'
import { api, qs } from '../lib/api'
import { WEBSITE_SOURCE } from '../lib/constants'
import { useDebounced, useQuery } from '../lib/hooks'
import { Link } from './Link'
import { navigate, useLocation } from '../lib/router'
import type { Lead, Paged } from '../lib/types'
import { StageBadge } from './badges'
import { Icon, type IconName } from './Icon'
import { NotificationCenter } from './NotificationCenter'
import { Avatar, IconButton } from './ui'

interface NavItem {
  to: string
  label: string
  icon: IconName
  visible?: boolean
  badge?: number
}

function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Lead[]>([])
  const [open, setOpen] = useState(false)
  const debounced = useDebounced(query.trim(), 250)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounced.length < 2) return
    let cancelled = false
    api.get<Paged<Lead>>(`/admin/leads${qs({ q: debounced, limit: 8, archived: 'all' })}`)
      .then((data) => !cancelled && setResults(data.items))
      .catch(() => !cancelled && setResults([]))
    return () => {
      cancelled = true
    }
  }, [debounced])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false)
    }
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        boxRef.current?.querySelector('input')?.focus()
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', shortcut)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', shortcut)
    }
  }, [])

  const visibleResults = debounced.length >= 2 ? results : []

  return (
    <div className="crm-global-search" ref={boxRef}>
      <Icon name="search" size={16} />
      <input
        type="search"
        placeholder="Search leads by name, phone, email, or Lead ID  (⌘K)"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && query.trim()) {
            setOpen(false)
            navigate(`/admin/leads?q=${encodeURIComponent(query.trim())}`)
          }
        }}
        aria-label="Search leads"
      />
      {open && debounced.length >= 2 && (
        <div className="crm-search-results" role="listbox">
          {visibleResults.length === 0 ? <p className="crm-muted">No leads match “{debounced}”</p> : visibleResults.map((lead) => (
            <Link key={lead._id} to={`/admin/leads/${lead._id}`} className="crm-search-result" onClick={() => { setOpen(false); setQuery('') }}>
              <span>
                <strong>{lead.name}</strong>
                <small>{lead.leadId} · {lead.phone} · {lead.service}</small>
              </span>
              <StageBadge stage={lead.stage} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

/** Copies each table's column headings onto its cells so phones can render rows as labelled cards. */
function useTableCardLabels(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = root.current
    if (!container) return
    let frame = 0
    const label = () => {
      frame = 0
      for (const table of container.querySelectorAll<HTMLTableElement>('table.crm-table')) {
        const headings = Array.from(table.querySelectorAll('thead th'), (th) => th.textContent?.trim() ?? '')
        for (const row of table.querySelectorAll<HTMLTableRowElement>('tbody tr')) {
          Array.from(row.cells).forEach((cell, index) => {
            const heading = headings[index] ?? ''
            if (cell.dataset.label !== heading) cell.dataset.label = heading
          })
        }
      }
    }
    const observer = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(label)
    })
    observer.observe(container, { childList: true, subtree: true })
    label()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [root])
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, meta, logout } = useSession()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const contentRef = useRef<HTMLElement>(null)
  const caps = meta.capabilities
  useTableCardLabels(contentRef)
  const { data: newEnquiries } = useQuery(
    `nav:new-enquiries:${pathname}`,
    () => api.get<Paged<Lead>>(`/admin/leads${qs({ source: WEBSITE_SOURCE, stage: 'new', archived: 'false', limit: 1 })}`),
    { pollMs: 30_000 },
  )

  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  const nav: Array<{ section: string; items: NavItem[] }> = [
    {
      section: 'Sales',
      items: [
        { to: '/admin', label: 'Dashboard', icon: 'dashboard' },
        { to: '/admin/calls', label: 'Calling Workspace', icon: 'phone' },
        { to: '/admin/enquiries', label: 'Website Enquiries', icon: 'inbox', badge: newEnquiries?.total },
        { to: '/admin/leads', label: 'Leads', icon: 'leads' },
        { to: '/admin/pipeline', label: 'Pipeline', icon: 'pipeline' },
        { to: '/admin/tasks', label: 'Tasks & Follow-ups', icon: 'tasks' },
        { to: '/admin/customers', label: 'Customers', icon: 'customers', visible: caps.viewCustomers },
      ],
    },
    {
      section: 'Management',
      items: [
        { to: '/admin/team', label: 'Team', icon: 'team', visible: caps.viewTeam },
        { to: '/admin/roles', label: 'Roles & Access', icon: 'shield', visible: caps.isSuperAdmin },
        { to: '/admin/activity', label: 'Activity Log', icon: 'activity', visible: caps.viewActivityLog },
        { to: '/admin/reports', label: 'Reports', icon: 'reports', visible: caps.viewReports },
        { to: '/admin/support', label: 'Support Inbox', icon: 'support', visible: caps.viewSupport },
        { to: '/admin/social', label: 'Social Media', icon: 'share' },
        { to: '/admin/settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ]

  const isActive = (to: string) => (to === '/admin' ? pathname === '/admin' : pathname.startsWith(to))
  const tabs: NavItem[] = [
    { to: '/admin', label: 'Home', icon: 'dashboard' },
    { to: '/admin/leads', label: 'Leads', icon: 'leads' },
    { to: '/admin/calls', label: 'Calls', icon: 'phone' },
    { to: '/admin/tasks', label: 'Tasks', icon: 'tasks' },
  ]
  const moreActive = !mobileOpen && !tabs.some((tab) => isActive(tab.to))
  const enquiryCount = newEnquiries?.total ?? 0

  return (
    <div className={`crm-shell ${mobileOpen ? 'nav-open' : ''}`}>
      <aside className="crm-sidebar">
        <div className="crm-brand">
          <span>
            <strong className="crm-wordmark">Dhanvia</strong>
            <small>Sales CRM</small>
          </span>
        </div>
        <nav aria-label="Main">
          {nav.map((group) => (
            <div className="crm-nav-group" key={group.section}>
              <span className="crm-nav-heading">{group.section}</span>
              {group.items.filter((item) => item.visible !== false).map((item) => (
                <Link key={item.to} to={item.to} className={`crm-nav-link ${isActive(item.to) ? 'active' : ''}`} onClick={() => setMobileOpen(false)} aria-current={isActive(item.to) ? 'page' : undefined}>
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  {!!item.badge && <span className="crm-nav-badge" aria-label={`${item.badge} new`}>{item.badge > 99 ? '99+' : item.badge}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="crm-sidebar-user">
          <Avatar name={user.name} size={34} />
          <span>
            <strong>{user.name}</strong>
            <small>{user.role === 'super_admin' ? 'Super Admin' : caps.roleName ?? 'Sales'} · {user.employeeCode}</small>
          </span>
          <IconButton icon="logout" label="Sign out" onClick={() => void logout()} />
        </div>
      </aside>
      <div className="crm-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      <div className="crm-main">
        <header className="crm-topbar">
          <IconButton icon="menu" label="Open navigation" className="crm-mobile-only" onClick={() => setMobileOpen(true)} />
          <Link to="/admin" className="crm-wordmark crm-topbar-mark" aria-label="Dhanvia CRM home">Dhanvia</Link>
          <GlobalSearch />
          <div className="crm-topbar-actions">
            <NotificationCenter />
          </div>
        </header>
        <main className="crm-content" ref={contentRef}>{children}</main>
      </div>
      <nav className="crm-tabbar" aria-label="Quick navigation">
        {tabs.map((tab) => (
          <Link key={tab.to} to={tab.to} className={`crm-tabbar-item ${isActive(tab.to) && !mobileOpen ? 'active' : ''}`} aria-current={isActive(tab.to) ? 'page' : undefined} onClick={() => setMobileOpen(false)}>
            <Icon name={tab.icon} size={22} />
            <span>{tab.label}</span>
          </Link>
        ))}
        <button type="button" className={`crm-tabbar-item ${mobileOpen || moreActive ? 'active' : ''}`} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>
          <span className="crm-tabbar-icon">
            <Icon name="menu" size={22} />
            {enquiryCount > 0 && <span className="crm-tabbar-badge" aria-label={`${enquiryCount} new website enquiries`}>{enquiryCount > 99 ? '99+' : enquiryCount}</span>}
          </span>
          <span>More</span>
        </button>
      </nav>
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="crm-page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="crm-page-actions">{actions}</div>}
    </div>
  )
}
