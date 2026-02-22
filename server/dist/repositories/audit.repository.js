"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRepository = void 0;
const prisma_1 = require("../utils/prisma");
exports.auditRepository = {
    create(data) {
        const { userId, action, entity, entityId, result, metadata } = data;
        return prisma_1.prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                result,
                metadata,
                ...(userId ? { user: { connect: { id: userId } } } : {}),
            },
        });
    },
    list(limit = 100) {
        return prisma_1.prisma.auditLog.findMany({
            take: limit,
            include: { user: { select: { id: true, email: true, fullName: true } } },
            orderBy: { createdAt: 'desc' },
        });
    },
};
