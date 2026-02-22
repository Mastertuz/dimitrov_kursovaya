"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = void 0;
const client_1 = require("@prisma/client");
const order_repository_1 = require("../repositories/order.repository");
const audit_repository_1 = require("../repositories/audit.repository");
const error_handler_1 = require("../middleware/error-handler");
function normalizeSizeLabel(size) {
    return size.trim().toUpperCase();
}
function sanitizeSizes(sizes) {
    const normalized = sizes.map(normalizeSizeLabel).filter(Boolean);
    return Array.from(new Set(normalized));
}
function distributeStockBySizes(totalStock, sizes) {
    const safeSizes = sanitizeSizes(sizes);
    if (safeSizes.length === 0) {
        return {};
    }
    const base = Math.floor(totalStock / safeSizes.length);
    const remainder = totalStock % safeSizes.length;
    return Object.fromEntries(safeSizes.map((size, index) => [size, base + (index < remainder ? 1 : 0)]));
}
function normalizeSizeStock(rawSizeStock, fallbackSizes, fallbackTotalStock) {
    const parsed = rawSizeStock && typeof rawSizeStock === 'object' && !Array.isArray(rawSizeStock)
        ? Object.entries(rawSizeStock).reduce((acc, [size, value]) => {
            const normalizedSize = normalizeSizeLabel(size);
            const numericValue = Number(value);
            if (!normalizedSize || Number.isNaN(numericValue) || numericValue < 0) {
                return acc;
            }
            acc[normalizedSize] = Math.floor(numericValue);
            return acc;
        }, {})
        : {};
    const fallbackNormalizedSizes = sanitizeSizes(fallbackSizes);
    const withFallbackSizes = fallbackNormalizedSizes.reduce((acc, size) => {
        acc[size] = parsed[size] ?? 0;
        return acc;
    }, { ...parsed });
    const hasAnyPositive = Object.values(withFallbackSizes).some((value) => value > 0);
    if (hasAnyPositive) {
        return withFallbackSizes;
    }
    if (fallbackNormalizedSizes.length > 0) {
        return distributeStockBySizes(Math.max(0, fallbackTotalStock), fallbackNormalizedSizes);
    }
    return {};
}
exports.orderService = {
    async createOrder(input) {
        if (input.items.length === 0) {
            throw new error_handler_1.HttpError(400, 'Заказ должен содержать хотя бы одну позицию');
        }
        const productIds = input.items.map((item) => item.productId);
        const products = await order_repository_1.orderRepository.findProductsByIds(productIds);
        if (products.length !== productIds.length) {
            throw new error_handler_1.HttpError(400, 'Некоторые товары не найдены');
        }
        const status = await order_repository_1.orderRepository.findStatusByCode('NEW');
        if (!status) {
            throw new error_handler_1.HttpError(500, 'Справочник статусов не инициализирован');
        }
        let total = new client_1.Prisma.Decimal(0);
        if (input.deliveryDate) {
            const deliveryDate = new Date(input.deliveryDate);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            if (deliveryDate < now) {
                throw new error_handler_1.HttpError(400, 'Дата оформления не может быть в прошлом');
            }
        }
        const inventoryState = new Map(products.map((product) => {
            const normalizedSizeStock = normalizeSizeStock(product.sizeStock, product.sizes, product.stock);
            const hasSizeStock = Object.keys(normalizedSizeStock).length > 0;
            return [
                product.id,
                {
                    stock: product.stock,
                    sizeStock: normalizedSizeStock,
                    hasSizeStock,
                },
            ];
        }));
        const items = input.items.map((item) => {
            const product = products.find((entry) => entry.id === item.productId);
            if (!product) {
                throw new error_handler_1.HttpError(400, 'Товар не найден');
            }
            if (item.quantity <= 0) {
                throw new error_handler_1.HttpError(400, 'Количество должно быть больше нуля');
            }
            const productInventory = inventoryState.get(product.id);
            if (!productInventory) {
                throw new error_handler_1.HttpError(400, 'Товар не найден');
            }
            if (productInventory.hasSizeStock) {
                const normalizedSize = normalizeSizeLabel(item.size ?? '');
                if (!normalizedSize) {
                    throw new error_handler_1.HttpError(400, `Для товара ${product.name} необходимо выбрать размер`);
                }
                const availableInSize = productInventory.sizeStock[normalizedSize] ?? 0;
                if (item.quantity > availableInSize) {
                    throw new error_handler_1.HttpError(400, `Недостаточно товара ${product.name} размера ${normalizedSize}. Доступно: ${availableInSize}`);
                }
                productInventory.sizeStock[normalizedSize] = availableInSize - item.quantity;
                productInventory.stock = Object.values(productInventory.sizeStock).reduce((sum, value) => sum + value, 0);
            }
            else {
                if (item.quantity > productInventory.stock) {
                    throw new error_handler_1.HttpError(400, `Недостаточно товара ${product.name}. Доступно: ${productInventory.stock}`);
                }
                productInventory.stock -= item.quantity;
            }
            const lineTotal = product.price.mul(item.quantity);
            total = total.add(lineTotal);
            return {
                productId: product.id,
                size: item.size,
                quantity: item.quantity,
                unitPrice: product.price,
            };
        });
        const inventoryUpdates = products.map((product) => {
            const productInventory = inventoryState.get(product.id);
            if (!productInventory) {
                throw new error_handler_1.HttpError(400, 'Товар не найден');
            }
            return {
                productId: product.id,
                stock: Math.max(0, productInventory.stock),
                sizeStock: productInventory.sizeStock,
            };
        });
        const order = await order_repository_1.orderRepository.createOrderWithInventoryUpdates({
            customerId: input.customerId,
            statusId: status.id,
            total,
            deliveryAddress: input.deliveryAddress,
            recipientName: input.recipientName,
            recipientPhone: input.recipientPhone,
            deliveryDate: input.deliveryDate,
            items,
            inventoryUpdates,
        });
        await audit_repository_1.auditRepository.create({
            userId: input.customerId,
            action: 'ORDER_CREATE',
            entity: 'Order',
            entityId: order.id,
            result: 'SUCCESS',
            metadata: { itemsCount: items.length, total: total.toString() },
        });
        return order;
    },
    listMyOrders(customerId) {
        return order_repository_1.orderRepository.listByCustomer(customerId);
    },
    async getOrderForUser(input) {
        const order = await order_repository_1.orderRepository.findById(input.orderId);
        if (!order) {
            throw new error_handler_1.HttpError(404, 'Заказ не найден');
        }
        const canAccessAny = ['ADMIN', 'MANAGER', 'OPERATOR'].includes(input.role ?? '');
        if (!canAccessAny && order.customerId !== input.userId) {
            throw new error_handler_1.HttpError(403, 'Недостаточно прав для просмотра заказа');
        }
        return order;
    },
    async attachPaymentToOrder(input) {
        const order = await order_repository_1.orderRepository.attachPayment(input.orderId, input.paymentId, input.paymentStatus);
        await audit_repository_1.auditRepository.create({
            userId: input.actorUserId,
            action: 'ORDER_PAYMENT_ATTACH',
            entity: 'Order',
            entityId: input.orderId,
            result: 'SUCCESS',
            metadata: { paymentId: input.paymentId, paymentStatus: input.paymentStatus },
        });
        return order;
    },
    async processPaymentWebhook(input) {
        const order = (input.metadataOrderId ? await order_repository_1.orderRepository.findById(input.metadataOrderId) : null) ??
            (await order_repository_1.orderRepository.findByPaymentId(input.paymentId));
        if (!order) {
            return null;
        }
        let nextStatusCode = null;
        if (input.paymentStatus === 'succeeded') {
            nextStatusCode = 'APPROVED';
        }
        else if (input.paymentStatus === 'canceled') {
            nextStatusCode = 'REJECTED';
        }
        const statusRecord = nextStatusCode ? await order_repository_1.orderRepository.findStatusByCode(nextStatusCode) : null;
        const updatedOrder = await order_repository_1.orderRepository.updatePaymentAndStatus(order.id, {
            paymentStatus: input.paymentStatus,
            statusId: statusRecord?.id,
        });
        await audit_repository_1.auditRepository.create({
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
        });
        return updatedOrder;
    },
    async updateOrderStatus(input) {
        const status = await order_repository_1.orderRepository.findStatusByCode(input.statusCode);
        if (!status) {
            throw new error_handler_1.HttpError(400, 'Неизвестный статус');
        }
        const order = await order_repository_1.orderRepository.updateStatus(input.orderId, status.id, input.operatorId);
        await audit_repository_1.auditRepository.create({
            userId: input.operatorId,
            action: 'ORDER_STATUS_UPDATE',
            entity: 'Order',
            entityId: input.orderId,
            result: 'SUCCESS',
            metadata: { statusCode: input.statusCode },
        });
        return order;
    },
};
