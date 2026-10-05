import { randomBytes } from 'node:crypto'
import { Schema, model, type InferSchemaType } from 'mongoose'

export const supportRequestStatuses = ['open', 'in-progress', 'resolved', 'closed'] as const

function generateTicketNumber(): string {
  return `DHV-${randomBytes(4).toString('hex').toUpperCase()}`
}

const supportRequestSchema = new Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, default: generateTicketNumber },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    message: { type: String, required: true, trim: true, minlength: 30, maxlength: 2000 },
    salesConsultation: { type: Boolean, default: false },
    status: { type: String, enum: supportRequestStatuses, default: 'open', index: true },
    notes: { type: String, trim: true, maxlength: 2000 },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
    handledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

supportRequestSchema.index({ createdAt: -1 })
supportRequestSchema.index({ email: 1 })

export type SupportRequest = InferSchemaType<typeof supportRequestSchema>
export const SupportRequestModel = model('SupportRequest', supportRequestSchema)
