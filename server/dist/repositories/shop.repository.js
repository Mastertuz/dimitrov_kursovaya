"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopRepository = void 0;
const prisma_1 = require("../utils/prisma");
exports.shopRepository = {
    listCategories() {
        return prisma_1.prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
    },
    listProducts() {
        return prisma_1.prisma.product.findMany({
            include: { category: true },
            orderBy: { createdAt: 'desc' },
        });
    },
    findProductById(productId) {
        return prisma_1.prisma.product.findUnique({
            where: { id: productId },
            include: { category: true },
        });
    },
    findProductBySku(sku) {
        return prisma_1.prisma.product.findUnique({
            where: { sku },
            include: { category: true },
        });
    },
    createProduct(data) {
        return prisma_1.prisma.product.create({
            data,
            include: { category: true },
        });
    },
    updateProduct(productId, data) {
        return prisma_1.prisma.product.update({
            where: { id: productId },
            data,
            include: { category: true },
        });
    },
    deleteProduct(productId) {
        return prisma_1.prisma.product.delete({
            where: { id: productId },
        });
    },
    countProductRelations(productId) {
        return Promise.all([
            prisma_1.prisma.orderItem.count({ where: { productId } }),
            prisma_1.prisma.favoriteItem.count({ where: { productId } }),
            prisma_1.prisma.cartItem.count({ where: { productId } }),
        ]).then(([orderItems, favorites, cartItems]) => ({
            orderItems,
            favorites,
            cartItems,
        }));
    },
    listFavorites(userId) {
        return prisma_1.prisma.favoriteItem.findMany({
            where: { userId },
            include: {
                product: {
                    include: { category: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    },
    addFavorite(userId, productId, size) {
        return prisma_1.prisma.favoriteItem.upsert({
            where: {
                userId_productId_size: {
                    userId,
                    productId,
                    size,
                },
            },
            create: {
                userId,
                productId,
                size,
            },
            update: { size },
            include: {
                product: {
                    include: { category: true },
                },
            },
        });
    },
    removeFavorite(userId, productId, size) {
        return prisma_1.prisma.favoriteItem.deleteMany({
            where: {
                userId,
                productId,
                ...(size ? { size } : {}),
            },
        });
    },
    listCartItems(userId) {
        return prisma_1.prisma.cartItem.findMany({
            where: { userId },
            include: {
                product: {
                    include: { category: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    },
    findCartItem(userId, productId, size) {
        return prisma_1.prisma.cartItem.findUnique({
            where: {
                userId_productId_size: {
                    userId,
                    productId,
                    size,
                },
            },
        });
    },
    createCartItem(userId, productId, size, quantity) {
        return prisma_1.prisma.cartItem.create({
            data: {
                userId,
                productId,
                size,
                quantity,
            },
            include: {
                product: {
                    include: { category: true },
                },
            },
        });
    },
    updateCartItem(userId, productId, size, quantity) {
        return prisma_1.prisma.cartItem.update({
            where: {
                userId_productId_size: {
                    userId,
                    productId,
                    size,
                },
            },
            data: { quantity },
            include: {
                product: {
                    include: { category: true },
                },
            },
        });
    },
    deleteCartItem(userId, productId, size) {
        return prisma_1.prisma.cartItem.deleteMany({
            where: {
                userId,
                productId,
                ...(size ? { size } : {}),
            },
        });
    },
    findPromoByCode(code) {
        return prisma_1.prisma.promoCode.findUnique({
            where: { code },
        });
    },
    countPromoUsage(promoCodeId) {
        return prisma_1.prisma.promoUsage.count({
            where: { promoCodeId },
        });
    },
    countPromoUsageByUser(promoCodeId, userId) {
        return prisma_1.prisma.promoUsage.count({
            where: {
                promoCodeId,
                userId,
            },
        });
    },
    getCartPromo(userId) {
        return prisma_1.prisma.cartPromo.findUnique({
            where: { userId },
            include: { promoCode: true },
        });
    },
    setCartPromo(userId, promoCodeId) {
        return prisma_1.prisma.cartPromo.upsert({
            where: { userId },
            create: {
                userId,
                promoCodeId,
            },
            update: {
                promoCodeId,
                appliedAt: new Date(),
            },
            include: { promoCode: true },
        });
    },
    clearCartPromo(userId) {
        return prisma_1.prisma.cartPromo.deleteMany({
            where: { userId },
        });
    },
    listPromoCodes() {
        return prisma_1.prisma.promoCode.findMany({
            orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
        });
    },
    createPromoCode(data) {
        return prisma_1.prisma.promoCode.create({
            data,
        });
    },
    updatePromoCode(id, data) {
        return prisma_1.prisma.promoCode.update({
            where: { id },
            data,
        });
    },
    deletePromoCode(id) {
        return prisma_1.prisma.promoCode.delete({
            where: { id },
        });
    },
};
