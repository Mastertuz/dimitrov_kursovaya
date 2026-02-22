"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopService = void 0;
const shop_repository_1 = require("../repositories/shop.repository");
const audit_repository_1 = require("../repositories/audit.repository");
const error_handler_1 = require("../middleware/error-handler");
function categoryNameToKey(categoryName, fallbackId = 0) {
    const categoryKeys = [
        'outerwear',
        'dresses',
        'shirts',
        'tshirts',
        'jeans',
        'pants',
        'knitwear',
        'skirts',
        'accessories',
    ];
    const categoryMap = {
        'верхняя одежда': 'outerwear',
        'платья': 'dresses',
        'рубашки': 'shirts',
        'футболки': 'tshirts',
        'джинсы': 'jeans',
        'брюки': 'pants',
        'трикотаж': 'knitwear',
        'юбки': 'skirts',
        'аксессуары': 'accessories',
    };
    const normalizedCategory = categoryName?.trim().toLowerCase() ?? '';
    return categoryMap[normalizedCategory] ?? categoryKeys[fallbackId % categoryKeys.length];
}
function normalizeSizeLabel(size) {
    return size.trim().toUpperCase();
}
function sanitizeSizes(sizes) {
    const normalized = sizes.map(normalizeSizeLabel).filter(Boolean);
    return Array.from(new Set(normalized));
}
function distributeStockBySizes(totalStock, sizes) {
    const safeSizes = sanitizeSizes(sizes);
    if (safeSizes.length === 0) {
        return {};
    }
    const base = Math.floor(totalStock / safeSizes.length);
    const remainder = totalStock % safeSizes.length;
    return Object.fromEntries(safeSizes.map((size, index) => [size, base + (index < remainder ? 1 : 0)]));
}
function normalizeSizeStock(rawSizeStock, fallbackSizes, fallbackTotalStock) {
    const parsed = rawSizeStock && typeof rawSizeStock === 'object' && !Array.isArray(rawSizeStock)
        ? Object.entries(rawSizeStock).reduce((acc, [size, value]) => {
            const normalizedSize = normalizeSizeLabel(size);
            const numericValue = Number(value);
            if (!normalizedSize || Number.isNaN(numericValue) || numericValue < 0) {
                return acc;
            }
            acc[normalizedSize] = Math.floor(numericValue);
            return acc;
        }, {})
        : {};
    const fallbackNormalizedSizes = sanitizeSizes(fallbackSizes);
    const withFallbackSizes = fallbackNormalizedSizes.reduce((acc, size) => {
        acc[size] = parsed[size] ?? 0;
        return acc;
    }, { ...parsed });
    const hasAnyPositive = Object.values(withFallbackSizes).some((value) => value > 0);
    if (hasAnyPositive) {
        return withFallbackSizes;
    }
    if (fallbackNormalizedSizes.length > 0) {
        return distributeStockBySizes(Math.max(0, fallbackTotalStock), fallbackNormalizedSizes);
    }
    return {};
}
function mapProduct(product) {
    const sizeStock = normalizeSizeStock(product.sizeStock, product.sizes, product.stock);
    const normalizedSizes = Object.keys(sizeStock).length > 0 ? Object.keys(sizeStock) : sanitizeSizes(product.sizes);
    const totalStock = Object.values(sizeStock).reduce((sum, value) => sum + value, 0);
    const categoryKey = categoryNameToKey(product.category?.name, product.id);
    const computedPrice = typeof product.price === 'number'
        ? product.price
        : product.price.toNumber
            ? product.price.toNumber()
            : Number(product.price);
    const computedOldPrice = product.oldPrice == null
        ? undefined
        : typeof product.oldPrice === 'number'
            ? product.oldPrice
            : product.oldPrice.toNumber
                ? product.oldPrice.toNumber()
                : Number(product.oldPrice);
    const availability = totalStock <= 0 ? 'outofstock' : totalStock < 5 ? 'preorder' : 'instock';
    return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description ?? undefined,
        price: computedPrice,
        oldPrice: computedOldPrice,
        isSale: product.isSale,
        isNew: product.isNew,
        category: product.category?.name ?? 'Без категории',
        categoryKey,
        stock: totalStock,
        sizeStock,
        availability,
        color: product.color,
        material: product.material,
        gender: product.gender,
        season: product.season,
        brand: product.brand,
        image: product.image ?? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=800&fit=crop',
        sizes: normalizedSizes,
    };
}
function roundCurrency(value) {
    return Number(value.toFixed(2));
}
function buildCartSummary(items, appliedPromo = null) {
    const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
    const discount = roundCurrency(Math.min(appliedPromo?.discountAmount ?? 0, subtotal));
    const discountedSubtotal = roundCurrency(Math.max(0, subtotal - discount));
    const delivery = subtotal >= 5000 || discountedSubtotal === 0 ? 0 : 490;
    return {
        subtotal,
        discount,
        delivery,
        total: roundCurrency(discountedSubtotal + delivery),
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        promoCode: appliedPromo
            ? {
                code: appliedPromo.code,
                title: appliedPromo.title,
            }
            : null,
    };
}
function normalizePromoCode(code) {
    return code.trim().toUpperCase();
}
function calculatePromoDiscount(subtotal, promo) {
    let discountAmount = promo.discountType === 'PERCENT' ? (subtotal * promo.discountValue) / 100 : promo.discountValue;
    if (promo.maxDiscount != null) {
        discountAmount = Math.min(discountAmount, promo.maxDiscount);
    }
    return roundCurrency(Math.max(0, Math.min(discountAmount, subtotal)));
}
function validatePromoForSubtotal(promo, subtotal) {
    if (!promo.isActive) {
        return { isValid: false, reason: 'Промокод неактивен' };
    }
    const now = new Date();
    if (promo.startsAt && now < promo.startsAt) {
        return { isValid: false, reason: 'Промокод еще не активен' };
    }
    if (promo.endsAt && now > promo.endsAt) {
        return { isValid: false, reason: 'Срок действия промокода истек' };
    }
    const minSubtotal = promo.minSubtotal ?? 0;
    if (subtotal < minSubtotal) {
        return {
            isValid: false,
            reason: `Минимальная сумма заказа для промокода: ${minSubtotal.toLocaleString('ru-RU')} ₽`,
        };
    }
    return { isValid: true };
}
async function getCartItemsWithProducts(userId) {
    const cartItems = await shop_repository_1.shopRepository.listCartItems(userId);
    return cartItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
        availableStock: normalizeSizeStock(item.product.sizeStock, item.product.sizes, item.product.stock)[normalizeSizeLabel(item.size)] ?? 0,
        product: mapProduct(item.product),
    }));
}
async function resolveAppliedPromo(userId, subtotal) {
    const appliedCartPromo = await shop_repository_1.shopRepository.getCartPromo(userId);
    if (!appliedCartPromo) {
        return null;
    }
    const promo = appliedCartPromo.promoCode;
    const promoData = {
        isActive: promo.isActive,
        startsAt: promo.startsAt,
        endsAt: promo.endsAt,
        minSubtotal: promo.minSubtotal ? Number(promo.minSubtotal) : 0,
    };
    const validation = validatePromoForSubtotal(promoData, subtotal);
    if (!validation.isValid) {
        await shop_repository_1.shopRepository.clearCartPromo(userId);
        return null;
    }
    const discountAmount = calculatePromoDiscount(subtotal, {
        discountType: promo.discountType,
        discountValue: Number(promo.discountValue),
        maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : null,
    });
    return {
        id: promo.id,
        code: promo.code,
        title: promo.title,
        discountAmount,
    };
}
function mapPromoCode(promo) {
    const toNum = (value) => {
        if (value == null) {
            return null;
        }
        if (typeof value === 'number') {
            return value;
        }
        if (value.toNumber) {
            return value.toNumber();
        }
        return Number(value);
    };
    return {
        id: promo.id,
        code: promo.code,
        title: promo.title,
        description: promo.description ?? undefined,
        discountType: promo.discountType,
        discountValue: toNum(promo.discountValue) ?? 0,
        minSubtotal: toNum(promo.minSubtotal),
        maxDiscount: toNum(promo.maxDiscount),
        usageLimit: promo.usageLimit,
        perUserLimit: promo.perUserLimit,
        usedCount: promo.usedCount,
        startsAt: promo.startsAt,
        endsAt: promo.endsAt,
        isActive: promo.isActive,
        createdAt: promo.createdAt,
        updatedAt: promo.updatedAt,
    };
}
exports.shopService = {
    async listCategories() {
        const categories = await shop_repository_1.shopRepository.listCategories();
        return categories.map((category) => ({
            id: category.id,
            name: category.name,
            key: categoryNameToKey(category.name, category.id),
        }));
    },
    async listProducts() {
        const products = await shop_repository_1.shopRepository.listProducts();
        return products.map(mapProduct);
    },
    async getProductByReference(reference) {
        const parsedId = Number(reference);
        const byId = Number.isInteger(parsedId) ? await shop_repository_1.shopRepository.findProductById(parsedId) : null;
        const product = byId ?? (await shop_repository_1.shopRepository.findProductBySku(reference));
        if (!product) {
            throw new error_handler_1.HttpError(404, 'Товар не найден');
        }
        return mapProduct(product);
    },
    async createProduct(actorUserId, input) {
        const sku = input.sku.trim().toUpperCase();
        const name = input.name.trim();
        if (!sku) {
            throw new error_handler_1.HttpError(400, 'SKU обязателен');
        }
        if (!name) {
            throw new error_handler_1.HttpError(400, 'Название товара обязательно');
        }
        if (input.price <= 0) {
            throw new error_handler_1.HttpError(400, 'Цена должна быть больше нуля');
        }
        if (input.oldPrice != null && input.oldPrice < 0) {
            throw new error_handler_1.HttpError(400, 'Старая цена не может быть отрицательной');
        }
        if ((input.stock ?? 0) < 0) {
            throw new error_handler_1.HttpError(400, 'Остаток не может быть отрицательным');
        }
        const existingProduct = await shop_repository_1.shopRepository.findProductBySku(sku);
        if (existingProduct) {
            throw new error_handler_1.HttpError(409, 'Товар с таким SKU уже существует');
        }
        const product = await shop_repository_1.shopRepository.createProduct({
            sizeStock: normalizeSizeStock(input.sizeStock, input.sizes ?? [], input.stock ?? 0),
            sku,
            name,
            description: input.description?.trim() || null,
            image: input.image?.trim() || null,
            price: input.price,
            oldPrice: input.oldPrice ?? null,
            isSale: input.isSale ?? false,
            isNew: input.isNew ?? false,
            sizes: sanitizeSizes(input.sizes ?? []),
            color: input.color?.trim() || 'black',
            material: input.material?.trim() || 'cotton',
            gender: input.gender?.trim() || 'unisex',
            season: input.season?.trim() || 'demi',
            brand: input.brand?.trim() || 'brand1',
            stock: input.stock ?? 0,
            categoryId: input.categoryId ?? null,
        });
        await audit_repository_1.auditRepository.create({
            userId: actorUserId,
            action: 'PRODUCT_CREATE',
            entity: 'Product',
            entityId: String(product.id),
            result: 'SUCCESS',
            metadata: { sku: product.sku },
        });
        return mapProduct(product);
    },
    async updateProduct(actorUserId, productId, input) {
        const existingProduct = await shop_repository_1.shopRepository.findProductById(productId);
        if (!existingProduct) {
            throw new error_handler_1.HttpError(404, 'Товар не найден');
        }
        if (input.price != null && input.price <= 0) {
            throw new error_handler_1.HttpError(400, 'Цена должна быть больше нуля');
        }
        if (input.oldPrice != null && input.oldPrice < 0) {
            throw new error_handler_1.HttpError(400, 'Старая цена не может быть отрицательной');
        }
        if (input.stock != null && input.stock < 0) {
            throw new error_handler_1.HttpError(400, 'Остаток не может быть отрицательным');
        }
        const normalizedSku = input.sku?.trim().toUpperCase();
        if (normalizedSku && normalizedSku !== existingProduct.sku) {
            const productWithSku = await shop_repository_1.shopRepository.findProductBySku(normalizedSku);
            if (productWithSku && productWithSku.id !== productId) {
                throw new error_handler_1.HttpError(409, 'Товар с таким SKU уже существует');
            }
        }
        const product = await shop_repository_1.shopRepository.updateProduct(productId, {
            sizeStock: input.sizeStock != null || input.sizes != null || input.stock != null
                ? normalizeSizeStock(input.sizeStock ?? existingProduct.sizeStock, input.sizes ?? existingProduct.sizes, input.stock ?? existingProduct.stock)
                : undefined,
            sku: normalizedSku,
            name: input.name?.trim(),
            description: input.description == null ? undefined : input.description.trim() || null,
            image: input.image == null ? undefined : input.image.trim() || null,
            price: input.price,
            oldPrice: input.oldPrice,
            isSale: input.isSale,
            isNew: input.isNew,
            sizes: input.sizes ? sanitizeSizes(input.sizes) : undefined,
            color: input.color?.trim(),
            material: input.material?.trim(),
            gender: input.gender?.trim(),
            season: input.season?.trim(),
            brand: input.brand?.trim(),
            stock: input.stock,
            categoryId: input.categoryId,
        });
        await audit_repository_1.auditRepository.create({
            userId: actorUserId,
            action: 'PRODUCT_UPDATE',
            entity: 'Product',
            entityId: String(product.id),
            result: 'SUCCESS',
            metadata: { sku: product.sku },
        });
        return mapProduct(product);
    },
    async deleteProduct(actorUserId, productId) {
        const existingProduct = await shop_repository_1.shopRepository.findProductById(productId);
        if (!existingProduct) {
            throw new error_handler_1.HttpError(404, 'Товар не найден');
        }
        const relations = await shop_repository_1.shopRepository.countProductRelations(productId);
        if (relations.orderItems > 0) {
            throw new error_handler_1.HttpError(400, 'Нельзя удалить товар, который уже есть в заказах');
        }
        await shop_repository_1.shopRepository.deleteProduct(productId);
        await audit_repository_1.auditRepository.create({
            userId: actorUserId,
            action: 'PRODUCT_DELETE',
            entity: 'Product',
            entityId: String(productId),
            result: 'SUCCESS',
            metadata: { sku: existingProduct.sku, relations },
        });
    },
    async listFavorites(userId) {
        const favoriteItems = await shop_repository_1.shopRepository.listFavorites(userId);
        return favoriteItems.map((item) => ({
            id: item.id,
            productId: item.productId,
            size: item.size,
            createdAt: item.createdAt,
            product: mapProduct(item.product),
        }));
    },
    async addFavorite(userId, productId, size) {
        const product = await shop_repository_1.shopRepository.findProductById(productId);
        if (!product) {
            throw new error_handler_1.HttpError(404, 'Товар не найден');
        }
        const normalizedSize = normalizeSizeLabel(size);
        const sizeStock = normalizeSizeStock(product.sizeStock, product.sizes, product.stock);
        const availableSizes = Object.keys(sizeStock);
        if (!availableSizes.includes(normalizedSize)) {
            throw new error_handler_1.HttpError(400, 'Выберите корректный размер');
        }
        const favorite = await shop_repository_1.shopRepository.addFavorite(userId, productId, normalizedSize);
        await audit_repository_1.auditRepository.create({
            userId,
            action: 'FAVORITE_ADD',
            entity: 'Product',
            entityId: String(productId),
            result: 'SUCCESS',
            metadata: { size: normalizedSize },
        });
        return {
            id: favorite.id,
            productId: favorite.productId,
            size: favorite.size,
            createdAt: favorite.createdAt,
            product: mapProduct(favorite.product),
        };
    },
    async removeFavorite(userId, productId, size) {
        const normalizedSize = size ? normalizeSizeLabel(size) : undefined;
        await shop_repository_1.shopRepository.removeFavorite(userId, productId, normalizedSize);
        await audit_repository_1.auditRepository.create({
            userId,
            action: 'FAVORITE_REMOVE',
            entity: 'Product',
            entityId: String(productId),
            result: 'SUCCESS',
            metadata: normalizedSize ? { size: normalizedSize } : undefined,
        });
    },
    async listCart(userId) {
        const items = await getCartItemsWithProducts(userId);
        const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
        const appliedPromo = await resolveAppliedPromo(userId, subtotal);
        return {
            items,
            summary: buildCartSummary(items, appliedPromo),
        };
    },
    async applyPromoToCart(userId, promoCode) {
        const code = normalizePromoCode(promoCode);
        if (!code) {
            throw new error_handler_1.HttpError(400, 'Укажите промокод');
        }
        const items = await getCartItemsWithProducts(userId);
        if (items.length === 0) {
            throw new error_handler_1.HttpError(400, 'Промокод нельзя применить к пустой корзине');
        }
        const promo = await shop_repository_1.shopRepository.findPromoByCode(code);
        if (!promo || !promo.isActive) {
            throw new error_handler_1.HttpError(404, 'Промокод не найден или неактивен');
        }
        const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
        const validation = validatePromoForSubtotal({
            isActive: promo.isActive,
            startsAt: promo.startsAt,
            endsAt: promo.endsAt,
            minSubtotal: promo.minSubtotal ? Number(promo.minSubtotal) : 0,
        }, subtotal);
        if (!validation.isValid) {
            throw new error_handler_1.HttpError(400, validation.reason ?? 'Промокод недоступен');
        }
        if (promo.usageLimit != null) {
            const totalUsages = await shop_repository_1.shopRepository.countPromoUsage(promo.id);
            if (totalUsages >= promo.usageLimit) {
                throw new error_handler_1.HttpError(400, 'Лимит применений промокода исчерпан');
            }
        }
        if (promo.perUserLimit != null) {
            const userUsages = await shop_repository_1.shopRepository.countPromoUsageByUser(promo.id, userId);
            if (userUsages >= promo.perUserLimit) {
                throw new error_handler_1.HttpError(400, 'Вы уже использовали этот промокод максимальное число раз');
            }
        }
        const discountAmount = calculatePromoDiscount(subtotal, {
            discountType: promo.discountType,
            discountValue: Number(promo.discountValue),
            maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : null,
        });
        await shop_repository_1.shopRepository.setCartPromo(userId, promo.id);
        await audit_repository_1.auditRepository.create({
            userId,
            action: 'CART_PROMO_APPLY',
            entity: 'PromoCode',
            entityId: String(promo.id),
            result: 'SUCCESS',
            metadata: { code: promo.code, discountAmount },
        });
        return {
            items,
            summary: buildCartSummary(items, {
                id: promo.id,
                code: promo.code,
                title: promo.title,
                discountAmount,
            }),
        };
    },
    async clearPromoFromCart(userId) {
        await shop_repository_1.shopRepository.clearCartPromo(userId);
        await audit_repository_1.auditRepository.create({
            userId,
            action: 'CART_PROMO_CLEAR',
            entity: 'PromoCode',
            result: 'SUCCESS',
        });
        return this.listCart(userId);
    },
    async listPromoCodes() {
        const promoCodes = await shop_repository_1.shopRepository.listPromoCodes();
        return promoCodes.map(mapPromoCode);
    },
    async createPromoCode(input) {
        const normalizedCode = normalizePromoCode(input.code);
        if (!normalizedCode) {
            throw new error_handler_1.HttpError(400, 'Код промокода обязателен');
        }
        if (input.discountValue <= 0) {
            throw new error_handler_1.HttpError(400, 'Размер скидки должен быть больше нуля');
        }
        if (input.discountType === 'PERCENT' && input.discountValue > 100) {
            throw new error_handler_1.HttpError(400, 'Процент скидки не может быть больше 100');
        }
        const promo = await shop_repository_1.shopRepository.createPromoCode({
            code: normalizedCode,
            title: input.title.trim(),
            description: input.description?.trim() || null,
            discountType: input.discountType,
            discountValue: input.discountValue,
            minSubtotal: input.minSubtotal ?? null,
            maxDiscount: input.maxDiscount ?? null,
            usageLimit: input.usageLimit ?? null,
            perUserLimit: input.perUserLimit ?? null,
            startsAt: input.startsAt ?? null,
            endsAt: input.endsAt ?? null,
            isActive: input.isActive ?? true,
        });
        return mapPromoCode(promo);
    },
    async updatePromoCode(promoId, input) {
        if (input.discountValue != null && input.discountValue <= 0) {
            throw new error_handler_1.HttpError(400, 'Размер скидки должен быть больше нуля');
        }
        if (input.discountType === 'PERCENT' &&
            input.discountValue != null &&
            input.discountValue > 100) {
            throw new error_handler_1.HttpError(400, 'Процент скидки не может быть больше 100');
        }
        const promo = await shop_repository_1.shopRepository.updatePromoCode(promoId, {
            code: input.code ? normalizePromoCode(input.code) : undefined,
            title: input.title?.trim(),
            description: input.description == null ? undefined : input.description.trim() || null,
            discountType: input.discountType,
            discountValue: input.discountValue,
            minSubtotal: input.minSubtotal,
            maxDiscount: input.maxDiscount,
            usageLimit: input.usageLimit,
            perUserLimit: input.perUserLimit,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            isActive: input.isActive,
        });
        return mapPromoCode(promo);
    },
    async deletePromoCode(promoId) {
        await shop_repository_1.shopRepository.deletePromoCode(promoId);
    },
    async addToCart(userId, input) {
        const product = await shop_repository_1.shopRepository.findProductById(input.productId);
        if (!product) {
            throw new error_handler_1.HttpError(404, 'Товар не найден');
        }
        if (input.quantity <= 0) {
            throw new error_handler_1.HttpError(400, 'Количество должно быть больше нуля');
        }
        const normalizedSize = normalizeSizeLabel(input.size);
        if (!normalizedSize) {
            throw new error_handler_1.HttpError(400, 'Выберите размер');
        }
        const sizeStock = normalizeSizeStock(product.sizeStock, product.sizes, product.stock);
        const availableForSize = sizeStock[normalizedSize] ?? 0;
        if (availableForSize <= 0) {
            throw new error_handler_1.HttpError(400, 'Выбранный размер недоступен');
        }
        const existingItem = await shop_repository_1.shopRepository.findCartItem(userId, input.productId, normalizedSize);
        const targetQuantity = (existingItem?.quantity ?? 0) + input.quantity;
        if (targetQuantity > availableForSize) {
            throw new error_handler_1.HttpError(400, `Для размера ${normalizedSize} доступно только ${availableForSize} шт.`);
        }
        if (!existingItem) {
            await shop_repository_1.shopRepository.createCartItem(userId, input.productId, normalizedSize, input.quantity);
        }
        else {
            await shop_repository_1.shopRepository.updateCartItem(userId, input.productId, normalizedSize, targetQuantity);
        }
        await audit_repository_1.auditRepository.create({
            userId,
            action: 'CART_ADD',
            entity: 'Product',
            entityId: String(input.productId),
            result: 'SUCCESS',
            metadata: { quantity: input.quantity, size: normalizedSize },
        });
        return this.listCart(userId);
    },
    async updateCartItem(userId, input) {
        const normalizedSize = normalizeSizeLabel(input.size);
        if (!normalizedSize) {
            throw new error_handler_1.HttpError(400, 'Выберите размер');
        }
        if (input.quantity <= 0) {
            await shop_repository_1.shopRepository.deleteCartItem(userId, input.productId, normalizedSize);
            return this.listCart(userId);
        }
        const product = await shop_repository_1.shopRepository.findProductById(input.productId);
        if (!product) {
            throw new error_handler_1.HttpError(404, 'Товар не найден');
        }
        const sizeStock = normalizeSizeStock(product.sizeStock, product.sizes, product.stock);
        const availableForSize = sizeStock[normalizedSize] ?? 0;
        if (input.quantity > availableForSize) {
            throw new error_handler_1.HttpError(400, `Для размера ${normalizedSize} доступно только ${availableForSize} шт.`);
        }
        const cartItem = await shop_repository_1.shopRepository.findCartItem(userId, input.productId, normalizedSize);
        if (!cartItem) {
            throw new error_handler_1.HttpError(404, 'Позиция в корзине не найдена');
        }
        await shop_repository_1.shopRepository.updateCartItem(userId, input.productId, normalizedSize, input.quantity);
        await audit_repository_1.auditRepository.create({
            userId,
            action: 'CART_UPDATE',
            entity: 'Product',
            entityId: String(input.productId),
            result: 'SUCCESS',
            metadata: { quantity: input.quantity, size: normalizedSize },
        });
        return this.listCart(userId);
    },
    async removeFromCart(userId, productId, size) {
        const normalizedSize = size ? normalizeSizeLabel(size) : undefined;
        await shop_repository_1.shopRepository.deleteCartItem(userId, productId, normalizedSize);
        await audit_repository_1.auditRepository.create({
            userId,
            action: 'CART_REMOVE',
            entity: 'Product',
            entityId: String(productId),
            result: 'SUCCESS',
            metadata: normalizedSize ? { size: normalizedSize } : undefined,
        });
        return this.listCart(userId);
    },
};
