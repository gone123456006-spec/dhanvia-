import { createHash, randomBytes } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import type { Types } from 'mongoose'
import { env } from '../config/env.js'
import type { PermissionKey, Role } from '../domain/enums.js'
import { SessionModel } from '../models/session.model.js'
import { UserModel } from '../models/user.model.js'
import { resolvePermissions } from '../services/permissions.js'
import { HttpError } from './errorHandler.js'

export const SESSION_COOKIE = 'dhanvia_session'

export interface AuthUser {
  _id: Types.ObjectId
  id: string
  name: string
  email: string
  role: Role
  customRole: { id: string; name: string } | null
  permissions: Record<PermissionKey, boolean>
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(request: Request, response: Response, userId: Types.ObjectId): Promise<void> {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + env.sessionTtlDays * 86_400_000)
  await SessionModel.create({
    tokenHash: hashToken(token),
    user: userId,
    expiresAt,
    userAgent: request.get('user-agent')?.slice(0, 300),
    ip: request.ip,
  })
  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'strict',
    expires: expiresAt,
    path: '/api',
  })
}

export async function destroySession(request: Request, response: Response): Promise<void> {
  const token = request.cookies?.[SESSION_COOKIE]
  if (token) await SessionModel.deleteOne({ tokenHash: hashToken(token) })
  response.clearCookie(SESSION_COOKIE, { path: '/api' })
}

interface PopulatedRole {
  _id: Types.ObjectId
  name: string
  permissions?: Partial<Record<PermissionKey, boolean>>
}

export async function requireAuth(request: Request, _response: Response, next: NextFunction): Promise<void> {
  const token = request.cookies?.[SESSION_COOKIE]
  if (!token) throw new HttpError(401, 'Please sign in to continue')

  const session = await SessionModel.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } }).lean()
  if (!session) throw new HttpError(401, 'Your session has expired. Please sign in again')

  const user = await UserModel.findById(session.user).populate<{ customRole: PopulatedRole | null }>('customRole', 'name permissions').lean()
  if (!user || !user.active) throw new HttpError(401, 'Your account is inactive')

  const customRole = user.role === 'super_admin' ? null : user.customRole
  request.user = {
    _id: user._id,
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as Role,
    customRole: customRole ? { id: String(customRole._id), name: customRole.name } : null,
    permissions: resolvePermissions(user.permissions as Partial<Record<PermissionKey, boolean>>, customRole?.permissions),
  }
  next()
}

export function isSuperAdmin(user: AuthUser): boolean {
  return user.role === 'super_admin'
}

export function hasPermission(user: AuthUser, permission: PermissionKey): boolean {
  return isSuperAdmin(user) || Boolean(user.permissions[permission])
}

export function requireSuperAdmin(request: Request, _response: Response, next: NextFunction): void {
  if (!request.user || !isSuperAdmin(request.user)) throw new HttpError(403, 'Only a Super Admin can perform this action')
  next()
}

export function requirePermission(permission: PermissionKey) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.user || !hasPermission(request.user, permission)) {
      throw new HttpError(403, 'You do not have permission to perform this action')
    }
    next()
  }
}

export function currentUser(request: Request): AuthUser {
  if (!request.user) throw new HttpError(401, 'Please sign in to continue')
  return request.user
}
