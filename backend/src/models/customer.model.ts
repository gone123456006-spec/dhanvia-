import { Schema, model, type InferSchemaType } from 'mongoose'

const customerSchema = new Schema(
  {
    customerId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    callingCode: { type: String, default: '+91', trim: true, maxlength: 6 },
    alternatePhone: { type: String, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    company: { type: String, trim: true, maxlength: 160 },
    city: { type: String, trim: true, maxlength: 80 },
    state: { type: String, trim: true, maxlength: 80 },
    address: { type: String, trim: true, maxlength: 400 },
    pan: { type: String, trim: true, uppercase: true, maxlength: 10 },
    gstin: { type: String, trim: true, uppercase: true, maxlength: 15 },
  },
  { timestamps: true },
)

customerSchema.index({ phone: 1 })
customerSchema.index({ email: 1 })
customerSchema.index({ name: 'text', company: 'text' })

export type Customer = InferSchemaType<typeof customerSchema>
export const CustomerModel = model('Customer', customerSchema)
