import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose'
import { permissionKeys, roles } from '../domain/enums.js'

// No default: an unset key falls back to resolvePermissions' legacy defaults instead of being saved as false.
const permissionsShape = Object.fromEntries(permissionKeys.map((key) => [key, { type: Boolean }]))

const userSchema = new Schema(
  {
    employeeCode: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 20 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: roles, required: true, default: 'sales' },
    permissions: { type: new Schema(permissionsShape, { _id: false }), default: () => ({}) },
    customRole: { type: Schema.Types.ObjectId, ref: 'Role', default: null, index: true },
    active: { type: Boolean, default: true, index: true },
    acceptsLeads: { type: Boolean, default: true },
    dailyCallTarget: { type: Number, default: 40, min: 0, max: 1000 },
    lastAssignedAt: { type: Date, default: null },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true },
)

export type User = InferSchemaType<typeof userSchema>
export type UserDocument = HydratedDocument<User>
export const UserModel = model('User', userSchema)
