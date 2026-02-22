import { shopRepository } from '../repositories/shop.repository'
import { auditRepository } from '../repositories/audit.repository'
import { HttpError } from '../middleware/error-handler'

type CartViewItem = {
  id: string
  productId: number
  size: string
  quantity: number
  availableStock: number
  product: ReturnType<typeof mapProduct>
}

type AppliedPromoSummary = {
  id: number
  code: string
  title: string
  discountAmount: number
}

type PromoValidationResult = {
  isValid: boolean
  reason?: string
}

function categoryNameToKey(categoryName: string | null | undefined, fallbackId = 0) {
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
  ]

  const categoryMap: Record<string, string> = {
    'верхняя одежда': 'outerwear',
    'платья': 'dresses',
    'рубашки': 'shirts',
    'футболки': 'tshirts',
    'джинсы': 'jeans',
    'брюки': 'pants',
    'трикотаж': 'knitwear',
    'юбки': 'skirts',
    'аксессуары': 'accessories',
  }

  const normalizedCategory = categoryName?.trim().toLowerCase() ?? ''
  return categoryMap[normalizedCategory] ?? categoryKeys[fallbackId % categoryKeys.length]
}

function normalizeSizeLabel(size: string) {
  return size.trim().toUpperCase()
}

function sanitizeSizes(sizes: string[]) {
  const normalized = sizes.map(normalizeSizeLabel).filter(Boolean)
  return Array.from(new Set(normalized))
}

function distributeStockBySizes(totalStock: number, sizes: string[]) {
  const safeSizes = sanitizeSizes(sizes)
  if (safeSizes.length === 0) {
    return {} as Record<string, number>
  }

  const base = Math.floor(totalStock / safeSizes.length)
  const remainder = totalStock % safeSizes.length
  return Object.fromEntries(
    safeSizes.map((size, index) => [size, base + (index < remainder ? 1 : 0)]),
  )
}

function normalizeSizeStock(
  rawSizeStock: unknown,
  fallbackSizes: string[],
  fallbackTotalStock: number,
) {
  const parsed =
    rawSizeStock && typeof rawSizeStock === 'object' && !Array.isArray(rawSizeStock)
      ? Object.entries(rawSizeStock as Record<string, unknown>).reduce<Record<string, number>>((acc, [size, value]) => {
          const normalizedSize = normalizeSizeLabel(size)
          const numericValue = Number(value)
          if (!normalizedSize || Number.isNaN(numericValue) || numericValue < 0) {
            return acc
          }

          acc[normalizedSize] = Math.floor(numericValue)
          return acc
        }, {})
      : {}

  const fallbackNormalizedSizes = sanitizeSizes(fallbackSizes)
  const withFallbackSizes = fallbackNormalizedSizes.reduce<Record<string, number>>((acc, size) => {
    acc[size] = parsed[size] ?? 0
    return acc
  }, { ...parsed })

  const hasAnyPositive = Object.values(withFallbackSizes).some((value) => value > 0)
  if (hasAnyPositive) {
    return withFallbackSizes
  }

  if (fallbackNormalizedSizes.length > 0) {
    return distributeStockBySizes(Math.max(0, fallbackTotalStock), fallbackNormalizedSizes)
  }

  return {}
}

function mapProduct(product: {
  id: number
  sku: string
  name: string
  description: string | null
  image: string | null
  price: { toNumber?: () => number } | number
  oldPrice: { toNumber?: () => number } | number | null
  isSale: boolean
  isNew: boolean
  sizes: string[]
  sizeStock: unknown
  color: string
  material: string
  gender: string
  season: string
  brand: string
  stock: number
  category: { name: string } | null
}) {
  const sizeStock = normalizeSizeStock(product.sizeStock, product.sizes, product.stock)
  const normalizedSizes = Object.keys(sizeStock).length > 0 ? Object.keys(sizeStock) : sanitizeSizes(product.sizes)
  const totalStock = Object.values(sizeStock).reduce((sum, value) => sum + value, 0)
  const categoryKey = categoryNameToKey(product.category?.name, product.id)
  const computedPrice =
    typeof product.price === 'number'
      ? product.price
      : product.price.toNumber
        ? product.price.toNumber()
        : Number(product.price)
  const computedOldPrice =
    product.oldPrice == null
      ? undefined
      : typeof product.oldPrice === 'number'
        ? product.oldPrice
        : product.oldPrice.toNumber
          ? product.oldPrice.toNumber()
          : Number(product.oldPrice)
  const availability = totalStock <= 0 ? 'outofstock' : totalStock < 5 ? 'preorder' : 'instock'

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
  }
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2))
}

