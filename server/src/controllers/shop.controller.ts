import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { shopService } from '../services/shop.service'

const productIdParamSchema = z.object({
  productId: z.coerce.number().int().positive(),
})

const productReferenceParamSchema = z.object({
  productId: z.string().min(1),
})

const cartBodySchema = z.object({
  productId: z.number().int().positive(),
  size: z.string().trim().min(1),
  quantity: z.number().int().positive(),
})

const cartUpdateBodySchema = z.object({
  size: z.string().trim().min(1),
  quantity: z.number().int(),
})

const applyPromoBodySchema = z.object({
  code: z.string().trim().min(1),
})

const promoIdParamSchema = z.object({
  promoId: z.coerce.number().int().positive(),
})

const promoBaseSchema = z.object({
  code: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  discountType: z.enum(['PERCENT', 'FIXED']),
  discountValue: z.number().positive(),
  minSubtotal: z.number().nonnegative().nullable().optional(),
  maxDiscount: z.number().positive().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  perUserLimit: z.number().int().positive().nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
})

const promoCreateSchema = promoBaseSchema

const promoUpdateSchema = promoBaseSchema.partial()

const productBaseSchema = z.object({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  image: z.string().trim().url().optional(),
  price: z.number().positive(),
  oldPrice: z.number().nonnegative().nullable().optional(),
  isSale: z.boolean().optional(),
  isNew: z.boolean().optional(),
  sizes: z.array(z.string().trim().min(1)).optional(),
  sizeStock: z.record(z.string().trim().min(1), z.number().int().nonnegative()).optional(),
  color: z.string().trim().optional(),
  material: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  season: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  stock: z.number().int().nonnegative().optional(),
  categoryId: z.number().int().positive().nullable().optional(),
})

const productCreateSchema = productBaseSchema
const productUpdateSchema = productBaseSchema.partial()

export const shopController = {
  async listCategories(_request: Request, response: Response, next: NextFunction) {
    try {
      const categories = await shopService.listCategories()
      response.json(categories)
    } catch (error) {
      next(error)
    }
  },

  async listProducts(_request: Request, response: Response, next: NextFunction) {
    try {
      const products = await shopService.listProducts()
      response.json(products)
    } catch (error) {
      next(error)
    }
  },

  async getProductById(request: Request, response: Response, next: NextFunction) {
    try {
      const { productId } = productReferenceParamSchema.parse(request.params)
      const product = await shopService.getProductByReference(productId)
      response.json(product)
    } catch (error) {
      next(error)
    }
  },

  async createProduct(request: Request, response: Response, next: NextFunction) {
    try {
      const body = productCreateSchema.parse(request.body)
      const product = await shopService.createProduct(request.user!.userId, body)
      response.status(201).json(product)
    } catch (error) {
      next(error)
    }
  },

  async updateProduct(request: Request, response: Response, next: NextFunction) {
    try {
      const { productId } = productIdParamSchema.parse(request.params)
      const body = productUpdateSchema.parse(request.body)
      const product = await shopService.updateProduct(request.user!.userId, productId, body)
      response.json(product)
    } catch (error) {
      next(error)
    }
  },

  async deleteProduct(request: Request, response: Response, next: NextFunction) {
    try {
      const { productId } = productIdParamSchema.parse(request.params)
      await shopService.deleteProduct(request.user!.userId, productId)
      response.status(204).send()
    } catch (error) {
      next(error)
    }
  },

  async listFavorites(request: Request, response: Response, next: NextFunction) {
    try {
      const favorites = await shopService.listFavorites(request.user!.userId)
      response.json(favorites)
    } catch (error) {
      next(error)
    }
  },

  async addFavorite(request: Request, response: Response, next: NextFunction) {
    try {
      const body = z.object({ productId: z.number().int().positive(), size: z.string().trim().min(1) }).parse(request.body)
      const favorite = await shopService.addFavorite(request.user!.userId, body.productId, body.size)
      response.status(201).json(favorite)
    } catch (error) {
      next(error)
    }
  },

  async removeFavorite(request: Request, response: Response, next: NextFunction) {
    try {
      const { productId } = productIdParamSchema.parse(request.params)
      const query = z.object({ size: z.string().trim().min(1).optional() }).parse(request.query)
      await shopService.removeFavorite(request.user!.userId, productId, query.size)
      response.status(204).send()
    } catch (error) {
      next(error)
    }
  },

  async listCart(request: Request, response: Response, next: NextFunction) {
    try {
      const cart = await shopService.listCart(request.user!.userId)
      response.json(cart)
    } catch (error) {
      next(error)
    }
  },

  async addToCart(request: Request, response: Response, next: NextFunction) {
    try {
      const body = cartBodySchema.parse(request.body)
      const cart = await shopService.addToCart(request.user!.userId, body)
      response.status(201).json(cart)
    } catch (error) {
      next(error)
    }
  },

  async updateCartItem(request: Request, response: Response, next: NextFunction) {
    try {
      const { productId } = productIdParamSchema.parse(request.params)
      const body = cartUpdateBodySchema.parse(request.body)

      const cart = await shopService.updateCartItem(request.user!.userId, {
        productId,
        size: body.size,
        quantity: body.quantity,
      })

      response.json(cart)
    } catch (error) {
      next(error)
    }
  },

  async removeFromCart(request: Request, response: Response, next: NextFunction) {
    try {
      const { productId } = productIdParamSchema.parse(request.params)
      const query = z.object({ size: z.string().trim().min(1).optional() }).parse(request.query)
      const cart = await shopService.removeFromCart(request.user!.userId, productId, query.size)
      response.json(cart)
    } catch (error) {
      next(error)
    }
  },

  async applyPromo(request: Request, response: Response, next: NextFunction) {
    try {
      const body = applyPromoBodySchema.parse(request.body)
      const cart = await shopService.applyPromoToCart(request.user!.userId, body.code)
      response.json(cart)
    } catch (error) {
      next(error)
    }
  },

  async clearPromo(request: Request, response: Response, next: NextFunction) {
    try {
      const cart = await shopService.clearPromoFromCart(request.user!.userId)
      response.json(cart)
    } catch (error) {
      next(error)
    }
  },

  async listPromoCodes(_request: Request, response: Response, next: NextFunction) {
    try {
      const promoCodes = await shopService.listPromoCodes()
      response.json(promoCodes)
    } catch (error) {
      next(error)
    }
  },

  async createPromoCode(request: Request, response: Response, next: NextFunction) {
    try {
      const body = promoCreateSchema.parse(request.body)
      const promo = await shopService.createPromoCode({
        ...body,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      })
      response.status(201).json(promo)
    } catch (error) {
      next(error)
    }
  },

  async updatePromoCode(request: Request, response: Response, next: NextFunction) {
    try {
      const { promoId } = promoIdParamSchema.parse(request.params)
      const body = promoUpdateSchema.parse(request.body)
      const promo = await shopService.updatePromoCode(promoId, {
        ...body,
        startsAt: body.startsAt === undefined ? undefined : body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt === undefined ? undefined : body.endsAt ? new Date(body.endsAt) : null,
      })
      response.json(promo)
    } catch (error) {
      next(error)
    }
  },

  async deletePromoCode(request: Request, response: Response, next: NextFunction) {
    try {
      const { promoId } = promoIdParamSchema.parse(request.params)
      await shopService.deletePromoCode(promoId)
      response.status(204).send()
    } catch (error) {
      next(error)
    }
  },
}
