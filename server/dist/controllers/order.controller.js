"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = void 0;
const zod_1 = require("zod");
const order_service_1 = require("../services/order.service");
const payment_service_1 = require("../services/payment.service");
const recipientNameSchema = zod_1.z
    .string()
    .trim()
    .min(2, 'Имя получателя должно содержать минимум 2 символа')
    .regex(/^[A-Za-zА-Яа-яЁё\s]+$/, 'Имя получателя может содержать только буквы и пробелы');
const recipientPhoneSchema = zod_1.z
    .string()
    .trim()
    .regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, 'Телефон должен быть в формате +7 (999) 123-12-12');
const createOrderSchema = zod_1.z.object({
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.number().int().positive(),
        size: zod_1.z.string().trim().min(1).optional(),
        quantity: zod_1.z.number().int().positive(),
    }))
        .min(1),
    deliveryAddress: zod_1.z.string().trim().min(5, 'Укажите адрес доставки'),
    recipientName: recipientNameSchema.optional(),
    recipientPhone: recipientPhoneSchema.optional(),
    deliveryDate: zod_1.z.string().datetime().optional(),
});
const checkoutSchema = createOrderSchema.extend({
    returnUrl: zod_1.z.string().trim().url().optional(),
});
const updateStatusSchema = zod_1.z.object({
    statusCode: zod_1.z.enum(['NEW', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'CLOSED']),
});
exports.orderController = {
    async create(request, response, next) {
        try {
            const body = createOrderSchema.parse(request.body);
            const order = await order_service_1.orderService.createOrder({
                customerId: request.user.userId,
                items: body.items,
                deliveryAddress: body.deliveryAddress,
                recipientName: body.recipientName,
                recipientPhone: body.recipientPhone,
                deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
            });
            response.status(201).json(order);
        }
        catch (error) {
            next(error);
        }
    },
    async myOrders(request, response, next) {
        try {
            const orders = await order_service_1.orderService.listMyOrders(request.user.userId);
            response.json(orders);
        }
        catch (error) {
            next(error);
        }
    },
    async getById(request, response, next) {
        try {
            const { orderId } = zod_1.z.object({ orderId: zod_1.z.string().min(1) }).parse(request.params);
            const order = await order_service_1.orderService.getOrderForUser({
                orderId,
                userId: request.user.userId,
                role: request.user.role,
            });
            response.json(order);
        }
        catch (error) {
            next(error);
        }
    },
    async checkoutWithPayment(request, response, next) {
        try {
            const body = checkoutSchema.parse(request.body);
            const order = await order_service_1.orderService.createOrder({
                customerId: request.user.userId,
                items: body.items,
                deliveryAddress: body.deliveryAddress,
                recipientName: body.recipientName,
                recipientPhone: body.recipientPhone,
                deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
            });
            const payment = await payment_service_1.paymentService.createYooKassaPayment({
                amount: Number(order.total),
                orderId: order.id,
                userId: request.user.userId,
                returnUrl: body.returnUrl,
                description: `Оплата заказа ${order.id}`,
            });
            await order_service_1.orderService.attachPaymentToOrder({
                orderId: order.id,
                paymentId: payment.paymentId,
                paymentStatus: payment.status,
                actorUserId: request.user.userId,
            });
            response.status(201).json({
                orderId: order.id,
                paymentId: payment.paymentId,
                paymentStatus: payment.status,
                confirmationUrl: payment.confirmationUrl,
            });
        }
        catch (error) {
            next(error);
        }
    },
    async updateStatus(request, response, next) {
        try {
            const { orderId } = zod_1.z.object({ orderId: zod_1.z.string().min(1) }).parse(request.params);
            const body = updateStatusSchema.parse(request.body);
            const order = await order_service_1.orderService.updateOrderStatus({
                orderId,
                statusCode: body.statusCode,
                operatorId: request.user.userId,
            });
            response.json(order);
        }
        catch (error) {
            next(error);
        }
    },
};
