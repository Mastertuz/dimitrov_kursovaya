import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const FALLBACK_PRODUCT_IMAGE = '/images/product-fallback.svg'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProductImageSrc(image?: string | null) {
  const normalizedImage = image?.trim()
  return normalizedImage ? normalizedImage : FALLBACK_PRODUCT_IMAGE
}

export function getOrderStatusLabel(statusCode?: string | null, fallbackName?: string | null) {
  switch (statusCode) {
    case 'NEW':
      return 'Новый'
    case 'IN_PROGRESS':
      return 'В обработке'
    case 'APPROVED':
      return 'Подтверждён'
    case 'REJECTED':
      return 'Отклонён'
    case 'CLOSED':
      return 'Завершён'
    default:
      return fallbackName ?? statusCode ?? 'В обработке'
  }
}

export function getPaymentStatusLabel(status?: string | null) {
  switch (status) {
    case 'succeeded':
      return 'Оплачено'
    case 'pending':
    case 'waiting_for_capture':
      return 'В обработке'
    case 'canceled':
      return 'Отменено'
    default:
      return status ?? 'Ожидает подтверждения'
  }
}
