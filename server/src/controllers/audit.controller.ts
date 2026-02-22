import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { auditRepository } from '../repositories/audit.repository'

export const auditController = {
  async list(request: Request, response: Response, next: NextFunction) {
    try {
      const query = z.object({ limit: z.coerce.number().min(1).max(500).optional() }).parse(request.query)
      const result = await auditRepository.list(query.limit ?? 100)
      response.json(result)
    } catch (error) {
      next(error)
    }
  },
}