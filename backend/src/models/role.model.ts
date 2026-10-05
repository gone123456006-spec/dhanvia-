import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose'
import { permissionKeys } from '../domain/enums.js'

const permissionsShape = Object.fromEntries(permissionKeys.map((key) => [key, { type: Boolean, default: false }]))

/** A named access level (e.g. "Team Lead", "Accounts") whose permissions apply to every member. */
const roleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 300 },
    permissions: { type: new Schema(permissionsShape, { _id: false }), default: () => ({}) },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

roleSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } })

export type Role = InferSchemaType<typeof roleSchema>
export type RoleDocument = HydratedDocument<Role>
export const RoleModel = model('Role', roleSchema)
