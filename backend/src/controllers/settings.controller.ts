import type { Request, Response } from 'express'
import {
  callOutcomes,
  conversationChannels,
  documentStatuses,
  interestLevels,
  leadStages,
  leadStatuses,
  paymentMethods,
  paymentStatuses,
  permissionKeys,
  priorities,
  processingStatuses,
  taskTypes,
} from '../domain/enums.js'
import { env } from '../config/env.js'
import { currentUser, hasPermission, isSuperAdmin } from '../middleware/auth.js'
import { LeadModel } from '../models/lead.model.js'
import { getSettings } from '../models/settings.model.js'
import { UserModel } from '../models/user.model.js'
import { logActivity } from '../services/activity.js'
import { settingsSchema, socialAccountsSchema } from '../validation/schemas.js'

export async function meta(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const [settings, users, usedSources, usedServices] = await Promise.all([
    getSettings(),
    UserModel.find({ active: true }).select('name employeeCode role').sort({ name: 1 }).lean(),
    LeadModel.distinct('source'),
    LeadModel.distinct('service'),
  ])
  const configuredServices = settings.services.filter((service) => service.active).map((service) => service.name)
  response.json({
    enums: { leadStages, leadStatuses, priorities, interestLevels, callOutcomes, taskTypes, conversationChannels, documentStatuses, paymentStatuses, paymentMethods, processingStatuses, permissionKeys },
    services: [...new Set([...configuredServices, ...usedServices])].sort(),
    leadSources: [...new Set([...settings.leadSources, ...usedSources])].sort(),
    lostReasons: settings.lostReasons,
    users: users.map((item) => ({ id: String(item._id), name: item.name, employeeCode: item.employeeCode, role: item.role })),
    timezone: env.timezone,
    capabilities: {
      isSuperAdmin: isSuperAdmin(user),
      roleName: user.customRole?.name ?? null,
      ...Object.fromEntries(permissionKeys.map((key) => [key, hasPermission(user, key)])),
    },
  })
}

export async function getSettingsHandler(_request: Request, response: Response): Promise<void> {
  response.json({ settings: await getSettings() })
}

export async function getSocialAccounts(_request: Request, response: Response): Promise<void> {
  const settings = await getSettings()
  response.json({ accounts: settings.socialAccounts })
}

export async function updateSocialAccounts(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const { accounts } = socialAccountsSchema.parse(request.body)
  const settings = await getSettings()
  const before = settings.toObject().socialAccounts
  settings.set('socialAccounts', accounts)
  await settings.save()
  await logActivity({
    actor: user._id,
    action: 'social_links_updated',
    entityType: 'settings',
    previousValue: before,
    newValue: settings.toObject().socialAccounts,
  })
  response.json({ accounts: settings.socialAccounts })
}

export async function updateSettings(request: Request, response: Response): Promise<void> {
  const user = currentUser(request)
  const input = settingsSchema.parse(request.body)
  const settings = await getSettings()
  const before = settings.toObject()

  if (input.services) settings.set('services', input.services)
  if (input.leadSources) settings.leadSources = [...new Set(input.leadSources)]
  if (input.lostReasons) settings.lostReasons = [...new Set(input.lostReasons)]
  if (input.automation) settings.set('automation', { ...(before.automation ?? {}), ...input.automation })
  await settings.save()

  const changed = (Object.keys(input) as Array<keyof typeof input>).filter((key) => input[key] !== undefined)
  await logActivity({
    actor: user._id,
    action: 'settings_updated',
    previousValue: Object.fromEntries(changed.map((key) => [key, (before as Record<string, unknown>)[key]])),
    newValue: Object.fromEntries(changed.map((key) => [key, (settings.toObject() as Record<string, unknown>)[key]])),
    entityType: 'settings',
  })
  response.json({ settings })
}
