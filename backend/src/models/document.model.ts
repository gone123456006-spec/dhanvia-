import { Schema, model } from 'mongoose'
import { documentStatuses } from '../domain/enums.js'

const leadDocumentSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    required: { type: Boolean, default: true },
    status: { type: String, enum: documentStatuses, default: 'required' },
    notes: { type: String, trim: true, maxlength: 1000 },
    file: {
      type: new Schema(
        {
          fileId: { type: Schema.Types.ObjectId, required: true },
          filename: { type: String, required: true },
          contentType: { type: String, required: true },
          size: { type: Number, required: true },
          uploadedAt: { type: Date, required: true },
          uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        },
        { _id: false },
      ),
      default: null,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

leadDocumentSchema.index({ lead: 1, status: 1 })

export const LeadDocumentModel = model('LeadDocument', leadDocumentSchema)
