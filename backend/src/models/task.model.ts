import { Schema, model, type InferSchemaType } from 'mongoose'
import { priorities, taskStatuses, taskTypes } from '../domain/enums.js'

const taskSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    type: { type: String, enum: taskTypes, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    dueAt: { type: Date, required: true },
    priority: { type: String, enum: priorities, default: 'medium' },
    status: { type: String, enum: taskStatuses, default: 'open' },
    completedAt: { type: Date },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    outcomeNote: { type: String, trim: true, maxlength: 1000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    automationRule: { type: String, maxlength: 80 },
    reminderSentAt: { type: Date },
    overdueNotifiedAt: { type: Date },
  },
  { timestamps: true },
)

taskSchema.index({ assignedTo: 1, status: 1, dueAt: 1 })
taskSchema.index({ status: 1, dueAt: 1 })
taskSchema.index({ lead: 1, status: 1, type: 1 })

export type Task = InferSchemaType<typeof taskSchema>
export const TaskModel = model('Task', taskSchema)
