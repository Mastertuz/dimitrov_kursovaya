import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { authService } from '../services/auth.service'

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  roleCode: z.enum(['ADMIN', 'OPERATOR', 'MANAGER', 'CLIENT']).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const authController = {
  async listUsers(_request: Request, response: Response, next: NextFunction) {
    try {
      const users = await authService.listUsers()
      response.json(users)
    } catch (error) {
      next(error)
    }
  },

  async register(request: Request, response: Response, next: NextFunction) {
    try {
      const body = registerSchema.parse(request.body)
      const result = await authService.register(body)
      response.status(201).json(result)
    } catch (error) {
      next(error)
    }
  },

  async login(request: Request, response: Response, next: NextFunction) {
    try {
      const body = loginSchema.parse(request.body)
      const result = await authService.login(body)
      response.json(result)
    } catch (error) {
      next(error)
    }
  },

  async me(request: Request, response: Response, next: NextFunction) {
    try {
      const result = await authService.me(request.user!.userId)
      response.json(result)
    } catch (error) {
      next(error)
    }
  },
}