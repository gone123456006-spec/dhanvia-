import type { ReactNode } from 'react'
import { Layout } from './components/Layout'
import { Button, EmptyState, Spinner } from './components/ui'
import { AuthProvider, ConfirmProvider, ToastProvider } from './context/Providers'
import { useAuth } from './context/contexts'
import { matchPath, navigate, useLocation } from './lib/router'
import type { Meta } from './lib/types'
import { ActivityLogPage } from './pages/ActivityLogPage'
import { CallingPage } from './pages/CallingPage'
import { CustomersPage } from './pages/CustomersPage'
import { DashboardPage } from './pages/DashboardPage'
import { EnquiriesPage } from './pages/EnquiriesPage'
import { LeadProfilePage } from './pages/LeadProfilePage'
import { LeadsPage } from './pages/LeadsPage'
import { LoginPage } from './pages/LoginPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { PipelinePage } from './pages/PipelinePage'
import { ReportsPage } from './pages/ReportsPage'
import { RolesPage } from './pages/RolesPage'
import { SettingsPage } from './pages/SettingsPage'
import { SocialMediaPage } from './pages/SocialMediaPage'
import { SupportPage } from './pages/SupportPage'
import { TasksPage } from './pages/TasksPage'
import { TeamPage } from './pages/TeamPage'

type Capability = keyof Meta['capabilities']

const routes: Array<{ path: string; render: (params: Record<string, string>) => ReactNode; requires?: Capability }> = [
  { path: '/admin', render: () => <DashboardPage /> },
  { path: '/admin/enquiries', render: () => <EnquiriesPage /> },
  { path: '/admin/leads', render: () => <LeadsPage /> },
  { path: '/admin/leads/:id', render: ({ id }) => <LeadProfilePage key={id} id={id} /> },
  { path: '/admin/pipeline', render: () => <PipelinePage /> },
  { path: '/admin/calls', render: () => <CallingPage /> },
  { path: '/admin/tasks', render: () => <TasksPage /> },
  { path: '/admin/customers', render: () => <CustomersPage />, requires: 'viewCustomers' },
  { path: '/admin/team', render: () => <TeamPage />, requires: 'viewTeam' },
  { path: '/admin/roles', render: () => <RolesPage />, requires: 'isSuperAdmin' },
  { path: '/admin/activity', render: () => <ActivityLogPage />, requires: 'viewActivityLog' },
  { path: '/admin/reports', render: () => <ReportsPage />, requires: 'viewReports' },
  { path: '/admin/notifications', render: () => <NotificationsPage /> },
  { path: '/admin/support', render: () => <SupportPage />, requires: 'viewSupport' },
  { path: '/admin/social', render: () => <SocialMediaPage /> },
  { path: '/admin/settings', render: () => <SettingsPage /> },
]

function Routes() {
  const { status, meta } = useAuth()
  const { pathname } = useLocation()

  if (status === 'loading') return <div className="crm-boot"><Spinner label="Loading Dhanvia CRM" /></div>
  if (status === 'anonymous' || !meta) return <LoginPage />

  let content: ReactNode = null
  for (const route of routes) {
    const params = matchPath(route.path, pathname)
    if (!params) continue
    content = route.requires && !meta.capabilities[route.requires]
      ? <EmptyState icon="alert" title="You don’t have access to this page" description="Ask a Super Admin to grant the required permission." action={<Button onClick={() => navigate('/admin')}>Go to dashboard</Button>} />
      : route.render(params)
    break
  }

  return (
    <Layout>
      {content ?? <EmptyState icon="search" title="Page not found" description="The page you’re looking for doesn’t exist." action={<Button onClick={() => navigate('/admin')}>Go to dashboard</Button>} />}
    </Layout>
  )
}

export function AdminApp() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <Routes />
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}
