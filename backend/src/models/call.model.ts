import { Schema, model, type InferSchemaType } from 'mongoose'
import { callOutcomes, interestLevels } from '../domain/enums.js'
import { preventDeletion, preventUpdates } from './immutable.js'

const callSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    agent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    phone: { type: String, required: true },
    outcome: { type: String, enum: callOutcomes, required: true },
    connected: { type: Boolean, default: false },
    durationSeconds: { type: Number, min: 0, max: 86_400, default: 0 },
    startedAt: { type: Date, required: true },
    notes: { type: String, trim: true, maxlength: 5000 },
    interest: { type: String, enum: interestLevels },
    nextAction: { type: String, trim: true, maxlength: 300 },
    followUpAt: { type: Date },
    task: { type: Schema.Types.ObjectId, ref: 'Task' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

callSchema.index({ agent: 1, startedAt: -1 })
callSchema.index({ startedAt: -1 })
callSchema.index({ outcome: 1, startedAt: -1 })
preventDeletion(callSchema, 'Call')
preventUpdates(callSchema, 'Call')

export type Call = InferSchemaType<typeof callSchema>
export const CallModel = model('Call', callSchema)
