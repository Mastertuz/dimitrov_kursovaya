"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = void 0;
const zod_1 = require("zod");
const ai_service_1 = require("../services/ai.service");
exports.aiController = {
    async forecast(request, response, next) {
        try {
            const query = zod_1.z.object({ window: zod_1.z.coerce.number().min(3).max(60).optional() }).parse(request.query);
            const result = await ai_service_1.aiService.forecastRevenue({
                window: query.window ?? 14,
                authorId: request.user?.userId,
            });
            response.json(result);
        }
        catch (error) {
            next(error);
        }
    },
};
