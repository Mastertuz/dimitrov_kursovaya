"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorizeRoles = authorizeRoles;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const error_handler_1 = require("./error-handler");
const user_repository_1 = require("../repositories/user.repository");
function authenticate(request, _response, next) {
    const authorization = request.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        throw new error_handler_1.HttpError(401, 'Требуется авторизация');
    }
    const token = authorization.replace('Bearer ', '');
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        request.user = payload;
        next();
    }
    catch {
        throw new error_handler_1.HttpError(401, 'Невалидный токен');
    }
}
function authorizeRoles(...roles) {
    return (request, _response, next) => {
        if (!request.user) {
            throw new error_handler_1.HttpError(401, 'Требуется авторизация');
        }
        user_repository_1.userRepository
            .findById(request.user.userId)
            .then((dbUser) => {
            if (!dbUser) {
                throw new error_handler_1.HttpError(401, 'Пользователь не найден');
            }
            request.user.role = dbUser.role.code;
            if (!roles.includes(dbUser.role.code)) {
                throw new error_handler_1.HttpError(403, 'Недостаточно прав');
            }
            next();
        })
            .catch(next);
    };
}
