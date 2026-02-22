"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditController = void 0;
const zod_1 = require("zod");
const audit_repository_1 = require("../repositories/audit.repository");
exports.auditController = {
    async list(request, response, next) {
        try {
            const query = zod_1.z.object({ limit: zod_1.z.coerce.number().min(1).max(500).optional() }).parse(request.query);
            const result = await audit_repository_1.auditRepository.list(query.limit ?? 100);
            response.json(result);
        }
        catch (error) {
            next(error);
        }
    },
};
