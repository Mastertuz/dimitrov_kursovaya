import { prisma } from '../utils/prisma'
import { orderRepository } from '../repositories/order.repository'

export const aiService = {
  async forecastRevenue(input: { window: number; authorId?: string }) {
    const window = Math.max(3, Math.min(input.window, 60))
    const orders = await orderRepository.findRecent(window)

    const values = orders.map((order) => Number(order.total))
    const sum = values.reduce((accumulator, value) => accumulator + value, 0)
    const predictedValue = values.length > 0 ? Number((sum / values.length).toFixed(2)) : 0

    await prisma.aiDataPoint.create({
      data: {
        featureSet: {
          source: 'orders',
          window,
          values,
        },
        target: predictedValue,
      },
    })

    const forecast = await prisma.aiForecast.create({
      data: {
        inputWindow: window,
        predictedValue,
        authorId: input.authorId,
        explanation:
          'Прогноз рассчитан как среднее значение сумм последних заказов (базовая модель для этапа MVP).',
      },
    })

    return {
      id: forecast.id,
      predictedValue,
      inputWindow: window,
      explanation: forecast.explanation,
      createdAt: forecast.createdAt,
    }
  },
}