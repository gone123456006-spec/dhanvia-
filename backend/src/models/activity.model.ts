import { Schema, model, type InferSchemaType } from 'mongoose'
import { preventDeletion, preventUpdates } from './immutable.js'

const activitySchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    origin: { type: String, enum: ['user', 'automation', 'system', 'website'], default: 'user' },
    action: { type: String, required: true, maxlength: 80 },
    field: { type: String, maxlength: 80 },
    previousValue: { type: Schema.Types.Mixed, default: null },
    newValue: { type: Schema.Types.Mixed, default: null },
    notes: { type: String, maxlength: 5000 },
    entityType: { type: String, maxlength: 40 },
    entityId: { type: Schema.Types.ObjectId },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

activitySchema.index({ lead: 1, createdAt: -1 })
activitySchema.index({ actor: 1, createdAt: -1 })
activitySchema.index({ createdAt: -1 })
preventDeletion(activitySchema, 'Activity')
preventUpdates(activitySchema, 'Activity')

export type Activity = InferSchemaType<typeof activitySchema>
export const ActivityModel = model('Activity', activitySchema)
