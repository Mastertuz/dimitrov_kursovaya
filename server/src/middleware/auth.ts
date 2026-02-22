import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { HttpError } from './error-handler'
import { userRepository } from '../repositories/user.repository'

type JwtPayload = {
  userId: string
  email: string
  role: string
}

export function authenticate(request: Request, _response: Response, next: NextFunction) {
  const authorization = request.headers.authorization

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new HttpError(401, 'Требуется авторизация')
  }

  const token = authorization.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    request.user = payload
    next()
  } catch {
    throw new HttpError(401, 'Невалидный токен')
  }
}

export function authorizeRoles(...roles: string[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) {
      throw new HttpError(401, 'Требуется авторизация')
    }

    userRepository
      .findById(request.user.userId)
      .then((dbUser) => {
        if (!dbUser) {
          throw new HttpError(401, 'Пользователь не найден')
        }

        request.user!.role = dbUser.role.code

        if (!roles.includes(dbUser.role.code)) {
          throw new HttpError(403, 'Недостаточно прав')
        }

        next()
      })
      .catch(next)
  }
}