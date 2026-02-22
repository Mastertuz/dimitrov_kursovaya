"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const prisma_1 = require("../utils/prisma");
const order_repository_1 = require("../repositories/order.repository");
exports.aiService = {
    async forecastRevenue(input) {
        const window = Math.max(3, Math.min(input.window, 60));
        const orders = await order_repository_1.orderRepository.findRecent(window);
        const values = orders.map((order) => Number(order.total));
        const sum = values.reduce((accumulator, value) => accumulator + value, 0);
        const predictedValue = values.length > 0 ? Number((sum / values.length).toFixed(2)) : 0;
        await prisma_1.prisma.aiDataPoint.create({
            data: {
                featureSet: {
                    source: 'orders',
                    window,
                    values,
                },
                target: predictedValue,
            },
        });
        const forecast = await prisma_1.prisma.aiForecast.create({
            data: {
                inputWindow: window,
                predictedValue,
                authorId: input.authorId,
                explanation: 'Прогноз рассчитан как среднее значение сумм последних заказов (базовая модель для этапа MVP).',
            },
        });
        return {
            id: forecast.id,
            predictedValue,
            inputWindow: window,
            explanation: forecast.explanation,
            createdAt: forecast.createdAt,
        };
    },
};
