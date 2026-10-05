import { app } from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { env } from './config/env.js'
import { markShuttingDown } from './controllers/health.controller.js'
import { startKeepAlive } from './jobs/keepAlive.js'
import { startReminderScheduler } from './jobs/reminders.js'
import { logger } from './utils/logger.js'

async function start(): Promise<void> {
  await connectDatabase()

  const server = app.listen(env.port, env.host, () => {
    logger.info('Dhanvia API listening', { port: env.port, host: env.host, env: env.nodeEnv, frontend: env.serveFrontend })
  })
  server.on('error', (error: NodeJS.ErrnoException) => {
    logger.error(error.code === 'EADDRINUSE' ? `Port ${env.port} is already in use` : 'HTTP server error', { error })
    process.exit(1)
  })
  // Must exceed the idle timeout of any load balancer in front (AWS ALB defaults to 60s).
  server.keepAliveTimeout = 65_000
  server.headersTimeout = 66_000
  server.requestTimeout = 120_000

  const stopReminders = env.runJobs ? startReminderScheduler() : async () => {}
  if (!env.runJobs) logger.info('Background jobs disabled (RUN_JOBS=false)')
  const stopKeepAlive = startKeepAlive()

  let shuttingDown = false
  async function shutdown(signal: string, exitCode = 0): Promise<void> {
    if (shuttingDown) return
    shuttingDown = true
    markShuttingDown()
    logger.info('Shutting down', { signal })

    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit', { timeoutMs: env.shutdownTimeoutMs })
      process.exit(1)
    }, env.shutdownTimeoutMs)
    forceExit.unref()

    try {
      const closed = new Promise<void>((resolve) => server.close(() => resolve()))
      server.closeIdleConnections()
      await Promise.all([closed, stopReminders(), stopKeepAlive()])
      await disconnectDatabase()
      logger.info('Shutdown complete')
    } catch (error) {
      logger.error('Error during shutdown', { error })
      exitCode = 1
    }
    process.exit(exitCode)
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { error: reason })
  })
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception, shutting down', { error })
    void shutdown('uncaughtException', 1)
  })
}

start().catch((error: unknown) => {
  logger.error('Failed to start Dhanvia API', { error })
  process.exit(1)
})
