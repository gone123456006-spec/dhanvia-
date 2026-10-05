import type { Request, Response } from 'express'
import { createSession, currentUser, destroySession, hashToken, SESSION_COOKIE } from '../middleware/auth.js'
import { HttpError } from '../middleware/errorHandler.js'
import { SessionModel } from '../models/session.model.js'
import { UserModel } from '../models/user.model.js'
import { logActivity } from '../services/activity.js'
import { hashPassword, passwordPolicy, verifyPassword } from '../services/password.js'
import { changePasswordSchema, loginSchema } from '../validation/schemas.js'

const DUMMY_HASH = 'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$' + 'A'.repeat(86) + '=='

export async function login(request: Request, response: Response): Promise<void> {
  const { email, password } = loginSchema.parse(request.body)
  const user = await UserModel.findOne({ email }).select('+passwordHash')
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !valid) throw new HttpError(401, 'Incorrect email or password')
  if (!user.active) throw new HttpError(403, 'Your account has been deactivated. Contact your Super Admin.')

  await createSession(request, response, user._id)
  user.lastLoginAt = new Date()
  await user.save()
  await logActivity({ actor: user._id, action: 'signed_in', entityType: 'user', entityId: user._id })
  response.json({ user: serializeUser(user.toObject()) })
}

export async function logout(request: Request, response: Response): Promise<void> {
  await destroySession(request, response)
  response.status(204).end()
}

export async function me(request: Request, response: Response): Promise<void> {
  const user = await UserModel.findById(currentUser(request)._id).lean()
  if (!user) throw new HttpError(401, 'Please sign in to continue')
  response.json({ user: serializeUser(user) })
}

export async function changePassword(request: Request, response: Response): Promise<void> {
  const { currentPassword, newPassword } = changePasswordSchema.parse(request.body)
  const problem = passwordPolicy.test(newPassword)
  if (problem) throw new HttpError(400, problem, { fields: { newPassword: problem } })

  const user = await UserModel.findById(currentUser(request)._id).select('+passwordHash')
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new HttpError(400, 'Current password is incorrect', { fields: { currentPassword: 'Current password is incorrect' } })
  }
  user.passwordHash = await hashPassword(newPassword)
  user.passwordChangedAt = new Date()
  await user.save()

  const token = request.cookies?.[SESSION_COOKIE]
  await SessionModel.deleteMany({ user: user._id, tokenHash: { $ne: token ? hashToken(token) : '' } })
  await logActivity({ actor: user._id, action: 'password_changed', entityType: 'user', entityId: user._id })
  response.json({ message: 'Password updated. Other sessions have been signed out.' })
}

export function serializeUser(user: Record<string, unknown>) {
  const { passwordHash: _passwordHash, __v: _version, ...rest } = user
  return { ...rest, id: String(user._id) }
}
