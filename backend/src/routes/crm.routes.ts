import { Router } from 'express'
import multer from 'multer'
import { activityLog } from '../controllers/activityLog.controller.js'
import { callHistory, callQueue } from '../controllers/calls.controller.js'
import { dashboard } from '../controllers/dashboard.controller.js'
import {
  addConversation,
  addDocument,
  addPayment,
  addProcessingStep,
  downloadDocumentFile,
  listConversations,
  listDocuments,
  listLeadCalls,
  listPayments,
  listProcessing,
  logLeadCall,
  updateCustomer,
  updateDocument,
  updatePayment,
  updateProcessingStep,
  uploadDocumentFile,
} from '../controllers/leadWorkspace.controller.js'
import {
  addLeadNote,
  assignLeadHandler,
  bulkUpdateLeads,
  changeLeadStage,
  changeLeadStatus,
  createLeadHandler,
  exportLeads,
  getLead,
  leadActivity,
  listCustomers,
  listLeads,
  pipeline,
  updateLead,
} from '../controllers/leads.controller.js'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notifications.controller.js'
import { report, teamPerformance } from '../controllers/reports.controller.js'
import { createRole, deleteRole, listRoles, updateRole } from '../controllers/roles.controller.js'
import { getSettingsHandler, getSocialAccounts, meta, updateSettings, updateSocialAccounts } from '../controllers/settings.controller.js'
import { listSupportRequests, updateSupportRequest } from '../controllers/support.controller.js'
import { createTaskHandler, listTasks, updateTask } from '../controllers/tasks.controller.js'
import { createUser, listUsers, resetUserPassword, updateUser } from '../controllers/users.controller.js'
import { requireAuth, requirePermission, requireSuperAdmin } from '../middleware/auth.js'
import { requireCsrfHeader } from '../middleware/csrf.js'
import { adminApiLimiter } from '../middleware/rateLimits.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } })

export const crmRouter = Router()

crmRouter.use(adminApiLimiter, requireCsrfHeader, requireAuth)

crmRouter.get('/meta', meta)
crmRouter.get('/dashboard', dashboard)

crmRouter.get('/leads', listLeads)
crmRouter.post('/leads', createLeadHandler)
crmRouter.get('/leads/export', requirePermission('exportData'), exportLeads)
crmRouter.get('/leads/pipeline', pipeline)
crmRouter.post('/leads/bulk', bulkUpdateLeads)
crmRouter.get('/leads/:id', getLead)
crmRouter.patch('/leads/:id', updateLead)
crmRouter.post('/leads/:id/stage', changeLeadStage)
crmRouter.post('/leads/:id/status', changeLeadStatus)
crmRouter.post('/leads/:id/assign', requirePermission('assignLeads'), assignLeadHandler)
crmRouter.post('/leads/:id/notes', addLeadNote)
crmRouter.get('/leads/:id/activity', leadActivity)
crmRouter.patch('/leads/:id/customer', updateCustomer)
crmRouter.get('/leads/:id/calls', listLeadCalls)
crmRouter.post('/leads/:id/calls', logLeadCall)
crmRouter.get('/leads/:id/conversations', listConversations)
crmRouter.post('/leads/:id/conversations', addConversation)
crmRouter.get('/leads/:id/documents', listDocuments)
crmRouter.post('/leads/:id/documents', addDocument)
crmRouter.get('/leads/:id/payments', listPayments)
crmRouter.post('/leads/:id/payments', requirePermission('managePayments'), addPayment)
crmRouter.get('/leads/:id/processing', listProcessing)
crmRouter.post('/leads/:id/processing', addProcessingStep)

crmRouter.patch('/documents/:documentId', updateDocument)
crmRouter.post('/documents/:documentId/file', upload.single('file'), uploadDocumentFile)
crmRouter.get('/documents/:documentId/file', downloadDocumentFile)
crmRouter.patch('/payments/:paymentId', requirePermission('managePayments'), updatePayment)
crmRouter.patch('/processing/:stepId', updateProcessingStep)

crmRouter.get('/customers', requirePermission('viewCustomers'), listCustomers)

crmRouter.get('/calls/queue', callQueue)
crmRouter.get('/calls', callHistory)

crmRouter.get('/tasks', listTasks)
crmRouter.post('/tasks', createTaskHandler)
crmRouter.patch('/tasks/:id', updateTask)

crmRouter.get('/notifications', listNotifications)
crmRouter.post('/notifications/read-all', markAllNotificationsRead)
crmRouter.post('/notifications/:id/read', markNotificationRead)

crmRouter.get('/reports/:type', requirePermission('viewReports'), report)
crmRouter.get('/team/performance', requirePermission('viewTeam'), teamPerformance)

crmRouter.get('/users', listUsers)
crmRouter.post('/users', requireSuperAdmin, createUser)
crmRouter.patch('/users/:id', requireSuperAdmin, updateUser)
crmRouter.post('/users/:id/reset-password', requireSuperAdmin, resetUserPassword)

crmRouter.get('/roles', requireSuperAdmin, listRoles)
crmRouter.post('/roles', requireSuperAdmin, createRole)
crmRouter.put('/roles/:id', requireSuperAdmin, updateRole)
crmRouter.delete('/roles/:id', requireSuperAdmin, deleteRole)

crmRouter.get('/activity', requirePermission('viewActivityLog'), activityLog)

crmRouter.get('/social', getSocialAccounts)
crmRouter.put('/social', requireSuperAdmin, updateSocialAccounts)

crmRouter.get('/settings', requireSuperAdmin, getSettingsHandler)
crmRouter.put('/settings', requireSuperAdmin, updateSettings)

crmRouter.get('/support-requests', requirePermission('viewSupport'), listSupportRequests)
crmRouter.patch('/support-requests/:id', requirePermission('viewSupport'), updateSupportRequest)
