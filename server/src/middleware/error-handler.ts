import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { logger } from '../utils/logger'

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Некорректные входные данные',
      details: error.flatten(),
    })
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    })
  }

  logger.error({ error }, 'Unexpected error')
  return res.status(500).json({
    message: 'Внутренняя ошибка сервера',
  })
}