"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopController = void 0;
const zod_1 = require("zod");
const shop_service_1 = require("../services/shop.service");
const productIdParamSchema = zod_1.z.object({
    productId: zod_1.z.coerce.number().int().positive(),
});
const productReferenceParamSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1),
});
const cartBodySchema = zod_1.z.object({
    productId: zod_1.z.number().int().positive(),
    size: zod_1.z.string().trim().min(1),
    quantity: zod_1.z.number().int().positive(),
});
const cartUpdateBodySchema = zod_1.z.object({
    size: zod_1.z.string().trim().min(1),
    quantity: zod_1.z.number().int(),
});
const applyPromoBodySchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(1),
});
const promoIdParamSchema = zod_1.z.object({
    promoId: zod_1.z.coerce.number().int().positive(),
});
const promoBaseSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(1),
    title: zod_1.z.string().trim().min(1),
    description: zod_1.z.string().trim().optional(),
    discountType: zod_1.z.enum(['PERCENT', 'FIXED']),
    discountValue: zod_1.z.number().positive(),
    minSubtotal: zod_1.z.number().nonnegative().nullable().optional(),
    maxDiscount: zod_1.z.number().positive().nullable().optional(),
    usageLimit: zod_1.z.number().int().positive().nullable().optional(),
    perUserLimit: zod_1.z.number().int().positive().nullable().optional(),
    startsAt: zod_1.z.string().datetime().nullable().optional(),
    endsAt: zod_1.z.string().datetime().nullable().optional(),
    isActive: zod_1.z.boolean().optional(),
});
const promoCreateSchema = promoBaseSchema;
const promoUpdateSchema = promoBaseSchema.partial();
const productBaseSchema = zod_1.z.object({
    sku: zod_1.z.string().trim().min(1),
    name: zod_1.z.string().trim().min(1),
    description: zod_1.z.string().trim().optional(),
    image: zod_1.z.string().trim().url().optional(),
    price: zod_1.z.number().positive(),
    oldPrice: zod_1.z.number().nonnegative().nullable().optional(),
    isSale: zod_1.z.boolean().optional(),
    isNew: zod_1.z.boolean().optional(),
    sizes: zod_1.z.array(zod_1.z.string().trim().min(1)).optional(),
    sizeStock: zod_1.z.record(zod_1.z.string().trim().min(1), zod_1.z.number().int().nonnegative()).optional(),
    color: zod_1.z.string().trim().optional(),
    material: zod_1.z.string().trim().optional(),
    gender: zod_1.z.string().trim().optional(),
    season: zod_1.z.string().trim().optional(),
    brand: zod_1.z.string().trim().optional(),
    stock: zod_1.z.number().int().nonnegative().optional(),
    categoryId: zod_1.z.number().int().positive().nullable().optional(),
});
const productCreateSchema = productBaseSchema;
const productUpdateSchema = productBaseSchema.partial();
exports.shopController = {
    async listCategories(_request, response, next) {
        try {
            const categories = await shop_service_1.shopService.listCategories();
            response.json(categories);
        }
        catch (error) {
            next(error);
        }
    },
    async listProducts(_request, response, next) {
        try {
            const products = await shop_service_1.shopService.listProducts();
            response.json(products);
        }
        catch (error) {
            next(error);
        }
    },
    async getProductById(request, response, next) {
        try {
            const { productId } = productReferenceParamSchema.parse(request.params);
            const product = await shop_service_1.shopService.getProductByReference(productId);
            response.json(product);
        }
        catch (error) {
            next(error);
        }
    },
    async createProduct(request, response, next) {
        try {
            const body = productCreateSchema.parse(request.body);
            const product = await shop_service_1.shopService.createProduct(request.user.userId, body);
            response.status(201).json(product);
        }
        catch (error) {
            next(error);
        }
    },
    async updateProduct(request, response, next) {
        try {
            const { productId } = productIdParamSchema.parse(request.params);
            const body = productUpdateSchema.parse(request.body);
            const product = await shop_service_1.shopService.updateProduct(request.user.userId, productId, body);
            response.json(product);
        }
        catch (error) {
            next(error);
        }
    },
    async deleteProduct(request, response, next) {
        try {
            const { productId } = productIdParamSchema.parse(request.params);
            await shop_service_1.shopService.deleteProduct(request.user.userId, productId);
            response.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
    async listFavorites(request, response, next) {
        try {
            const favorites = await shop_service_1.shopService.listFavorites(request.user.userId);
            response.json(favorites);
        }
        catch (error) {
            next(error);
        }
    },
    async addFavorite(request, response, next) {
        try {
            const body = zod_1.z.object({ productId: zod_1.z.number().int().positive(), size: zod_1.z.string().trim().min(1) }).parse(request.body);
            const favorite = await shop_service_1.shopService.addFavorite(request.user.userId, body.productId, body.size);
            response.status(201).json(favorite);
        }
        catch (error) {
            next(error);
        }
    },
    async removeFavorite(request, response, next) {
        try {
            const { productId } = productIdParamSchema.parse(request.params);
            const query = zod_1.z.object({ size: zod_1.z.string().trim().min(1).optional() }).parse(request.query);
            await shop_service_1.shopService.removeFavorite(request.user.userId, productId, query.size);
            response.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
    async listCart(request, response, next) {
        try {
            const cart = await shop_service_1.shopService.listCart(request.user.userId);
            response.json(cart);
        }
        catch (error) {
            next(error);
        }
    },
    async addToCart(request, response, next) {
        try {
            const body = cartBodySchema.parse(request.body);
            const cart = await shop_service_1.shopService.addToCart(request.user.userId, body);
            response.status(201).json(cart);
        }
        catch (error) {
            next(error);
        }
    },
    async updateCartItem(request, response, next) {
        try {
            const { productId } = productIdParamSchema.parse(request.params);
            const body = cartUpdateBodySchema.parse(request.body);
            const cart = await shop_service_1.shopService.updateCartItem(request.user.userId, {
                productId,
                size: body.size,
                quantity: body.quantity,
            });
            response.json(cart);
        }
        catch (error) {
            next(error);
        }
    },
    async removeFromCart(request, response, next) {
        try {
            const { productId } = productIdParamSchema.parse(request.params);
            const query = zod_1.z.object({ size: zod_1.z.string().trim().min(1).optional() }).parse(request.query);
            const cart = await shop_service_1.shopService.removeFromCart(request.user.userId, productId, query.size);
            response.json(cart);
        }
        catch (error) {
            next(error);
        }
    },
    async applyPromo(request, response, next) {
        try {
            const body = applyPromoBodySchema.parse(request.body);
            const cart = await shop_service_1.shopService.applyPromoToCart(request.user.userId, body.code);
            response.json(cart);
        }
        catch (error) {
            next(error);
        }
    },
    async clearPromo(request, response, next) {
        try {
            const cart = await shop_service_1.shopService.clearPromoFromCart(request.user.userId);
            response.json(cart);
        }
        catch (error) {
            next(error);
        }
    },
    async listPromoCodes(_request, response, next) {
        try {
            const promoCodes = await shop_service_1.shopService.listPromoCodes();
            response.json(promoCodes);
        }
        catch (error) {
            next(error);
        }
    },
    async createPromoCode(request, response, next) {
        try {
            const body = promoCreateSchema.parse(request.body);
            const promo = await shop_service_1.shopService.createPromoCode({
                ...body,
                startsAt: body.startsAt ? new Date(body.startsAt) : null,
                endsAt: body.endsAt ? new Date(body.endsAt) : null,
            });
            response.status(201).json(promo);
        }
        catch (error) {
            next(error);
        }
    },
    async updatePromoCode(request, response, next) {
        try {
            const { promoId } = promoIdParamSchema.parse(request.params);
            const body = promoUpdateSchema.parse(request.body);
            const promo = await shop_service_1.shopService.updatePromoCode(promoId, {
                ...body,
                startsAt: body.startsAt === undefined ? undefined : body.startsAt ? new Date(body.startsAt) : null,
                endsAt: body.endsAt === undefined ? undefined : body.endsAt ? new Date(body.endsAt) : null,
            });
            response.json(promo);
        }
        catch (error) {
            next(error);
        }
    },
    async deletePromoCode(request, response, next) {
        try {
            const { promoId } = promoIdParamSchema.parse(request.params);
            await shop_service_1.shopService.deletePromoCode(promoId);
            response.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
};
