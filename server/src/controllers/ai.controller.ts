import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { aiService } from '../services/ai.service'

export const aiController = {
  async forecast(request: Request, response: Response, next: NextFunction) {
    try {
      const query = z.object({ window: z.coerce.number().min(3).max(60).optional() }).parse(request.query)
      const result = await aiService.forecastRevenue({
        window: query.window ?? 14,
        authorId: request.user?.userId,
      })

      response.json(result)
    } catch (error) {
      next(error)
    }
  },
}