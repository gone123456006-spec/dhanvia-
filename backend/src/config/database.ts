import mongoose from 'mongoose'
import { logger } from '../utils/logger.js'
import { env } from './env.js'

// Covers a network that is still coming up (laptop wake, Wi-Fi/hotspot join, container DNS warm-up).
const CONNECT_ATTEMPTS = 10

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true)
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'))
  mongoose.connection.on('error', (error: unknown) => logger.error('MongoDB connection error', { error }))

  for (let attempt = 1; ; attempt += 1) {
    try {
      await mongoose.connect(env.mongoUri, {
        dbName: env.mongoDbName,
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: env.mongoMaxPoolSize,
        retryWrites: true,
        appName: 'dhanvia-api',
      })
      logger.info('Connected to MongoDB', { database: env.mongoDbName })
      return
    } catch (error) {
      if (attempt >= CONNECT_ATTEMPTS) throw error
      const delayMs = Math.min(2_000 * attempt, 15_000)
      logger.warn('MongoDB connection failed, retrying', { attempt, retryInMs: delayMs, reason: error instanceof Error ? error.message : String(error) })
      await mongoose.disconnect().catch(() => undefined)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect()
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1
}
