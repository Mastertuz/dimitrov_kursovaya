import { createApp } from './app'
import { env } from './config/env'
import { logger } from './utils/logger'
import { prisma } from './utils/prisma'

const app = createApp()

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Backend started')
})

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down')
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})