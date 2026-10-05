import type { Request, Response } from 'express'
import { currentUser } from '../middleware/auth.js'
import { HttpError } from '../middleware/errorHandler.js'
import { RoleModel } from '../models/role.model.js'
import { UserModel } from '../models/user.model.js'
import { toObjectId } from '../services/access.js'
import { logActivity } from '../services/activity.js'
import { roleSchema } from '../validation/schemas.js'

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000
}

const duplicateName = () => new HttpError(409, 'A role with this name already exists', { fields: { name: 'Choose a different name' } })

export async function listRoles(_request: Request, response: Response): Promise<void> {
  const [roles, counts] = await Promise.all([
    RoleModel.find().sort({ name: 1 }).lean(),
    UserModel.aggregate<{ _id: unknown; members: number; active: number }>([
      { $match: { customRole: { $ne: null }, role: { $ne: 'super_admin' } } },
      { $group: { _id: '$customRole', members: { $sum: 1 }, active: { $sum: { $cond: ['$active', 1, 0] } } } },
    ]),
  ])
  const byRole = new Map(counts.map((row) => [String(row._id), row]))
  response.json({
    items: roles.map((role) => ({ ...role, id: String(role._id), members: byRole.get(String(role._id))?.members ?? 0, activeMembers: byRole.get(String(role._id))?.active ?? 0 })),
  })
}

export async function createRole(request: Request, response: Response): Promise<void> {
  const actor = currentUser(request)
  const input = roleSchema.parse(request.body)
  try {
    const role = await RoleModel.create({ ...input, createdBy: actor._id })
    await logActivity({ actor: actor._id, action: 'role_created', entityType: 'role', entityId: role._id, newValue: { name: role.name, permissions: input.permissions } })
    response.status(201).json({ role: { ...role.toObject(), id: String(role._id), members: 0, activeMembers: 0 } })
  } catch (error) {
    if (isDuplicateKey(error)) throw duplicateName()
    throw error
  }
}

export async function updateRole(request: Request, response: Response): Promise<void> {
  const actor = currentUser(request)
  const input = roleSchema.parse(request.body)
  const role = await RoleModel.findById(toObjectId(request.params.id, 'role id'))
  if (!role) throw new HttpError(404, 'Role not found')

  const before = { name: role.name, description: role.description, permissions: { ...role.toObject().permissions } }
  role.name = input.name
  role.description = input.description
  role.set('permissions', input.permissions)
  try {
    await role.save()
  } catch (error) {
    if (isDuplicateKey(error)) throw duplicateName()
    throw error
  }
  await logActivity({
    actor: actor._id, action: 'role_updated', entityType: 'role', entityId: role._id,
    previousValue: before, newValue: { name: role.name, description: role.description, permissions: input.permissions },
  })
  response.json({ role: { ...role.toObject(), id: String(role._id) } })
}

export async function deleteRole(request: Request, response: Response): Promise<void> {
  const actor = currentUser(request)
  const id = toObjectId(request.params.id, 'role id')
  const role = await RoleModel.findById(id)
  if (!role) throw new HttpError(404, 'Role not found')
  const members = await UserModel.countDocuments({ customRole: id })
  if (members > 0) throw new HttpError(400, `Move the ${members} member${members > 1 ? 's' : ''} of “${role.name}” to another role first`)
  await role.deleteOne()
  await logActivity({ actor: actor._id, action: 'role_deleted', entityType: 'role', entityId: id, previousValue: { name: role.name } })
  response.status(204).end()
}
