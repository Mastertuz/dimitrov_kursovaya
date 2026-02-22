import { Prisma } from '@prisma/client'
import { prisma } from '../utils/prisma'

export const auditRepository = {
  create(data: {
    userId?: string
    action: string
    entity: string
    entityId?: string
    result: string
    metadata?: Prisma.InputJsonValue
  }) {
    const { userId, action, entity, entityId, result, metadata } = data

    return prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        result,
        metadata,
        ...(userId ? { user: { connect: { id: userId } } } : {}),
      },
    })
  },

  list(limit = 100) {
    return prisma.auditLog.findMany({
      take: limit,
      include: { user: { select: { id: true, email: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    })
  },
}