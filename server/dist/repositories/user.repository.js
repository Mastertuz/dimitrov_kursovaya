"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const prisma_1 = require("../utils/prisma");
exports.userRepository = {
    findByEmail(email) {
        return prisma_1.prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });
    },
    findById(id) {
        return prisma_1.prisma.user.findUnique({
            where: { id },
            include: { role: true },
        });
    },
    create(data) {
        return prisma_1.prisma.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                passwordHash: data.passwordHash,
                roleId: data.roleId,
                status: data.status ?? 'ACTIVE',
            },
            include: { role: true },
        });
    },
    countFavorites(userId) {
        return prisma_1.prisma.favoriteItem.count({ where: { userId } });
    },
    countCartItems(userId) {
        return prisma_1.prisma.cartItem.count({ where: { userId } });
    },
    listForAdmin() {
        return prisma_1.prisma.user.findMany({
            include: {
                role: true,
                _count: {
                    select: {
                        customerOrders: true,
                        favoriteItems: true,
                        cartItems: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    },
};
