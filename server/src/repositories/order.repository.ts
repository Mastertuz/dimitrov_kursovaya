import { Prisma } from '@prisma/client'
import { prisma } from '../utils/prisma'

export const orderRepository = {
  findStatusByCode(code: string) {
    return prisma.status.findUnique({ where: { code } })
  },

  findProductsByIds(productIds: number[]) {
    return prisma.product.findMany({
      where: { id: { in: productIds } },
    })
  },

  createOrder(data: {
    customerId: string
    statusId: number
    total: Prisma.Decimal
    deliveryAddress: string
    recipientName?: string
    recipientPhone?: string
    deliveryDate?: Date
    items: Array<{ productId: number; size?: string; quantity: number; unitPrice: Prisma.Decimal }>
  }) {
    return prisma.order.create({
      data: {
        customerId: data.customerId,
        statusId: data.statusId,
        total: data.total,
        deliveryAddress: data.deliveryAddress,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        deliveryDate: data.deliveryDate,
        items: {
          create: data.items,
        },
      },
      include: {
        status: true,
        items: {
          include: { product: true },
        },
      },
    })
  },

  createOrderWithInventoryUpdates(data: {
    customerId: string
    statusId: number
    total: Prisma.Decimal
    deliveryAddress: string
    recipientName?: string
    recipientPhone?: string
    deliveryDate?: Date
    items: Array<{ productId: number; size?: string; quantity: number; unitPrice: Prisma.Decimal }>
    inventoryUpdates: Array<{ productId: number; stock: number; sizeStock: Prisma.InputJsonValue }>
  }) {
    return prisma.$transaction(async (tx) => {
      for (const update of data.inventoryUpdates) {
        await tx.product.update({
          where: { id: update.productId },
          data: {
            stock: update.stock,
            sizeStock: update.sizeStock,
          },
        })
      }

      return tx.order.create({
        data: {
          customerId: data.customerId,
          statusId: data.statusId,
          total: data.total,
          deliveryAddress: data.deliveryAddress,
          recipientName: data.recipientName,
          recipientPhone: data.recipientPhone,
          deliveryDate: data.deliveryDate,
          items: {
            create: data.items,
          },
        },
        include: {
          status: true,
          items: {
            include: { product: true },
          },
        },
      })
    })
  },

  listByCustomer(customerId: string) {
    return prisma.order.findMany({
      where: { customerId },
      include: {
        status: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  listProfileStatsByCustomer(customerId: string) {
    return prisma.order.findMany({
      where: { customerId },
      select: {
        createdAt: true,
        total: true,
        status: { select: { code: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  updateStatus(orderId: string, statusId: number, operatorId: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        statusId,
        operatorId,
      },
      include: {
        status: true,
        items: { include: { product: true } },
      },
    })
  },

  findById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        status: true,
        items: { include: { product: true } },
      },
    })
  },

  findByPaymentId(paymentId: string) {
    return prisma.order.findFirst({
      where: { paymentId },
      include: {
        status: true,
        items: { include: { product: true } },
      },
    })
  },

  attachPayment(orderId: string, paymentId: string, paymentStatus?: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId,
        paymentStatus,
      },
      include: {
        status: true,
        items: { include: { product: true } },
      },
    })
  },

  updatePaymentAndStatus(orderId: string, data: { paymentStatus: string; statusId?: number }) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: data.paymentStatus,
        ...(data.statusId ? { statusId: data.statusId } : {}),
      },
      include: {
        status: true,
        items: { include: { product: true } },
      },
    })
  },

  findRecent(count: number) {
    return prisma.order.findMany({
      take: count,
      orderBy: { createdAt: 'desc' },
      select: { total: true, createdAt: true },
    })
  },
}