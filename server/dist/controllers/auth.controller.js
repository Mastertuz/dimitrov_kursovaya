"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const registerSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    roleCode: zod_1.z.enum(['ADMIN', 'OPERATOR', 'MANAGER', 'CLIENT']).optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
exports.authController = {
    async listUsers(_request, response, next) {
        try {
            const users = await auth_service_1.authService.listUsers();
            response.json(users);
        }
        catch (error) {
            next(error);
        }
    },
    async register(request, response, next) {
        try {
            const body = registerSchema.parse(request.body);
            const result = await auth_service_1.authService.register(body);
            response.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async login(request, response, next) {
        try {
            const body = loginSchema.parse(request.body);
            const result = await auth_service_1.authService.login(body);
            response.json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async me(request, response, next) {
        try {
            const result = await auth_service_1.authService.me(request.user.userId);
            response.json(result);
        }
        catch (error) {
            next(error);
        }
    },
};
