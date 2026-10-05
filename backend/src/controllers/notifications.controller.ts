import type { Request, Response } from 'express'
import { currentUser } from '../middleware/auth.js'
import { NotificationModel } from '../models/notification.model.js'
import { toObjectId } from '../services/access.js'
import { pageQuerySchema } from '../validation/schemas.js'
import { paged } from './helpers.js'

export async function listNotifications(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const { page, limit, status } = pageQuerySchema.parse(request.query)
  const filter: Record<string, unknown> = { user: user._id }
  if (status === 'unread') filter.readAt = null
  const [items, total, unread] = await Promise.all([
    NotificationModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('lead', 'leadId name').lean(),
    NotificationModel.countDocuments(filter),
    NotificationModel.countDocuments({ user: user._id, readAt: null }),
  ])
  response.json({ ...paged(items, total, page, limit), unread })
}

export async function markNotificationRead(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  await NotificationModel.updateOne({ _id: toObjectId(request.params.id), user: user._id, readAt: null }, { $set: { readAt: new Date() } })
  response.json({ ok: true })
}

export async function markAllNotificationsRead(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const result = await NotificationModel.updateMany({ user: user._id, readAt: null }, { $set: { readAt: new Date() } })
  response.json({ updated: result.modifiedCount })
}
