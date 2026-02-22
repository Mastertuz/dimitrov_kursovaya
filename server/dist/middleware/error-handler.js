"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
class HttpError extends Error {
    statusCode;
    details;
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'HttpError';
    }
}
exports.HttpError = HttpError;
function errorHandler(error, _req, res, _next) {
    if (error instanceof zod_1.ZodError) {
        return res.status(400).json({
            message: 'Некорректные входные данные',
            details: error.flatten(),
        });
    }
    if (error instanceof HttpError) {
        return res.status(error.statusCode).json({
            message: error.message,
            details: error.details,
        });
    }
    logger_1.logger.error({ error }, 'Unexpected error');
    return res.status(500).json({
        message: 'Внутренняя ошибка сервера',
    });
}
