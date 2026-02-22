import { Prisma } from '@prisma/client'
import { orderRepository } from '../repositories/order.repository'
import { auditRepository } from '../repositories/audit.repository'
import { HttpError } from '../middleware/error-handler'

function normalizeSizeLabel(size: string) {
  return size.trim().toUpperCase()
}

function sanitizeSizes(sizes: string[]) {
  const normalized = sizes.map(normalizeSizeLabel).filter(Boolean)
  return Array.from(new Set(normalized))
}

function distributeStockBySizes(totalStock: number, sizes: string[]) {
  const safeSizes = sanitizeSizes(sizes)
  if (safeSizes.length === 0) {
    return {} as Record<string, number>
  }

  const base = Math.floor(totalStock / safeSizes.length)
  const remainder = totalStock % safeSizes.length
  return Object.fromEntries(
    safeSizes.map((size, index) => [size, base + (index < remainder ? 1 : 0)]),
  )
}

function normalizeSizeStock(rawSizeStock: unknown, fallbackSizes: string[], fallbackTotalStock: number) {
  const parsed =
    rawSizeStock && typeof rawSizeStock === 'object' && !Array.isArray(rawSizeStock)
      ? Object.entries(rawSizeStock as Record<string, unknown>).reduce<Record<string, number>>((acc, [size, value]) => {
          const normalizedSize = normalizeSizeLabel(size)
          const numericValue = Number(value)
          if (!normalizedSize || Number.isNaN(numericValue) || numericValue < 0) {
            return acc
          }

          acc[normalizedSize] = Math.floor(numericValue)
          return acc
        }, {})
      : {}

  const fallbackNormalizedSizes = sanitizeSizes(fallbackSizes)
  const withFallbackSizes = fallbackNormalizedSizes.reduce<Record<string, number>>((acc, size) => {
    acc[size] = parsed[size] ?? 0
    return acc
  }, { ...parsed })

  const hasAnyPositive = Object.values(withFallbackSizes).some((value) => value > 0)
  if (hasAnyPositive) {
    return withFallbackSizes
  }

  if (fallbackNormalizedSizes.length > 0) {
    return distributeStockBySizes(Math.max(0, fallbackTotalStock), fallbackNormalizedSizes)
  }

  return {}
}

