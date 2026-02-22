'use client'

import { apiRequest } from '@/lib/api-client'

export type CatalogProduct = {
  id: number
  sku: string
  name: string
  description?: string
  price: number
  oldPrice?: number
  isSale?: boolean
  isNew?: boolean
  image: string
  category: string
  categoryKey: string
  sizes: string[]
  sizeStock: Record<string, number>
  stock: number
  availability: string
  color: string
  material: string
  gender: string
  season: string
  brand: string
}

export type CatalogCategory = {
  id: number
  name: string
  key: string
}

export type FavoriteItem = {
  id: string
  productId: number
  size: string
  createdAt: string
  product: CatalogProduct
}

export type CartItem = {
  id: string
  productId: number
  size: string
  quantity: number
  availableStock: number
  product: CatalogProduct
}

export type CartResponse = {
  items: CartItem[]
  summary: {
    subtotal: number
    discount: number
    delivery: number
    total: number
    totalItems: number
    promoCode: {
      code: string
      title: string
    } | null
  }
}

export type CreateOrderInput = {
  items: Array<{ productId: number; size?: string; quantity: number }>
  deliveryAddress: string
  recipientName?: string
  recipientPhone?: string
  deliveryDate?: string
}

export type PromoCodeDto = {
  id: number
  code: string
  title: string
  description?: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
  minSubtotal: number | null
  maxDiscount: number | null
  usageLimit: number | null
  perUserLimit: number | null
  usedCount: number
  startsAt: string | null
  endsAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type AdminProductInput = {
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
}

export const SHOP_CHANGED_EVENT = 'shop:changed'

export function notifyShopChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SHOP_CHANGED_EVENT))
  }
}

export function getProducts() {
  return apiRequest<CatalogProduct[]>('/products')
}

export function getCategories() {
  return apiRequest<CatalogCategory[]>('/categories')
}

export function getProductById(productId: number | string) {
  return apiRequest<CatalogProduct>(`/products/${productId}`)
}

export function getFavorites(token: string) {
  return apiRequest<FavoriteItem[]>('/favorites', { token })
}

export function addFavorite(token: string, productId: number, size: string) {
  return apiRequest<FavoriteItem>('/favorites', {
    method: 'POST',
    token,
    body: { productId, size },
  })
}

export function removeFavorite(token: string, productId: number, size?: string) {
  const search = size ? `?size=${encodeURIComponent(size)}` : ''
  return apiRequest<void>(`/favorites/${productId}${search}`, {
    method: 'DELETE',
    token,
  })
}

export function getCart(token: string) {
  return apiRequest<CartResponse>('/cart', { token })
}

export function addToCart(token: string, productId: number, size: string, quantity = 1) {
  return apiRequest<CartResponse>('/cart', {
    method: 'POST',
    token,
    body: { productId, size, quantity },
  })
}

export function updateCartItem(token: string, productId: number, size: string, quantity: number) {
  return apiRequest<CartResponse>(`/cart/${productId}`, {
    method: 'PATCH',
    token,
    body: { size, quantity },
  })
}

export function removeCartItem(token: string, productId: number, size?: string) {
  const search = size ? `?size=${encodeURIComponent(size)}` : ''
  return apiRequest<CartResponse>(`/cart/${productId}${search}`, {
    method: 'DELETE',
    token,
  })
}

export function applyCartPromo(token: string, code: string) {
  return apiRequest<CartResponse>('/cart/apply-promo', {
    method: 'POST',
    token,
    body: { code },
  })
}

export function clearCartPromo(token: string) {
  return apiRequest<CartResponse>('/cart/promo', {
    method: 'DELETE',
    token,
  })
}

export function listAdminPromoCodes(token: string) {
  return apiRequest<PromoCodeDto[]>('/admin/promo-codes', { token })
}

export function createAdminPromoCode(
  token: string,
  body: Omit<PromoCodeDto, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>,
) {
  return apiRequest<PromoCodeDto>('/admin/promo-codes', {
    method: 'POST',
    token,
    body,
  })
}

export function updateAdminPromoCode(
  token: string,
  promoId: number,
  body: Partial<Omit<PromoCodeDto, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>>,
) {
  return apiRequest<PromoCodeDto>(`/admin/promo-codes/${promoId}`, {
    method: 'PATCH',
    token,
    body,
  })
}

export function deleteAdminPromoCode(token: string, promoId: number) {
  return apiRequest<void>(`/admin/promo-codes/${promoId}`, {
    method: 'DELETE',
    token,
  })
}

export function createAdminProduct(token: string, body: AdminProductInput) {
  return apiRequest<CatalogProduct>('/admin/products', {
    method: 'POST',
    token,
    body,
  })
}

export function updateAdminProduct(token: string, productId: number, body: Partial<AdminProductInput>) {
  return apiRequest<CatalogProduct>(`/admin/products/${productId}`, {
    method: 'PATCH',
    token,
    body,
  })
}

export function deleteAdminProduct(token: string, productId: number) {
  return apiRequest<void>(`/admin/products/${productId}`, {
    method: 'DELETE',
    token,
  })
}

export function createOrder(token: string, body: CreateOrderInput) {
  return apiRequest<{
    id: string
    createdAt: string
    deliveryDate?: string | null
  }>('/orders', {
    method: 'POST',
    token,
    body,
  })
}

export function checkoutOrderWithYooKassa(
  token: string,
  body: CreateOrderInput & { returnUrl?: string },
) {
  return apiRequest<{
    orderId: string
    paymentId: string
    paymentStatus: string
    confirmationUrl: string
  }>('/orders/checkout', {
    method: 'POST',
    token,
    body,
  })
}
