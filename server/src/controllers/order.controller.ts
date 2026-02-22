import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { orderService } from '../services/order.service'
import { paymentService } from '../services/payment.service'

const recipientNameSchema = z
  .string()
  .trim()
  .min(2, 'Имя получателя должно содержать минимум 2 символа')
  .regex(/^[A-Za-zА-Яа-яЁё\s]+$/, 'Имя получателя может содержать только буквы и пробелы')

const recipientPhoneSchema = z
  .string()
  .trim()
  .regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, 'Телефон должен быть в формате +7 (999) 123-12-12')

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        size: z.string().trim().min(1).optional(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  deliveryAddress: z.string().trim().min(5, 'Укажите адрес доставки'),
  recipientName: recipientNameSchema.optional(),
  recipientPhone: recipientPhoneSchema.optional(),
  deliveryDate: z.string().datetime().optional(),
})

const checkoutSchema = createOrderSchema.extend({
  returnUrl: z.string().trim().url().optional(),
})

const updateStatusSchema = z.object({
  statusCode: z.enum(['NEW', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'CLOSED']),
})

export const orderController = {
  async create(request: Request, response: Response, next: NextFunction) {
    try {
      const body = createOrderSchema.parse(request.body)
      const order = await orderService.createOrder({
        customerId: request.user!.userId,
        items: body.items,
        deliveryAddress: body.deliveryAddress,
        recipientName: body.recipientName,
        recipientPhone: body.recipientPhone,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
      })
      response.status(201).json(order)
    } catch (error) {
      next(error)
    }
  },

  async myOrders(request: Request, response: Response, next: NextFunction) {
    try {
      const orders = await orderService.listMyOrders(request.user!.userId)
      response.json(orders)
    } catch (error) {
      next(error)
    }
  },

  async getById(request: Request, response: Response, next: NextFunction) {
    try {
      const { orderId } = z.object({ orderId: z.string().min(1) }).parse(request.params)
      const order = await orderService.getOrderForUser({
        orderId,
        userId: request.user!.userId,
        role: request.user!.role,
      })

      response.json(order)
    } catch (error) {
      next(error)
    }
  },

  async checkoutWithPayment(request: Request, response: Response, next: NextFunction) {
    try {
      const body = checkoutSchema.parse(request.body)

      const order = await orderService.createOrder({
        customerId: request.user!.userId,
        items: body.items,
        deliveryAddress: body.deliveryAddress,
        recipientName: body.recipientName,
        recipientPhone: body.recipientPhone,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
      })

      const payment = await paymentService.createYooKassaPayment({
        amount: Number(order.total),
        orderId: order.id,
        userId: request.user!.userId,
        returnUrl: body.returnUrl,
        description: `Оплата заказа ${order.id}`,
      })

      await orderService.attachPaymentToOrder({
        orderId: order.id,
        paymentId: payment.paymentId,
        paymentStatus: payment.status,
        actorUserId: request.user!.userId,
      })

      response.status(201).json({
        orderId: order.id,
        paymentId: payment.paymentId,
        paymentStatus: payment.status,
        confirmationUrl: payment.confirmationUrl,
      })
    } catch (error) {
      next(error)
    }
  },

  async updateStatus(request: Request, response: Response, next: NextFunction) {
    try {
      const { orderId } = z.object({ orderId: z.string().min(1) }).parse(request.params)
      const body = updateStatusSchema.parse(request.body)

      const order = await orderService.updateOrderStatus({
        orderId,
        statusCode: body.statusCode,
        operatorId: request.user!.userId,
      })

      response.json(order)
    } catch (error) {
      next(error)
    }
  },
}