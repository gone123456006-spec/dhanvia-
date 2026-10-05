import { Schema, model } from 'mongoose'
import { paymentMethods, paymentStatuses } from '../domain/enums.js'
import { preventDeletion } from './immutable.js'

const paymentSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, enum: paymentMethods, default: 'upi' },
    status: { type: String, enum: paymentStatuses, default: 'pending' },
    reference: { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 300 },
    dueAt: { type: Date },
    paidAt: { type: Date },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: String, trim: true, maxlength: 200 },
    collectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

paymentSchema.index({ status: 1, paidAt: -1 })
paymentSchema.index({ status: 1, dueAt: 1 })
preventDeletion(paymentSchema, 'Payment')

export const PaymentModel = model('Payment', paymentSchema)