function buildCartSummary(items: CartViewItem[], appliedPromo: AppliedPromoSummary | null = null) {
  const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0))
  const discount = roundCurrency(Math.min(appliedPromo?.discountAmount ?? 0, subtotal))
  const discountedSubtotal = roundCurrency(Math.max(0, subtotal - discount))
  const delivery = subtotal >= 5000 || discountedSubtotal === 0 ? 0 : 490

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
  }
}

function normalizePromoCode(code: string) {
  return code.trim().toUpperCase()
}

function calculatePromoDiscount(
  subtotal: number,
  promo: {
    discountType: 'PERCENT' | 'FIXED'
    discountValue: number
    maxDiscount?: number | null
  },
) {
  let discountAmount = promo.discountType === 'PERCENT' ? (subtotal * promo.discountValue) / 100 : promo.discountValue

  if (promo.maxDiscount != null) {
    discountAmount = Math.min(discountAmount, promo.maxDiscount)
  }

  return roundCurrency(Math.max(0, Math.min(discountAmount, subtotal)))
}

function validatePromoForSubtotal(
  promo: {
    isActive: boolean
    startsAt?: Date | null
    endsAt?: Date | null
    minSubtotal?: number | null
  },
  subtotal: number,
): PromoValidationResult {
  if (!promo.isActive) {
    return { isValid: false, reason: 'Промокод неактивен' }
  }

  const now = new Date()
  if (promo.startsAt && now < promo.startsAt) {
    return { isValid: false, reason: 'Промокод еще не активен' }
  }

  if (promo.endsAt && now > promo.endsAt) {
    return { isValid: false, reason: 'Срок действия промокода истек' }
  }

  const minSubtotal = promo.minSubtotal ?? 0
  if (subtotal < minSubtotal) {
    return {
      isValid: false,
      reason: `Минимальная сумма заказа для промокода: ${minSubtotal.toLocaleString('ru-RU')} ₽`,
    }
  }

  return { isValid: true }
}

async function getCartItemsWithProducts(userId: string) {
  const cartItems = await shopRepository.listCartItems(userId)
  return cartItems.map((item) => ({
    id: item.id,
    productId: item.productId,
    size: item.size,
    quantity: item.quantity,
    availableStock: normalizeSizeStock(item.product.sizeStock, item.product.sizes, item.product.stock)[normalizeSizeLabel(item.size)] ?? 0,
    product: mapProduct(item.product),
  }))
}

async function resolveAppliedPromo(userId: string, subtotal: number): Promise<AppliedPromoSummary | null> {
  const appliedCartPromo = await shopRepository.getCartPromo(userId)
  if (!appliedCartPromo) {
    return null
  }

  const promo = appliedCartPromo.promoCode
  const promoData = {
    isActive: promo.isActive,
    startsAt: promo.startsAt,
    endsAt: promo.endsAt,
    minSubtotal: promo.minSubtotal ? Number(promo.minSubtotal) : 0,
  }
  const validation = validatePromoForSubtotal(promoData, subtotal)

  if (!validation.isValid) {
    await shopRepository.clearCartPromo(userId)
    return null
  }

  const discountAmount = calculatePromoDiscount(subtotal, {
    discountType: promo.discountType,
    discountValue: Number(promo.discountValue),
    maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : null,
  })

  return {
    id: promo.id,
    code: promo.code,
    title: promo.title,
    discountAmount,
  }
}

