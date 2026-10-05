import type { Request, Response } from 'express'
import { currentUser, hasPermission } from '../middleware/auth.js'
import { HttpError } from '../middleware/errorHandler.js'
import { TaskModel } from '../models/task.model.js'
import { UserModel } from '../models/user.model.js'
import { canViewAllLeads, loadAccessibleLead, toObjectId } from '../services/access.js'
import { logActivity } from '../services/activity.js'
import { refreshNextAction } from '../services/leadLifecycle.js'
import { createTask } from '../services/tasks.js'
import { addDays, endOfDay, startOfDay } from '../utils/time.js'
import { createTaskSchema, taskListQuerySchema, updateTaskSchema } from '../validation/schemas.js'
import { paged } from './helpers.js'

export async function listTasks(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const query = taskListQuerySchema.parse(request.query)
  const filter: Record<string, unknown> = {}
  const canSeeTeam = canViewAllLeads(user) || hasPermission(user, 'viewTeam')

  if (query.lead) filter.lead = (await loadAccessibleLead(user, query.lead))._id
  else if (query.scope === 'mine' || !canSeeTeam) filter.assignedTo = user._id
  else if (query.assignedTo) filter.assignedTo = toObjectId(query.assignedTo)
  if (query.type) filter.type = query.type
  filter.status = query.status ?? 'open'

  const now = new Date()
  if (query.due === 'today') filter.dueAt = { $gte: startOfDay(), $lte: endOfDay() }
  else if (query.due === 'overdue') filter.dueAt = { $lt: now }
  else if (query.due === 'upcoming') filter.dueAt = { $gt: endOfDay() }
  else if (query.due === 'week') filter.dueAt = { $lte: endOfDay(addDays(now, 7)) }

  const sort: Record<string, 1 | -1> = filter.status === 'open' ? { dueAt: 1 } : { completedAt: -1 }
  const [items, total] = await Promise.all([
    TaskModel.find(filter).sort(sort).skip((query.page - 1) * query.limit).limit(query.limit)
      .populate('lead', 'leadId name phone service stage priority').populate('assignedTo', 'name').populate('completedBy', 'name').lean(),
    TaskModel.countDocuments(filter),
  ])
  response.json(paged(items, total, query.page, query.limit))
}

export async function createTaskHandler(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const input = createTaskSchema.parse(request.body)
  const lead = input.lead ? await loadAccessibleLead(user, input.lead) : null
  let assignedTo = input.assignedTo ? toObjectId(input.assignedTo) : (lead?.assignedTo ?? user._id)
  if (!assignedTo.equals(user._id) && !hasPermission(user, 'assignLeads')) {
    if (!(lead?.assignedTo && assignedTo.equals(lead.assignedTo))) throw new HttpError(403, 'You can only create tasks for yourself or the lead owner')
  }
  if (!(await UserModel.exists({ _id: assignedTo, active: true }))) assignedTo = user._id

  const task = await createTask({
    lead: lead?._id, customer: lead?.customer, assignedTo, type: input.type, title: input.title,
    description: input.description, dueAt: input.dueAt, priority: input.priority, createdBy: user._id,
  })
  if (lead) await refreshNextAction(lead._id)
  response.status(201).json({ task })
}

export async function updateTask(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const task = await TaskModel.findById(toObjectId(request.params.id, 'task id'))
  if (!task) throw new HttpError(404, 'Task not found')
  const lead = task.lead ? await loadAccessibleLead(user, String(task.lead)) : null
  if (!lead && !task.assignedTo?.equals(user._id) && !hasPermission(user, 'viewTeam')) throw new HttpError(404, 'Task not found')

  const input = updateTaskSchema.parse(request.body)
  if (input.assignedTo && !hasPermission(user, 'assignLeads') && input.assignedTo !== user.id) {
    throw new HttpError(403, 'You do not have permission to reassign tasks')
  }
  const previous = { status: task.status, dueAt: task.dueAt, assignedTo: task.assignedTo, priority: task.priority, title: task.title }

  if (input.status && input.status !== task.status) {
    task.status = input.status
    if (input.status === 'open') {
      task.completedAt = undefined
      task.completedBy = undefined
    } else {
      task.completedAt = new Date()
      task.completedBy = user._id
    }
  }
  if (input.dueAt) {
    task.dueAt = input.dueAt
    task.reminderSentAt = undefined
    task.overdueNotifiedAt = undefined
  }
  if (input.assignedTo) task.assignedTo = toObjectId(input.assignedTo)
  if (input.priority) task.priority = input.priority
  if (input.title) task.title = input.title
  if (input.outcomeNote) task.outcomeNote = input.outcomeNote
  await task.save()

  const action = input.status === 'done' ? 'task_completed' : input.status === 'cancelled' ? 'task_cancelled' : input.status === 'open' ? 'task_reopened' : 'task_updated'
  await logActivity({
    lead: lead?._id, customer: lead?.customer, actor: user._id, action,
    previousValue: previous,
    newValue: { status: task.status, dueAt: task.dueAt, assignedTo: task.assignedTo, priority: task.priority, title: task.title },
    notes: input.outcomeNote ?? task.title, entityType: 'task', entityId: task._id,
  })
  if (lead) await refreshNextAction(lead._id)
  response.json({ task: await TaskModel.findById(task._id).populate('lead', 'leadId name phone service stage priority').populate('assignedTo', 'name').lean() })
}
