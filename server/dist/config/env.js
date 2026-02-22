"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)({ path: path_1.default.resolve(__dirname, '../../.env') });
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(8).default('change-me-please'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3000'),
    YOOKASSA_SHOP_ID: zod_1.z.string().optional(),
    YOOKASSA_SECRET_KEY: zod_1.z.string().optional(),
    YOOKASSA_RETURN_URL: zod_1.z.string().optional(),
    ADMIN_EMAIL: zod_1.z.string().email().default('admin@example.com'),
    ADMIN_PASSWORD: zod_1.z.string().min(8).default('Admin123!'),
});
exports.env = envSchema.parse(process.env);
