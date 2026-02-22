"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const pino_http_1 = __importDefault(require("pino-http"));
const env_1 = require("./config/env");
const error_handler_1 = require("./middleware/error-handler");
const routes_1 = require("./routes");
const logger_1 = require("./utils/logger");
function createApp() {
    const app = (0, express_1.default)();
    const allowedOrigins = new Set([
        env_1.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
    ]);
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.has(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('CORS origin not allowed'));
        },
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use((0, morgan_1.default)('combined'));
    app.use((0, pino_http_1.default)({ logger: logger_1.logger }));
    app.use('/api', routes_1.apiRouter);
    app.use(error_handler_1.errorHandler);
    return app;
}
