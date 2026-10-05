import { Schema, model } from 'mongoose'
import { notificationTypes } from '../domain/enums.js'

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: notificationTypes, required: true },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, maxlength: 1000 },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
    task: { type: Schema.Types.ObjectId, ref: 'Task' },
    readAt: { type: Date, default: null },
    dedupeKey: { type: String, maxlength: 200 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 })
notificationSchema.index({ user: 1, dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } })

export const NotificationModel = model('Notification', notificationSchema)
