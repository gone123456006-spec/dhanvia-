import { createInterface } from 'node:readline/promises'
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { nextFormattedId } from '../models/counter.model.js'
import { UserModel } from '../models/user.model.js'
import { hashPassword, passwordPolicy } from '../services/password.js'

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(question)
  rl.close()
  return answer.trim()
}

async function main(): Promise<void> {
  const name = process.env.SUPER_ADMIN_NAME || (await prompt('Full name: '))
  const email = (process.env.SUPER_ADMIN_EMAIL || (await prompt('Email: '))).toLowerCase()
  const password = process.env.SUPER_ADMIN_PASSWORD || (await prompt('Password (min 8 chars, letters + numbers): '))

  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('A valid name and email are required')
  const problem = passwordPolicy.test(password)
  if (problem) throw new Error(problem)

  await connectDatabase()
  const existing = await UserModel.findOne({ email })
  if (existing) {
    existing.role = 'super_admin'
    existing.active = true
    existing.passwordHash = await hashPassword(password)
    await existing.save()
    console.log(`Updated ${email} to an active Super Admin with the new password.`)
  } else {
    await UserModel.create({
      employeeCode: await nextFormattedId('employee', 'EMP'),
      name,
      email,
      passwordHash: await hashPassword(password),
      role: 'super_admin',
      acceptsLeads: false,
    })
    console.log(`Created Super Admin ${email}. Sign in at /admin.`)
  }
  await disconnectDatabase()
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  await disconnectDatabase().catch(() => undefined)
  process.exit(1)
})
