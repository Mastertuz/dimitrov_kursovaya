import { randomUUID } from 'crypto'
import { env } from '../config/env'
import { HttpError } from '../middleware/error-handler'

type CreateYooKassaPaymentInput = {
  amount: number
  orderId: string
  userId: string
  description?: string
  returnUrl?: string
}

type YooKassaPaymentResponse = {
  id: string
  status: string
  confirmation?: {
    type: string
    confirmation_url?: string
  }
}

function formatAmount(amount: number) {
  return amount.toFixed(2)
}

function resolveReturnUrl(rawUrl: string | undefined, orderId: string) {
  if (!rawUrl) {
    return undefined
  }

  const orderIdEncoded = encodeURIComponent(orderId)
  const withPlaceholderReplaced = rawUrl
    .replace(/\{\{\s*orderId\s*\}\}/gi, orderIdEncoded)
    .replace(/\{orderId\}/gi, orderIdEncoded)
    .replace(/:orderId/gi, orderIdEncoded)
    .replace(/%7BorderId%7D/gi, orderIdEncoded)

  try {
    const parsedUrl = new URL(withPlaceholderReplaced)
    parsedUrl.searchParams.set('orderId', orderId)
    return parsedUrl.toString()
  } catch {
    if (/([?&])orderId=/i.test(withPlaceholderReplaced)) {
      return withPlaceholderReplaced.replace(/([?&]orderId=)[^&]*/i, `$1${orderIdEncoded}`)
    }

    return `${withPlaceholderReplaced}${withPlaceholderReplaced.includes('?') ? '&' : '?'}orderId=${orderIdEncoded}`
  }
}

export const paymentService = {
  async createYooKassaPayment(input: CreateYooKassaPaymentInput) {
    if (!env.YOOKASSA_SHOP_ID || !env.YOOKASSA_SECRET_KEY) {
      throw new HttpError(500, 'Не настроены реквизиты YooKassa')
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new HttpError(400, 'Сумма оплаты должна быть больше нуля')
    }

    const credentials = Buffer.from(`${env.YOOKASSA_SHOP_ID}:${env.YOOKASSA_SECRET_KEY}`).toString('base64')
    const returnUrl =
      resolveReturnUrl(input.returnUrl?.trim(), input.orderId) ||
      resolveReturnUrl(env.YOOKASSA_RETURN_URL, input.orderId) ||
      `${env.FRONTEND_URL}/orders`

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
        'Idempotence-Key': randomUUID(),
      },
      body: JSON.stringify({
        amount: {
          value: formatAmount(input.amount),
          currency: 'RUB',
        },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: returnUrl,
        },
        description: input.description ?? `Оплата заказа ${input.orderId}`,
        metadata: {
          orderId: input.orderId,
          userId: input.userId,
        },
      }),
    })

    if (!response.ok) {
      const errorPayload = await response.text()
      throw new HttpError(502, `Ошибка создания платежа YooKassa: ${errorPayload || response.statusText}`)
    }

    const payload = (await response.json()) as YooKassaPaymentResponse
    const confirmationUrl = payload.confirmation?.confirmation_url

    if (!confirmationUrl) {
      throw new HttpError(502, 'YooKassa не вернула ссылку на оплату')
    }

    return {
      paymentId: payload.id,
      status: payload.status,
      confirmationUrl,
    }
  },
}
