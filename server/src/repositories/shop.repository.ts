import { prisma } from '../utils/prisma'

export const shopRepository = {
  listCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
    })
  },

  listProducts() {
    return prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  findProductById(productId: number) {
    return prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    })
  },

  findProductBySku(sku: string) {
    return prisma.product.findUnique({
      where: { sku },
      include: { category: true },
    })
  },

  createProduct(data: {
    sku: string
    name: string
    description?: string | null
    image?: string | null
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
  }) {
    return prisma.product.create({
      data,
      include: { category: true },
    })
  },

  updateProduct(
    productId: number,
    data: {
      sku?: string
      name?: string
      description?: string | null
      image?: string | null
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
    return prisma.product.update({
      where: { id: productId },
      data,
      include: { category: true },
    })
  },

  deleteProduct(productId: number) {
    return prisma.product.delete({
      where: { id: productId },
    })
  },

  countProductRelations(productId: number) {
    return Promise.all([
      prisma.orderItem.count({ where: { productId } }),
      prisma.favoriteItem.count({ where: { productId } }),
      prisma.cartItem.count({ where: { productId } }),
    ]).then(([orderItems, favorites, cartItems]) => ({
      orderItems,
      favorites,
      cartItems,
    }))
  },

  listFavorites(userId: string) {
    return prisma.favoriteItem.findMany({
      where: { userId },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  addFavorite(userId: string, productId: number, size: string) {
    return prisma.favoriteItem.upsert({
      where: {
        userId_productId_size: {
          userId,
          productId,
          size,
        },
      },
      create: {
        userId,
        productId,
        size,
      },
      update: { size },
      include: {
        product: {
          include: { category: true },
        },
      },
    })
  },

  removeFavorite(userId: string, productId: number, size?: string) {
    return prisma.favoriteItem.deleteMany({
      where: {
        userId,
        productId,
        ...(size ? { size } : {}),
      },
    })
  },

  listCartItems(userId: string) {
    return prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  findCartItem(userId: string, productId: number, size: string) {
    return prisma.cartItem.findUnique({
      where: {
        userId_productId_size: {
          userId,
          productId,
          size,
        },
      },
    })
  },

  createCartItem(userId: string, productId: number, size: string, quantity: number) {
    return prisma.cartItem.create({
      data: {
        userId,
        productId,
        size,
        quantity,
      },
      include: {
        product: {
          include: { category: true },
        },
      },
    })
  },

  updateCartItem(userId: string, productId: number, size: string, quantity: number) {
    return prisma.cartItem.update({
      where: {
        userId_productId_size: {
          userId,
          productId,
          size,
        },
      },
      data: { quantity },
      include: {
        product: {
          include: { category: true },
        },
      },
    })
  },

  deleteCartItem(userId: string, productId: number, size?: string) {
    return prisma.cartItem.deleteMany({
      where: {
        userId,
        productId,
        ...(size ? { size } : {}),
      },
    })
  },

  findPromoByCode(code: string) {
    return prisma.promoCode.findUnique({
      where: { code },
    })
  },

  countPromoUsage(promoCodeId: number) {
    return prisma.promoUsage.count({
      where: { promoCodeId },
    })
  },

  countPromoUsageByUser(promoCodeId: number, userId: string) {
    return prisma.promoUsage.count({
      where: {
        promoCodeId,
        userId,
      },
    })
  },

  getCartPromo(userId: string) {
    return prisma.cartPromo.findUnique({
      where: { userId },
      include: { promoCode: true },
    })
  },

  setCartPromo(userId: string, promoCodeId: number) {
    return prisma.cartPromo.upsert({
      where: { userId },
      create: {
        userId,
        promoCodeId,
      },
      update: {
        promoCodeId,
        appliedAt: new Date(),
      },
      include: { promoCode: true },
    })
  },

  clearCartPromo(userId: string) {
    return prisma.cartPromo.deleteMany({
      where: { userId },
    })
  },

  listPromoCodes() {
    return prisma.promoCode.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    })
  },

  createPromoCode(data: {
    code: string
    title: string
    description?: string | null
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
    return prisma.promoCode.create({
      data,
    })
  },

  updatePromoCode(
    id: number,
    data: {
      code?: string
      title?: string
      description?: string | null
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
    return prisma.promoCode.update({
      where: { id },
      data,
    })
  },

  deletePromoCode(id: number) {
    return prisma.promoCode.delete({
      where: { id },
    })
  },
}
