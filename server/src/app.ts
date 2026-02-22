import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import pinoHttp from 'pino-http'
import { env } from './config/env'
import { errorHandler } from './middleware/error-handler'
import { apiRouter } from './routes'
import { logger } from './utils/logger'

export function createApp() {
  const app = express()

  const allowedOrigins = new Set([
    env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ])

  app.use(helmet())
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true)
          return
        }

        callback(new Error('CORS origin not allowed'))
      },
      credentials: true,
    }),
  )
  app.use(express.json())
  app.use(morgan('combined'))
  app.use(pinoHttp({ logger }))

  app.use('/api', apiRouter)
  app.use(errorHandler)

  return app
}