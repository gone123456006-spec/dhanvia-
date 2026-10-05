import { Schema, model, type InferSchemaType } from 'mongoose'

const automationSchema = new Schema(
  {
    autoAssignNewLeads: { type: Boolean, default: true },
    createCallTaskOnAssign: { type: Boolean, default: true },
    callTaskDueMinutes: { type: Number, default: 30, min: 0, max: 10_080 },
    retryCallAfterHours: { type: Number, default: 4, min: 1, max: 168 },
    createFollowUpOnInterested: { type: Boolean, default: true },
    followUpDelayHours: { type: Number, default: 24, min: 1, max: 720 },
    createTaskOnStageChange: { type: Boolean, default: true },
    documentsCompleteToProcessing: { type: Boolean, default: true },
    paymentCompleteToConverted: { type: Boolean, default: true },
    notifyOverdueToSuperAdmins: { type: Boolean, default: true },
    paymentReminderDays: { type: Number, default: 2, min: 0, max: 60 },
  },
  { _id: false },
)

const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, trim: true, maxlength: 120 },
    price: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
    defaultDocuments: { type: [String], default: [] },
  },
  { _id: true },
)

const socialAccountSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    instagram: { type: String, trim: true, maxlength: 500, default: '' },
    facebook: { type: String, trim: true, maxlength: 500, default: '' },
    youtube: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: true },
)

const defaultSocialAccounts = () => [
  { name: 'Dhanvia', instagram: '', facebook: '', youtube: '' },
  {
    name: 'Pranav Coaching Class',
    instagram: 'https://www.instagram.com/pranavcoachingclass',
    facebook: 'https://www.facebook.com/share/1C4CpG6hqY/',
    youtube: 'https://youtube.com/@pranavcoaching',
  },
]

const settingsSchema = new Schema(
  {
    _id: { type: String, default: 'global' },
    socialAccounts: { type: [socialAccountSchema], default: defaultSocialAccounts },
    services: { type: [serviceSchema], default: [] },
    leadSources: { type: [String], default: [] },
    lostReasons: { type: [String], default: [] },
    automation: { type: automationSchema, default: () => ({}) },
  },
  { timestamps: true },
)

export type Settings = InferSchemaType<typeof settingsSchema>
export const SettingsModel = model('Settings', settingsSchema)

export async function getSettings() {
  const settings = await SettingsModel.findById('global')
  if (settings) return settings
  return SettingsModel.create({ _id: 'global' })
}
