"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../utils/prisma");
const user_repository_1 = require("../repositories/user.repository");
const order_repository_1 = require("../repositories/order.repository");
const audit_repository_1 = require("../repositories/audit.repository");
const error_handler_1 = require("../middleware/error-handler");
const env_1 = require("../config/env");
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: '12h' });
}
exports.authService = {
    async listUsers() {
        const users = await user_repository_1.userRepository.listForAdmin();
        return users.map((user) => ({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role.code,
            status: user.status,
            createdAt: user.createdAt,
            stats: {
                ordersCount: user._count.customerOrders,
                favoritesCount: user._count.favoriteItems,
                cartItemsCount: user._count.cartItems,
            },
        }));
    },
    async register(input) {
        const normalizedEmail = input.email.trim().toLowerCase();
        const existingUser = await user_repository_1.userRepository.findByEmail(normalizedEmail);
        if (existingUser) {
            throw new error_handler_1.HttpError(409, 'Пользователь с таким email уже существует');
        }
        const roleCode = input.roleCode ?? 'CLIENT';
        const role = await prisma_1.prisma.role.findUnique({ where: { code: roleCode } });
        if (!role) {
            throw new error_handler_1.HttpError(400, 'Указана несуществующая роль');
        }
        const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
        const user = await user_repository_1.userRepository.create({
            fullName: input.fullName,
            email: normalizedEmail,
            passwordHash,
            roleId: role.id,
        });
        await audit_repository_1.auditRepository.create({
            userId: user.id,
            action: 'REGISTER',
            entity: 'User',
            entityId: user.id,
            result: 'SUCCESS',
        });
        const token = signToken({ userId: user.id, email: user.email, role: user.role.code });
        return {
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role.code,
            },
        };
    },
    async login(input) {
        const normalizedEmail = input.email.trim().toLowerCase();
        const user = await user_repository_1.userRepository.findByEmail(normalizedEmail);
        if (!user) {
            throw new error_handler_1.HttpError(401, 'Неверный логин или пароль');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(input.password, user.passwordHash);
        if (!isPasswordValid) {
            await audit_repository_1.auditRepository.create({
                userId: user.id,
                action: 'LOGIN',
                entity: 'User',
                entityId: user.id,
                result: 'FAILED',
            });
            throw new error_handler_1.HttpError(401, 'Неверный логин или пароль');
        }
        if (user.status !== 'ACTIVE') {
            throw new error_handler_1.HttpError(403, 'Учетная запись заблокирована');
        }
        await audit_repository_1.auditRepository.create({
            userId: user.id,
            action: 'LOGIN',
            entity: 'User',
            entityId: user.id,
            result: 'SUCCESS',
        });
        const token = signToken({ userId: user.id, email: user.email, role: user.role.code });
        return {
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role.code,
            },
        };
    },
    async me(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new error_handler_1.HttpError(404, 'Пользователь не найден');
        }
        const [orders, favoritesCount, cartItemsCount] = await Promise.all([
            order_repository_1.orderRepository.listProfileStatsByCustomer(userId),
            user_repository_1.userRepository.countFavorites(userId),
            user_repository_1.userRepository.countCartItems(userId),
        ]);
        const registrationDate = new Date(user.createdAt);
        const ordersSinceRegistration = orders.filter((order) => order.createdAt >= registrationDate);
        const excludedFromSpend = new Set(['REJECTED']);
        const spendOrders = ordersSinceRegistration.filter((order) => !excludedFromSpend.has(order.status.code));
        const totalSpent = spendOrders.reduce((sum, order) => sum + Number(order.total), 0);
        const approvedOrders = ordersSinceRegistration.filter((order) => order.status.code === 'APPROVED' || order.status.code === 'CLOSED').length;
        const rejectedOrders = ordersSinceRegistration.filter((order) => order.status.code === 'REJECTED').length;
        const averageCheck = spendOrders.length > 0 ? totalSpent / spendOrders.length : 0;
        const monthlyBuckets = new Map();
        const now = new Date();
        const startDate = new Date(registrationDate.getFullYear(), registrationDate.getMonth(), 1);
        for (let monthDate = new Date(startDate); monthDate <= now; monthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)) {
            const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = monthDate.toLocaleString('ru-RU', {
                month: 'short',
                year: 'numeric',
            });
            monthlyBuckets.set(key, {
                label: monthLabel,
                amount: 0,
                orders: 0,
            });
        }
        for (const order of spendOrders) {
            const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
            const bucket = monthlyBuckets.get(key);
            if (!bucket) {
                continue;
            }
            bucket.amount += Number(order.total);
            bucket.orders += 1;
        }
        const monthlySpend = Array.from(monthlyBuckets.values()).map((bucket) => ({
            month: bucket.label,
            amount: Number(bucket.amount.toFixed(2)),
            orders: bucket.orders,
        }));
        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role.code,
            status: user.status,
            createdAt: user.createdAt,
            stats: {
                totalOrders: ordersSinceRegistration.length,
                approvedOrders,
                rejectedOrders,
                totalSpent: Number(totalSpent.toFixed(2)),
                averageCheck: Number(averageCheck.toFixed(2)),
                lastOrderAt: ordersSinceRegistration[0]?.createdAt ?? null,
                favoritesCount,
                cartItemsCount,
                monthlySpend,
            },
        };
    },
};