function mapPromoCode(promo: {
  id: number
  code: string
  title: string
  description: string | null
  discountType: 'PERCENT' | 'FIXED'
  discountValue: { toNumber?: () => number } | number
  minSubtotal: { toNumber?: () => number } | number | null
  maxDiscount: { toNumber?: () => number } | number | null
  usageLimit: number | null
  perUserLimit: number | null
  usedCount: number
  startsAt: Date | null
  endsAt: Date | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}) {
  const toNum = (value: { toNumber?: () => number } | number | null | undefined) => {
    if (value == null) {
      return null
    }

    if (typeof value === 'number') {
      return value
    }

    if (value.toNumber) {
      return value.toNumber()
    }

    return Number(value)
  }

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
  }
}

export const shopService = {
  async listCategories() {
    const categories = await shopRepository.listCategories()
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      key: categoryNameToKey(category.name, category.id),
    }))
  },

  async listProducts() {
    const products = await shopRepository.listProducts()
    return products.map(mapProduct)
  },

  async getProductByReference(reference: string) {
    const parsedId = Number(reference)
    const byId = Number.isInteger(parsedId) ? await shopRepository.findProductById(parsedId) : null
    const product = byId ?? (await shopRepository.findProductBySku(reference))
    if (!product) {
      throw new HttpError(404, 'Товар не найден')
    }

    return mapProduct(product)
  },

  async createProduct(
    actorUserId: string,
    input: {
      sku: string
      name: string
      description?: string
      image?: string
      price: number
      oldPrice?: number | null
      isSale?: boolean
      isNew?: boolean
      sizes?: string[]
      sizeStock?: Record<string, number>
      color?: string
      material?: string
      gender?: string
      season?: string
      brand?: string
      stock?: number
      categoryId?: number | null
    },
  ) {
    const sku = input.sku.trim().toUpperCase()
    const name = input.name.trim()

    if (!sku) {
      throw new HttpError(400, 'SKU обязателен')
    }

    if (!name) {
      throw new HttpError(400, 'Название товара обязательно')
    }

    if (input.price <= 0) {
      throw new HttpError(400, 'Цена должна быть больше нуля')
    }

    if (input.oldPrice != null && input.oldPrice < 0) {
      throw new HttpError(400, 'Старая цена не может быть отрицательной')
    }

    if ((input.stock ?? 0) < 0) {
      throw new HttpError(400, 'Остаток не может быть отрицательным')
    }

    const existingProduct = await shopRepository.findProductBySku(sku)
    if (existingProduct) {
      throw new HttpError(409, 'Товар с таким SKU уже существует')
    }

    const product = await shopRepository.createProduct({
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
    })

    await auditRepository.create({
      userId: actorUserId,
      action: 'PRODUCT_CREATE',
      entity: 'Product',
      entityId: String(product.id),
      result: 'SUCCESS',
      metadata: { sku: product.sku },
    })

    return mapProduct(product)
  },

  async updateProduct(
    actorUserId: string,
    productId: number,
    input: {
      sku?: string
      name?: string
      description?: string
      image?: string
      price?: number
      oldPrice?: number | null
      isSale?: boolean
      isNew?: boolean
      sizes?: string[]
      sizeStock?: Record<string, number>
      color?: string
      material?: string
      gender?: string
      season?: string
      brand?: string
      stock?: number
      categoryId?: number | null
    },
  ) {
    const existingProduct = await shopRepository.findProductById(productId)
    if (!existingProduct) {
      throw new HttpError(404, 'Товар не найден')
    }

    if (input.price != null && input.price <= 0) {
      throw new HttpError(400, 'Цена должна быть больше нуля')
    }

    if (input.oldPrice != null && input.oldPrice < 0) {
      throw new HttpError(400, 'Старая цена не может быть отрицательной')
    }

    if (input.stock != null && input.stock < 0) {
      throw new HttpError(400, 'Остаток не может быть отрицательным')
    }

    const normalizedSku = input.sku?.trim().toUpperCase()
    if (normalizedSku && normalizedSku !== existingProduct.sku) {
      const productWithSku = await shopRepository.findProductBySku(normalizedSku)
      if (productWithSku && productWithSku.id !== productId) {
        throw new HttpError(409, 'Товар с таким SKU уже существует')
      }
    }

    const product = await shopRepository.updateProduct(productId, {
      sizeStock:
        input.sizeStock != null || input.sizes != null || input.stock != null
          ? normalizeSizeStock(
              input.sizeStock ?? existingProduct.sizeStock,
              input.sizes ?? existingProduct.sizes,
              input.stock ?? existingProduct.stock,
            )
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
    })

    await auditRepository.create({
      userId: actorUserId,
      action: 'PRODUCT_UPDATE',
      entity: 'Product',
      entityId: String(product.id),
      result: 'SUCCESS',
      metadata: { sku: product.sku },
    })

    return mapProduct(product)
  },

  async deleteProduct(actorUserId: string, productId: number) {
    const existingProduct = await shopRepository.findProductById(productId)
    if (!existingProduct) {
      throw new HttpError(404, 'Товар не найден')
    }

    const relations = await shopRepository.countProductRelations(productId)
    if (relations.orderItems > 0) {
      throw new HttpError(400, 'Нельзя удалить товар, который уже есть в заказах')
    }

    await shopRepository.deleteProduct(productId)

    await auditRepository.create({
      userId: actorUserId,
      action: 'PRODUCT_DELETE',
      entity: 'Product',
      entityId: String(productId),
      result: 'SUCCESS',
      metadata: { sku: existingProduct.sku, relations },
    })
  },

  async listFavorites(userId: string) {
    const favoriteItems = await shopRepository.listFavorites(userId)
    return favoriteItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      size: item.size,
      createdAt: item.createdAt,
      product: mapProduct(item.product),
    }))
  },

  async addFavorite(userId: string, productId: number, size: string) {
    const product = await shopRepository.findProductById(productId)
    if (!product) {
      throw new HttpError(404, 'Товар не найден')
    }

    const normalizedSize = normalizeSizeLabel(size)
    const sizeStock = normalizeSizeStock(product.sizeStock, product.sizes, product.stock)
    const availableSizes = Object.keys(sizeStock)
    if (!availableSizes.includes(normalizedSize)) {
      throw new HttpError(400, 'Выберите корректный размер')
    }

    const favorite = await shopRepository.addFavorite(userId, productId, normalizedSize)

    await auditRepository.create({
      userId,
      action: 'FAVORITE_ADD',
      entity: 'Product',
      entityId: String(productId),
      result: 'SUCCESS',
      metadata: { size: normalizedSize },
    })

    return {
      id: favorite.id,
      productId: favorite.productId,
      size: favorite.size,
      createdAt: favorite.createdAt,
      product: mapProduct(favorite.product),
    }
  },

  async removeFavorite(userId: string, productId: number, size?: string) {
    const normalizedSize = size ? normalizeSizeLabel(size) : undefined
    await shopRepository.removeFavorite(userId, productId, normalizedSize)

    await auditRepository.create({
      userId,
      action: 'FAVORITE_REMOVE',
      entity: 'Product',
      entityId: String(productId),
      result: 'SUCCESS',
      metadata: normalizedSize ? { size: normalizedSize } : undefined,
    })
  },

  async listCart(userId: string) {
    const items = await getCartItemsWithProducts(userId)
    const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0))
    const appliedPromo = await resolveAppliedPromo(userId, subtotal)

    return {
      items,
      summary: buildCartSummary(items, appliedPromo),
    }
  },

  async applyPromoToCart(userId: string, promoCode: string) {
    const code = normalizePromoCode(promoCode)
    if (!code) {
      throw new HttpError(400, 'Укажите промокод')
    }

    const items = await getCartItemsWithProducts(userId)

    if (items.length === 0) {
      throw new HttpError(400, 'Промокод нельзя применить к пустой корзине')
    }

    const promo = await shopRepository.findPromoByCode(code)
    if (!promo || !promo.isActive) {
      throw new HttpError(404, 'Промокод не найден или неактивен')
    }

    const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0))

    const validation = validatePromoForSubtotal(
      {
        isActive: promo.isActive,
        startsAt: promo.startsAt,
        endsAt: promo.endsAt,
        minSubtotal: promo.minSubtotal ? Number(promo.minSubtotal) : 0,
      },
      subtotal,
    )
    if (!validation.isValid) {
      throw new HttpError(400, validation.reason ?? 'Промокод недоступен')
    }

    if (promo.usageLimit != null) {
      const totalUsages = await shopRepository.countPromoUsage(promo.id)
      if (totalUsages >= promo.usageLimit) {
        throw new HttpError(400, 'Лимит применений промокода исчерпан')
      }
    }

    if (promo.perUserLimit != null) {
      const userUsages = await shopRepository.countPromoUsageByUser(promo.id, userId)
      if (userUsages >= promo.perUserLimit) {
        throw new HttpError(400, 'Вы уже использовали этот промокод максимальное число раз')
      }
    }

    const discountAmount = calculatePromoDiscount(subtotal, {
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : null,
    })

    await shopRepository.setCartPromo(userId, promo.id)

    await auditRepository.create({
      userId,
      action: 'CART_PROMO_APPLY',
      entity: 'PromoCode',
      entityId: String(promo.id),
      result: 'SUCCESS',
      metadata: { code: promo.code, discountAmount },
    })

    return {
      items,
      summary: buildCartSummary(items, {
        id: promo.id,
        code: promo.code,
        title: promo.title,
        discountAmount,
      }),
    }
  },

  async clearPromoFromCart(userId: string) {
    await shopRepository.clearCartPromo(userId)

    await auditRepository.create({
      userId,
      action: 'CART_PROMO_CLEAR',
      entity: 'PromoCode',
      result: 'SUCCESS',
    })

    return this.listCart(userId)
  },

  async listPromoCodes() {
    const promoCodes = await shopRepository.listPromoCodes()
    return promoCodes.map(mapPromoCode)
  },

  async createPromoCode(input: {
    code: string
    title: string
    description?: string
    discountType: 'PERCENT' | 'FIXED'
    discountValue: number
    minSubtotal?: number | null
    maxDiscount?: number | null
    usageLimit?: number | null
    perUserLimit?: number | null
    startsAt?: Date | null
    endsAt?: Date | null
    isActive?: boolean
  }) {
    const normalizedCode = normalizePromoCode(input.code)
    if (!normalizedCode) {
      throw new HttpError(400, 'Код промокода обязателен')
    }

    if (input.discountValue <= 0) {
      throw new HttpError(400, 'Размер скидки должен быть больше нуля')
    }

    if (input.discountType === 'PERCENT' && input.discountValue > 100) {
      throw new HttpError(400, 'Процент скидки не может быть больше 100')
    }

    const promo = await shopRepository.createPromoCode({
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
    })

    return mapPromoCode(promo)
  },

  async updatePromoCode(
    promoId: number,
    input: {
      code?: string
      title?: string
      description?: string
      discountType?: 'PERCENT' | 'FIXED'
      discountValue?: number
      minSubtotal?: number | null
      maxDiscount?: number | null
      usageLimit?: number | null
      perUserLimit?: number | null
      startsAt?: Date | null
      endsAt?: Date | null
      isActive?: boolean
    },
  ) {
    if (input.discountValue != null && input.discountValue <= 0) {
      throw new HttpError(400, 'Размер скидки должен быть больше нуля')
    }

    if (
      input.discountType === 'PERCENT' &&
      input.discountValue != null &&
      input.discountValue > 100
    ) {
      throw new HttpError(400, 'Процент скидки не может быть больше 100')
    }

    const promo = await shopRepository.updatePromoCode(promoId, {
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
    })

    return mapPromoCode(promo)
  },

  async deletePromoCode(promoId: number) {
    await shopRepository.deletePromoCode(promoId)
  },

  async addToCart(userId: string, input: { productId: number; size: string; quantity: number }) {
    const product = await shopRepository.findProductById(input.productId)
    if (!product) {
      throw new HttpError(404, 'Товар не найден')
    }

    if (input.quantity <= 0) {
      throw new HttpError(400, 'Количество должно быть больше нуля')
    }

    const normalizedSize = normalizeSizeLabel(input.size)
    if (!normalizedSize) {
      throw new HttpError(400, 'Выберите размер')
    }

    const sizeStock = normalizeSizeStock(product.sizeStock, product.sizes, product.stock)
    const availableForSize = sizeStock[normalizedSize] ?? 0
    if (availableForSize <= 0) {
      throw new HttpError(400, 'Выбранный размер недоступен')
    }

    const existingItem = await shopRepository.findCartItem(userId, input.productId, normalizedSize)
    const targetQuantity = (existingItem?.quantity ?? 0) + input.quantity

    if (targetQuantity > availableForSize) {
      throw new HttpError(400, `Для размера ${normalizedSize} доступно только ${availableForSize} шт.`)
    }

    if (!existingItem) {
      await shopRepository.createCartItem(userId, input.productId, normalizedSize, input.quantity)
    } else {
      await shopRepository.updateCartItem(userId, input.productId, normalizedSize, targetQuantity)
    }

    await auditRepository.create({
      userId,
      action: 'CART_ADD',
      entity: 'Product',
      entityId: String(input.productId),
      result: 'SUCCESS',
      metadata: { quantity: input.quantity, size: normalizedSize },
    })

    return this.listCart(userId)
  },

  async updateCartItem(userId: string, input: { productId: number; size: string; quantity: number }) {
    const normalizedSize = normalizeSizeLabel(input.size)
    if (!normalizedSize) {
      throw new HttpError(400, 'Выберите размер')
    }

    if (input.quantity <= 0) {
      await shopRepository.deleteCartItem(userId, input.productId, normalizedSize)
      return this.listCart(userId)
    }

    const product = await shopRepository.findProductById(input.productId)
    if (!product) {
      throw new HttpError(404, 'Товар не найден')
    }

    const sizeStock = normalizeSizeStock(product.sizeStock, product.sizes, product.stock)
    const availableForSize = sizeStock[normalizedSize] ?? 0

    if (input.quantity > availableForSize) {
      throw new HttpError(400, `Для размера ${normalizedSize} доступно только ${availableForSize} шт.`)
    }

    const cartItem = await shopRepository.findCartItem(userId, input.productId, normalizedSize)
    if (!cartItem) {
      throw new HttpError(404, 'Позиция в корзине не найдена')
    }

    await shopRepository.updateCartItem(userId, input.productId, normalizedSize, input.quantity)

    await auditRepository.create({
      userId,
      action: 'CART_UPDATE',
      entity: 'Product',
      entityId: String(input.productId),
      result: 'SUCCESS',
      metadata: { quantity: input.quantity, size: normalizedSize },
    })

    return this.listCart(userId)
  },

  async removeFromCart(userId: string, productId: number, size?: string) {
    const normalizedSize = size ? normalizeSizeLabel(size) : undefined
    await shopRepository.deleteCartItem(userId, productId, normalizedSize)

    await auditRepository.create({
      userId,
      action: 'CART_REMOVE',
      entity: 'Product',
      entityId: String(productId),
      result: 'SUCCESS',
      metadata: normalizedSize ? { size: normalizedSize } : undefined,
    })

    return this.listCart(userId)
  },
}
