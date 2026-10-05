import type { Types } from 'mongoose'
import type { Priority, TaskType } from '../domain/enums.js'
import { TaskModel } from '../models/task.model.js'
import { logActivity, type ActivityOrigin } from './activity.js'

export interface TaskInput {
  lead?: Types.ObjectId
  customer?: Types.ObjectId
  assignedTo?: Types.ObjectId | null
  type: TaskType
  title: string
  description?: string
  dueAt: Date
  priority?: Priority
  createdBy?: Types.ObjectId | null
  automationRule?: string
}

export async function createTask(input: TaskInput, origin: ActivityOrigin = 'user') {
  const { customer, ...data } = input
  const task = await TaskModel.create(data)
  if (input.lead) {
    await logActivity({
      lead: input.lead,
      customer,
      actor: input.createdBy ?? null,
      origin: input.automationRule ? 'automation' : origin,
      action: 'task_created',
      newValue: { title: task.title, type: task.type, dueAt: task.dueAt.toISOString() },
      notes: input.automationRule ? `Created by automation rule: ${input.automationRule}` : undefined,
      entityType: 'task',
      entityId: task._id,
    })
  }
  return task
}

/** Creates the task unless an open task of the same type already exists for the lead. */
export async function ensureOpenTask(input: TaskInput) {
  if (input.lead) {
    const existing = await TaskModel.findOne({ lead: input.lead, type: input.type, status: 'open' })
    if (existing) return existing
  }
  return createTask(input)
}

export async function closeOpenTasks(
  lead: Types.ObjectId,
  filter: { types?: TaskType[]; automatedOnly?: boolean },
  status: 'done' | 'cancelled',
  actor: Types.ObjectId | null,
  note: string,
): Promise<number> {
  const query: Record<string, unknown> = { lead, status: 'open' }
  if (filter.types) query.type = { $in: filter.types }
  if (filter.automatedOnly) query.automationRule = { $exists: true }
  const result = await TaskModel.updateMany(query, {
    $set: { status, completedAt: new Date(), completedBy: actor ?? undefined, outcomeNote: note },
  })
  return result.modifiedCount
}

export async function reassignOpenTasks(lead: Types.ObjectId, from: Types.ObjectId | null, to: Types.ObjectId | null): Promise<void> {
  await TaskModel.updateMany({ lead, status: 'open', assignedTo: from }, { $set: { assignedTo: to } })
}
