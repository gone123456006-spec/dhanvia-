import type { Request, Response } from 'express'
import { currentUser, hasPermission } from '../middleware/auth.js'
import { HttpError } from '../middleware/errorHandler.js'
import { nextFormattedId } from '../models/counter.model.js'
import { RoleModel } from '../models/role.model.js'
import { SessionModel } from '../models/session.model.js'
import { UserModel } from '../models/user.model.js'
import { logActivity } from '../services/activity.js'
import { hashPassword, passwordPolicy } from '../services/password.js'
import { toObjectId } from '../services/access.js'
import { createUserSchema, resetPasswordSchema, updateUserSchema } from '../validation/schemas.js'
import { serializeUser } from './auth.controller.js'

export async function listUsers(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  if (!hasPermission(user, 'viewTeam') && !hasPermission(user, 'assignLeads')) {
    const users = await UserModel.find({ active: true }).select('name employeeCode role').sort({ name: 1 }).lean()
    response.json({ items: users.map((item) => ({ ...item, id: String(item._id) })) })
    return
  }
  const users = await UserModel.find().sort({ active: -1, name: 1 }).populate<{ customRole: { _id: unknown; name: string } | null }>('customRole', 'name').lean()
  response.json({ items: users.map(serializeTeamMember) })
}

function serializeTeamMember(user: Record<string, unknown> & { customRole?: { _id: unknown; name: string } | null }) {
  const role = user.customRole
  return { ...serializeUser(user), customRole: role ? String(role._id) : null, customRoleName: role?.name ?? null }
}

async function assertRoleExists(id: string | null | undefined): Promise<void> {
  if (id && !(await RoleModel.exists({ _id: id }))) {
    throw new HttpError(400, 'That role no longer exists', { fields: { customRole: 'Choose another role' } })
  }
}

async function populatedMember(id: unknown) {
  const user = await UserModel.findById(id).populate<{ customRole: { _id: unknown; name: string } | null }>('customRole', 'name').lean()
  if (!user) throw new HttpError(404, 'Employee not found')
  return serializeTeamMember(user)
}

export async function createUser(request: Request, response: Response): Promise<void> {
  const actor = currentUser(request)
  const input = createUserSchema.parse(request.body)
  const problem = passwordPolicy.test(input.password)
  if (problem) throw new HttpError(400, problem, { fields: { password: problem } })
  if (await UserModel.exists({ email: input.email })) {
    throw new HttpError(409, 'An employee with this email already exists', { fields: { email: 'Email already in use' } })
  }

  await assertRoleExists(input.customRole)

  const { password, ...data } = input
  const user = await UserModel.create({
    ...data,
    customRole: data.role === 'super_admin' ? null : data.customRole ?? null,
    employeeCode: await nextFormattedId('employee', 'EMP'),
    passwordHash: await hashPassword(password),
  })
  await logActivity({
    actor: actor._id, action: 'employee_created', entityType: 'user', entityId: user._id,
    newValue: { name: user.name, email: user.email, role: user.role, customRole: user.customRole ? String(user.customRole) : null },
  })
  response.status(201).json({ user: await populatedMember(user._id) })
}

export async function updateUser(request: Request, response: Response): Promise<void> {
  const actor = currentUser(request)
  const id = toObjectId(request.params.id, 'employee id')
  const input = updateUserSchema.parse(request.body)
  const user = await UserModel.findById(id)
  if (!user) throw new HttpError(404, 'Employee not found')

  if (actor._id.equals(id) && (input.active === false || (input.role && input.role !== 'super_admin'))) {
    throw new HttpError(400, 'You cannot deactivate or demote your own account')
  }
  if (user.role === 'super_admin' && (input.active === false || (input.role && input.role !== 'super_admin'))) {
    const remaining = await UserModel.countDocuments({ role: 'super_admin', active: true, _id: { $ne: id } })
    if (remaining === 0) throw new HttpError(400, 'At least one active Super Admin is required')
  }

  await assertRoleExists(input.customRole)

  const before = user.toObject()
  if (input.permissions) user.permissions = { ...(before.permissions ?? {}), ...input.permissions } as typeof user.permissions
  const { permissions: _permissions, customRole, ...rest } = input
  Object.assign(user, rest)
  if (customRole !== undefined) user.set('customRole', customRole)
  if (user.role === 'super_admin') user.set('customRole', null)
  await user.save()

  const changes = Object.keys(input).map((field) => ({
    field,
    previousValue: (before as Record<string, unknown>)[field],
    newValue: (user.toObject() as Record<string, unknown>)[field],
  }))
  await logActivity({
    actor: actor._id, action: 'employee_updated', entityType: 'user', entityId: user._id, notes: user.name,
    previousValue: Object.fromEntries(changes.map((change) => [change.field, change.previousValue])),
    newValue: Object.fromEntries(changes.map((change) => [change.field, change.newValue])),
  })
  if (input.active === false) await SessionModel.deleteMany({ user: user._id })
  response.json({ user: await populatedMember(user._id) })
}

export async function resetUserPassword(request: Request, response: Response): Promise<void> {
  const actor = currentUser(request)
  const id = toObjectId(request.params.id, 'employee id')
  const { password } = resetPasswordSchema.parse(request.body)
  const problem = passwordPolicy.test(password)
  if (problem) throw new HttpError(400, problem, { fields: { password: problem } })
  const user = await UserModel.findById(id)
  if (!user) throw new HttpError(404, 'Employee not found')
  user.passwordHash = await hashPassword(password)
  user.passwordChangedAt = new Date()
  await user.save()
  await SessionModel.deleteMany({ user: user._id })
  await logActivity({ actor: actor._id, action: 'password_reset', entityType: 'user', entityId: user._id, notes: user.name })
  response.json({ message: `Password reset for ${user.name}. They have been signed out of all sessions.` })
}
