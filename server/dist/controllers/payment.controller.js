"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = void 0;
const zod_1 = require("zod");
const order_service_1 = require("../services/order.service");
const yooKassaWebhookSchema = zod_1.z.object({
    event: zod_1.z.string().min(1),
    object: zod_1.z.object({
        id: zod_1.z.string().min(1),
        status: zod_1.z.string().min(1),
        metadata: zod_1.z
            .object({
            orderId: zod_1.z.string().min(1).optional(),
        })
            .optional(),
    }),
});
exports.paymentController = {
    async handleYooKassaWebhook(request, response) {
        const payload = yooKassaWebhookSchema.parse(request.body);
        await order_service_1.orderService.processPaymentWebhook({
            paymentId: payload.object.id,
            paymentStatus: payload.object.status,
            eventType: payload.event,
            metadataOrderId: payload.object.metadata?.orderId,
        });
        response.status(200).json({ ok: true });
    },
};
