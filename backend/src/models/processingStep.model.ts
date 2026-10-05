import { Schema, model } from 'mongoose'
import { processingStatuses } from '../domain/enums.js'

const processingStepSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    status: { type: String, enum: processingStatuses, default: 'pending' },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    dueAt: { type: Date },
    reference: { type: String, trim: true, maxlength: 120 },
    notes: { type: String, trim: true, maxlength: 2000 },
    completedAt: { type: Date },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

processingStepSchema.index({ status: 1, dueAt: 1 })

export const ProcessingStepModel = model('ProcessingStep', processingStepSchema)
