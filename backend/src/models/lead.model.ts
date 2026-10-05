import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose'
import { interestLevels, leadStages, leadStatuses, priorities } from '../domain/enums.js'

const leadSchema = new Schema(
  {
    leadId: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    service: { type: String, required: true, trim: true, maxlength: 200 },
    source: { type: String, required: true, trim: true, maxlength: 80 },
    sourceDetail: { type: String, trim: true, maxlength: 300 },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt: { type: Date },
    priority: { type: String, enum: priorities, default: 'medium' },
    interest: { type: String, enum: interestLevels, default: 'unknown' },
    score: { type: Number, default: 0, min: 0, max: 100 },
    stage: { type: String, enum: leadStages, default: 'new' },
    status: { type: String, enum: leadStatuses, default: 'new' },
    stageChangedAt: { type: Date, default: Date.now },
    dealValue: { type: Number, min: 0, default: 0 },
    amountPaid: { type: Number, min: 0, default: 0 },
    lastInteractionAt: { type: Date },
    lastInteractionSummary: { type: String, trim: true, maxlength: 300 },
    nextAction: { type: String, trim: true, maxlength: 300 },
    nextActionDueAt: { type: Date },
    followUpAt: { type: Date },
    callAttempts: { type: Number, default: 0 },
    connectedCalls: { type: Number, default: 0 },
    notes: { type: String, trim: true, maxlength: 5000 },
    lostReason: { type: String, trim: true, maxlength: 300 },
    convertedAt: { type: Date },
    completedAt: { type: Date },
    archived: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
)

leadSchema.index({ assignedTo: 1, stage: 1 })
leadSchema.index({ stage: 1, updatedAt: -1 })
leadSchema.index({ status: 1 })
leadSchema.index({ createdAt: -1 })
leadSchema.index({ followUpAt: 1 })
leadSchema.index({ nextActionDueAt: 1 })
leadSchema.index({ phone: 1 })
leadSchema.index({ email: 1 })
leadSchema.index({ source: 1 })
leadSchema.index({ service: 1 })
leadSchema.index({ convertedAt: -1 })
leadSchema.index({ interest: 1, stage: 1 })

export type Lead = InferSchemaType<typeof leadSchema>
export type LeadDocument = HydratedDocument<Lead>
export const LeadModel = model('Lead', leadSchema, 'crm_leads')
