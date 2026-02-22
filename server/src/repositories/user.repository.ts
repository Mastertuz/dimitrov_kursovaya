import { AccountStatus } from '@prisma/client'
import { prisma } from '../utils/prisma'

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { role: true },
    })
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true },
    })
  },

  create(data: {
    fullName: string
    email: string
    passwordHash: string
    roleId: number
    status?: AccountStatus
  }) {
    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash: data.passwordHash,
        roleId: data.roleId,
        status: data.status ?? 'ACTIVE',
      },
      include: { role: true },
    })
  },

  countFavorites(userId: string) {
    return prisma.favoriteItem.count({ where: { userId } })
  },

  countCartItems(userId: string) {
    return prisma.cartItem.count({ where: { userId } })
  },

  listForAdmin() {
    return prisma.user.findMany({
      include: {
        role: true,
        _count: {
          select: {
            customerOrders: true,
            favoriteItems: true,
            cartItems: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },
}