export const orderService = {
  async createOrder(input: {
    customerId: string
    items: Array<{ productId: number; size?: string; quantity: number }>
    deliveryAddress: string
    recipientName?: string
    recipientPhone?: string
    deliveryDate?: Date
  }) {
    if (input.items.length === 0) {
      throw new HttpError(400, 'Заказ должен содержать хотя бы одну позицию')
    }

    const productIds = input.items.map((item) => item.productId)
    const products = await orderRepository.findProductsByIds(productIds)

    if (products.length !== productIds.length) {
      throw new HttpError(400, 'Некоторые товары не найдены')
    }

    const status = await orderRepository.findStatusByCode('NEW')
    if (!status) {
      throw new HttpError(500, 'Справочник статусов не инициализирован')
    }

    let total = new Prisma.Decimal(0)

    if (input.deliveryDate) {
      const deliveryDate = new Date(input.deliveryDate)
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      if (deliveryDate < now) {
        throw new HttpError(400, 'Дата оформления не может быть в прошлом')
      }
    }

    const inventoryState = new Map(
      products.map((product) => {
        const normalizedSizeStock = normalizeSizeStock(product.sizeStock, product.sizes, product.stock)
        const hasSizeStock = Object.keys(normalizedSizeStock).length > 0
        return [
          product.id,
          {
            stock: product.stock,
            sizeStock: normalizedSizeStock,
            hasSizeStock,
          },
        ]
      }),
    )

    const items = input.items.map((item) => {
      const product = products.find((entry) => entry.id === item.productId)
      if (!product) {
        throw new HttpError(400, 'Товар не найден')
      }

      if (item.quantity <= 0) {
        throw new HttpError(400, 'Количество должно быть больше нуля')
      }

      const productInventory = inventoryState.get(product.id)
      if (!productInventory) {
        throw new HttpError(400, 'Товар не найден')
      }

      if (productInventory.hasSizeStock) {
        const normalizedSize = normalizeSizeLabel(item.size ?? '')
        if (!normalizedSize) {
          throw new HttpError(400, `Для товара ${product.name} необходимо выбрать размер`)
        }

        const availableInSize = productInventory.sizeStock[normalizedSize] ?? 0
        if (item.quantity > availableInSize) {
          throw new HttpError(
            400,
            `Недостаточно товара ${product.name} размера ${normalizedSize}. Доступно: ${availableInSize}`,
          )
        }

        productInventory.sizeStock[normalizedSize] = availableInSize - item.quantity
        productInventory.stock = Object.values(productInventory.sizeStock).reduce((sum, value) => sum + value, 0)
      } else {
        if (item.quantity > productInventory.stock) {
          throw new HttpError(400, `Недостаточно товара ${product.name}. Доступно: ${productInventory.stock}`)
        }

        productInventory.stock -= item.quantity
      }

      const lineTotal = product.price.mul(item.quantity)
      total = total.add(lineTotal)

      return {
        productId: product.id,
        size: item.size,
        quantity: item.quantity,
        unitPrice: product.price,
      }
    })

    const inventoryUpdates = products.map((product) => {
      const productInventory = inventoryState.get(product.id)
      if (!productInventory) {
        throw new HttpError(400, 'Товар не найден')
      }

      return {
        productId: product.id,
        stock: Math.max(0, productInventory.stock),
        sizeStock: productInventory.sizeStock,
      }
    })

    const order = await orderRepository.createOrderWithInventoryUpdates({
      customerId: input.customerId,
      statusId: status.id,
      total,
      deliveryAddress: input.deliveryAddress,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      deliveryDate: input.deliveryDate,
      items,
      inventoryUpdates,
    })

    await auditRepository.create({
      userId: input.customerId,
      action: 'ORDER_CREATE',
      entity: 'Order',
      entityId: order.id,
      result: 'SUCCESS',
      metadata: { itemsCount: items.length, total: total.toString() },
    })

    return order
  },

  listMyOrders(customerId: string) {
    return orderRepository.listByCustomer(customerId)
  },

  async getOrderForUser(input: { orderId: string; userId: string; role?: string }) {
    const order = await orderRepository.findById(input.orderId)

    if (!order) {
      throw new HttpError(404, 'Заказ не найден')
    }

    const canAccessAny = ['ADMIN', 'MANAGER', 'OPERATOR'].includes(input.role ?? '')
    if (!canAccessAny && order.customerId !== input.userId) {
      throw new HttpError(403, 'Недостаточно прав для просмотра заказа')
    }

    return order
  },

  async attachPaymentToOrder(input: {
    orderId: string
    paymentId: string
    paymentStatus?: string
    actorUserId: string
  }) {
    const order = await orderRepository.attachPayment(input.orderId, input.paymentId, input.paymentStatus)

    await auditRepository.create({
      userId: input.actorUserId,
      action: 'ORDER_PAYMENT_ATTACH',
      entity: 'Order',
      entityId: input.orderId,
      result: 'SUCCESS',
      metadata: { paymentId: input.paymentId, paymentStatus: input.paymentStatus },
    })

    return order
  },

  async processPaymentWebhook(input: {
    paymentId: string
    paymentStatus: string
    eventType: string
    metadataOrderId?: string
  }) {
    const order =
      (input.metadataOrderId ? await orderRepository.findById(input.metadataOrderId) : null) ??
      (await orderRepository.findByPaymentId(input.paymentId))

    if (!order) {
      return null
    }

    let nextStatusCode: 'APPROVED' | 'REJECTED' | null = null
    if (input.paymentStatus === 'succeeded') {
      nextStatusCode = 'APPROVED'
    } else if (input.paymentStatus === 'canceled') {
      nextStatusCode = 'REJECTED'
    }

    const statusRecord = nextStatusCode ? await orderRepository.findStatusByCode(nextStatusCode) : null

    const updatedOrder = await orderRepository.updatePaymentAndStatus(order.id, {
      paymentStatus: input.paymentStatus,
      statusId: statusRecord?.id,
    })

    await auditRepository.create({
      action: 'ORDER_PAYMENT_WEBHOOK',
      entity: 'Order',
      entityId: order.id,
      result: 'SUCCESS',
      metadata: {
        paymentId: input.paymentId,
        paymentStatus: input.paymentStatus,
        eventType: input.eventType,
        mappedStatus: nextStatusCode,
      },
    })

    return updatedOrder
  },

  async updateOrderStatus(input: {
    orderId: string
    statusCode: string
    operatorId: string
  }) {
    const status = await orderRepository.findStatusByCode(input.statusCode)
    if (!status) {
      throw new HttpError(400, 'Неизвестный статус')
    }

    const order = await orderRepository.updateStatus(input.orderId, status.id, input.operatorId)

    await auditRepository.create({
      userId: input.operatorId,
      action: 'ORDER_STATUS_UPDATE',
      entity: 'Order',
      entityId: input.orderId,
      result: 'SUCCESS',
      metadata: { statusCode: input.statusCode },
    })

    return order
  },
}