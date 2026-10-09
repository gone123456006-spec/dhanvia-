import mongoose, { type Model } from 'mongoose'
import { createInterface } from 'node:readline/promises'
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { env } from '../config/env.js'
import { ActivityModel } from '../models/activity.model.js'
import { CallModel } from '../models/call.model.js'
import { ConversationModel } from '../models/conversation.model.js'
import { CustomerModel } from '../models/customer.model.js'
import { LeadDocumentModel } from '../models/document.model.js'
import { LeadModel } from '../models/lead.model.js'
import { NotificationModel } from '../models/notification.model.js'
import { PaymentModel } from '../models/payment.model.js'
import { ProcessingStepModel } from '../models/processingStep.model.js'
import { RoleModel } from '../models/role.model.js'
import { SessionModel } from '../models/session.model.js'
import { SettingsModel } from '../models/settings.model.js'
import { SupportRequestModel } from '../models/supportRequest.model.js'
import { TaskModel } from '../models/task.model.js'
import { UserModel } from '../models/user.model.js'

const usage = `Usage: npm run reset-data -- [--staff] [--settings]

Permanently deletes CRM data so the admin panel starts empty.
Always cleared: leads, customers, calls, conversations, documents (and uploaded files),
payments, processing steps, tasks, notifications, activity log, support requests,
lead/customer ID counters, and all login sessions (everyone signs in again).
Super Admin accounts are always kept.

  --staff     also delete every non-Super-Admin user and all custom roles
  --settings  also reset settings (social links, automation) to defaults`

const flags = new Set(process.argv.slice(2))
const known = new Set(['--staff', '--settings', '--help'])
const unknown = [...flags].filter((flag) => !known.has(flag))
if (flags.has('--help') || unknown.length) {
  if (unknown.length) console.error(`Unknown option: ${unknown.join(', ')}\n`)
  console.log(usage)
  process.exit(unknown.length ? 1 : 0)
}
const clearStaff = flags.has('--staff')
const clearSettings = flags.has('--settings')

// Calls, payments, conversations and the activity log block deletes at the model level, so the
// reset goes through the raw collections to bypass those guards.
const businessModels: [string, Pick<Model<unknown>, 'collection'>][] = [
  ['Leads', LeadModel],
  ['Customers', CustomerModel],
  ['Calls', CallModel],
  ['Conversations', ConversationModel],
  ['Documents', LeadDocumentModel],
  ['Payments', PaymentModel],
  ['Processing steps', ProcessingStepModel],
  ['Tasks', TaskModel],
  ['Notifications', NotificationModel],
  ['Activity log', ActivityModel],
  ['Support requests', SupportRequestModel],
  ['Login sessions', SessionModel],
]

async function main(): Promise<void> {
  await connectDatabase(3)
  const db = mongoose.connection.db
  if (!db) throw new Error('Database connection is not ready')

  const uploadedFiles = db.collection('documents.files')
  const uploadedChunks = db.collection('documents.chunks')
  const counters = db.collection('counters')
  const staffFilter = { role: { $ne: 'super_admin' } }

  const plan: [string, number][] = []
  for (const [label, model] of businessModels) plan.push([label, await model.collection.countDocuments()])
  plan.push(['Uploaded files', await uploadedFiles.countDocuments()])
  if (clearStaff) {
    plan.push(['Sub-admin users', await UserModel.collection.countDocuments(staffFilter)])
    plan.push(['Custom roles', await RoleModel.collection.countDocuments()])
  }
  if (clearSettings) plan.push(['Settings', await SettingsModel.collection.countDocuments()])
  const superAdmins = await UserModel.collection.countDocuments({ role: 'super_admin' })

  console.log(`\nDatabase: ${env.mongoDbName}\n\nWill permanently delete:`)
  for (const [label, count] of plan) console.log(`  ${label.padEnd(18)} ${count}`)
  console.log(`\nWill keep: ${superAdmins} Super Admin account(s)${clearStaff ? '' : ', sub-admin users, custom roles'}${clearSettings ? '' : ', settings'}.`)
  if (superAdmins === 0) console.log('Warning: there is no Super Admin. Run "npm run create-admin" afterwards to be able to sign in.')

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(`\nThis cannot be undone. Type the database name "${env.mongoDbName}" to confirm: `)
  rl.close()
  if (answer.trim() !== env.mongoDbName) {
    console.log('Cancelled. Nothing was deleted.')
    return
  }

  for (const [, model] of businessModels) await model.collection.deleteMany({})
  await uploadedFiles.deleteMany({})
  await uploadedChunks.deleteMany({})
  // The employee counter stays so new staff codes never collide with the kept accounts.
  await counters.deleteMany({ _id: { $in: ['lead', 'customer'] } } as never)
  if (clearStaff) {
    await UserModel.collection.deleteMany(staffFilter)
    await RoleModel.collection.deleteMany({})
    await UserModel.collection.updateMany({}, { $set: { customRole: null } })
  }
  if (clearSettings) await SettingsModel.collection.deleteMany({})

  console.log('\nDone. The admin panel now starts empty. Sign in again at /admin.')
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => disconnectDatabase().catch(() => undefined))
