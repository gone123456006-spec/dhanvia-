import type { Types } from 'mongoose'
import { ActivityModel } from '../models/activity.model.js'

export type ActivityOrigin = 'user' | 'automation' | 'system' | 'website'

export interface ActivityInput {
  lead?: Types.ObjectId | null
  customer?: Types.ObjectId | null
  actor?: Types.ObjectId | null
  origin?: ActivityOrigin
  action: string
  field?: string
  previousValue?: unknown
  newValue?: unknown
  notes?: string
  entityType?: string
  entityId?: Types.ObjectId
}

function normalize(value: unknown): unknown {
  if (value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  if (value && typeof value === 'object' && 'toHexString' in value) return String(value)
  return value
}

export async function logActivity(input: ActivityInput): Promise<void> {
  await ActivityModel.create({
    ...input,
    origin: input.origin ?? (input.actor ? 'user' : 'system'),
    previousValue: normalize(input.previousValue),
    newValue: normalize(input.newValue),
  })
}

export async function logActivities(inputs: ActivityInput[]): Promise<void> {
  if (inputs.length === 0) return
  await ActivityModel.insertMany(
    inputs.map((input) => ({
      ...input,
      origin: input.origin ?? (input.actor ? 'user' : 'system'),
      previousValue: normalize(input.previousValue),
      newValue: normalize(input.newValue),
    })),
  )
}
