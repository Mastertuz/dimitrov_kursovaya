"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRepository = void 0;
const prisma_1 = require("../utils/prisma");
exports.orderRepository = {
    findStatusByCode(code) {
        return prisma_1.prisma.status.findUnique({ where: { code } });
    },
    findProductsByIds(productIds) {
        return prisma_1.prisma.product.findMany({
            where: { id: { in: productIds } },
        });
    },
    createOrder(data) {
        return prisma_1.prisma.order.create({
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
        });
    },
    createOrderWithInventoryUpdates(data) {
        return prisma_1.prisma.$transaction(async (tx) => {
            for (const update of data.inventoryUpdates) {
                await tx.product.update({
                    where: { id: update.productId },
                    data: {
                        stock: update.stock,
                        sizeStock: update.sizeStock,
                    },
                });
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
            });
        });
    },
    listByCustomer(customerId) {
        return prisma_1.prisma.order.findMany({
            where: { customerId },
            include: {
                status: true,
                items: { include: { product: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    },
    listProfileStatsByCustomer(customerId) {
        return prisma_1.prisma.order.findMany({
            where: { customerId },
            select: {
                createdAt: true,
                total: true,
                status: { select: { code: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    },
    updateStatus(orderId, statusId, operatorId) {
        return prisma_1.prisma.order.update({
            where: { id: orderId },
            data: {
                statusId,
                operatorId,
            },
            include: {
                status: true,
                items: { include: { product: true } },
            },
        });
    },
    findById(orderId) {
        return prisma_1.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                status: true,
                items: { include: { product: true } },
            },
        });
    },
    findByPaymentId(paymentId) {
        return prisma_1.prisma.order.findFirst({
            where: { paymentId },
            include: {
                status: true,
                items: { include: { product: true } },
            },
        });
    },
    attachPayment(orderId, paymentId, paymentStatus) {
        return prisma_1.prisma.order.update({
            where: { id: orderId },
            data: {
                paymentId,
                paymentStatus,
            },
            include: {
                status: true,
                items: { include: { product: true } },
            },
        });
    },
    updatePaymentAndStatus(orderId, data) {
        return prisma_1.prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: data.paymentStatus,
                ...(data.statusId ? { statusId: data.statusId } : {}),
            },
            include: {
                status: true,
                items: { include: { product: true } },
            },
        });
    },
    findRecent(count) {
        return prisma_1.prisma.order.findMany({
            take: count,
            orderBy: { createdAt: 'desc' },
            select: { total: true, createdAt: true },
        });
    },
};
