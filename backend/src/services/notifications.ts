import type { Types } from 'mongoose'
import type { NotificationType } from '../domain/enums.js'
import { NotificationModel } from '../models/notification.model.js'
import { UserModel } from '../models/user.model.js'

export interface NotificationInput {
  type: NotificationType
  title: string
  message?: string
  lead?: Types.ObjectId
  task?: Types.ObjectId
  dedupeKey?: string
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: number }).code === 11000
}

export async function notify(userIds: Array<Types.ObjectId | null | undefined>, input: NotificationInput): Promise<void> {
  const unique = [...new Map(userIds.filter(Boolean).map((id) => [String(id), id!])).values()]
  await Promise.all(
    unique.map(async (user) => {
      try {
        await NotificationModel.create({ ...input, user })
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error
      }
    }),
  )
}

export async function superAdminIds(): Promise<Types.ObjectId[]> {
  return UserModel.find({ role: 'super_admin', active: true }).distinct('_id')
}

export async function notifySuperAdmins(input: NotificationInput, extra: Array<Types.ObjectId | null | undefined> = []): Promise<void> {
  await notify([...extra, ...(await superAdminIds())], input)
}
