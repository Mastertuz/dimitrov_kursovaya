import { Request, Response } from 'express'
import { z } from 'zod'
import { orderService } from '../services/order.service'

const yooKassaWebhookSchema = z.object({
  event: z.string().min(1),
  object: z.object({
    id: z.string().min(1),
    status: z.string().min(1),
    metadata: z
      .object({
        orderId: z.string().min(1).optional(),
      })
      .optional(),
  }),
})

export const paymentController = {
  async handleYooKassaWebhook(request: Request, response: Response) {
    const payload = yooKassaWebhookSchema.parse(request.body)

    await orderService.processPaymentWebhook({
      paymentId: payload.object.id,
      paymentStatus: payload.object.status,
      eventType: payload.event,
      metadataOrderId: payload.object.metadata?.orderId,
    })

    response.status(200).json({ ok: true })
  },
}
