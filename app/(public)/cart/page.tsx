"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth/auth-provider"
import { CopySkuButton } from "@/components/copy-sku-button"
import {
  applyCartPromo,
  CartResponse,
  clearCartPromo,
  getCart,
  notifyShopChanged,
  removeCartItem,
  SHOP_CHANGED_EVENT,
  updateCartItem,
} from "@/lib/shop-api"
import { getProductImageSrc } from "@/lib/utils"

export default function CartPage() {
  const router = useRouter()
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingItemKey, setPendingItemKey] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState("")
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    const load = async () => {
      if (!isAuthenticated || !token) {
        setCart({
          items: [],
          summary: { subtotal: 0, discount: 0, delivery: 0, total: 0, totalItems: 0, promoCode: null },
        })
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage(null)
      try {
        const loadedCart = await getCart(token)
        setCart(loadedCart)
        setPromoCode(loadedCart.summary.promoCode?.code ?? "")
      } catch {
        setCart({ items: [], summary: { subtotal: 0, discount: 0, delivery: 0, total: 0, totalItems: 0, promoCode: null } })
        setErrorMessage("Не удалось загрузить корзину")
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [isAuthenticated, isAuthLoading, token])

  useEffect(() => {
    if (!token || !isAuthenticated) {
      return
    }

    const syncCart = async () => {
      try {
        const loadedCart = await getCart(token)
        setCart(loadedCart)
        setPromoCode(loadedCart.summary.promoCode?.code ?? "")
      } catch {
        setErrorMessage("Не удалось синхронизировать корзину")
      }
    }

    const handleShopChanged = () => {
      void syncCart()
    }

    window.addEventListener(SHOP_CHANGED_EVENT, handleShopChanged)
    return () => {
      window.removeEventListener(SHOP_CHANGED_EVENT, handleShopChanged)
    }
  }, [isAuthenticated, token])

  const items = cart?.items ?? []
  const subtotal = cart?.summary.subtotal ?? 0
  const delivery = cart?.summary.delivery ?? 0
  const total = cart?.summary.total ?? 0
  const discount = cart?.summary.discount ?? 0
  const appliedPromo = cart?.summary.promoCode ?? null

  const ensureAuth = () => {
    if (isAuthenticated && token) {
      return token
    }
    router.push("/login")
    return null
  }

  const updateQty = async (productId: number, size: string, quantity: number) => {
    const authToken = ensureAuth()
    if (!authToken) {
      return
    }

    setPendingItemKey(`${productId}:${size}`)
    setErrorMessage(null)
    try {
      const updated = await updateCartItem(authToken, productId, size, quantity)
      setCart(updated)
      notifyShopChanged()
    } catch {
      setErrorMessage("Не удалось обновить корзину")
    } finally {
      setPendingItemKey(null)
    }
  }

  const removeItem = async (productId: number, size: string) => {
    const authToken = ensureAuth()
    if (!authToken) {
      return
    }

    setPendingItemKey(`${productId}:${size}`)
    setErrorMessage(null)
    try {
      const updated = await removeCartItem(authToken, productId, size)
      setCart(updated)
      notifyShopChanged()
    } catch {
      setErrorMessage("Не удалось удалить товар из корзины")
    } finally {
      setPendingItemKey(null)
    }
  }

  const applyPromo = async () => {
    const authToken = ensureAuth()
    if (!authToken) {
      return
    }

    const code = promoCode.trim()
    if (!code) {
      setErrorMessage("Введите промокод")
      return
    }

    setIsApplyingPromo(true)
    setErrorMessage(null)
    try {
      const updated = await applyCartPromo(authToken, code)
      setCart(updated)
      setPromoCode(updated.summary.promoCode?.code ?? code.toUpperCase())
    } catch {
      setErrorMessage("Не удалось применить промокод")
    } finally {
      setIsApplyingPromo(false)
    }
  }

  const removePromo = async () => {
    const authToken = ensureAuth()
    if (!authToken) {
      return
    }

    setIsApplyingPromo(true)
    setErrorMessage(null)
    try {
      const updated = await clearCartPromo(authToken)
      setCart(updated)
      setPromoCode("")
    } catch {
      setErrorMessage("Не удалось отменить промокод")
    } finally {
      setIsApplyingPromo(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted-foreground">
        Загрузка корзины...
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Корзина доступна после входа</h1>
        <p className="text-muted-foreground mb-6">Войдите, чтобы видеть свою персональную корзину</p>
        <Button asChild>
          <Link href="/login">Войти</Link>
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Корзина пуста</h1>
        <p className="text-muted-foreground mb-6">
          Добавьте товары из каталога
        </p>
        {errorMessage ? <p className="text-sm text-destructive mb-4">{errorMessage}</p> : null}
        <Button asChild>
          <Link href="/catalog">Перейти в каталог</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Главная</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Корзина</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
        Корзина ({cart?.summary.totalItems ?? 0})
      </h1>
      {errorMessage ? <p className="text-sm text-destructive mb-4">{errorMessage}</p> : null}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div
                key={`${item.productId}:${item.size}`}
                className="flex gap-4 p-4 border border-border rounded-lg"
              >
                <img
                  src={getProductImageSrc(item.product.image)}
                  alt={item.product.name}
                  className="w-20 h-24 sm:w-24 sm:h-32 rounded-md bg-muted object-cover object-center shrink-0"
                  onError={(event) => {
                    event.currentTarget.onerror = null
                    event.currentTarget.src = getProductImageSrc()
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/product/${item.product.sku}`}
                        className="text-sm font-medium hover:underline line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">Артикул: {item.product.sku}</p>
                        <CopySkuButton sku={item.product.sku} className="h-6 px-1.5 text-xs" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.availableStock > 0 ? `На складе (${item.size}): ${item.availableStock} шт.` : "Нет в наличии"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Размер: {item.size}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.productId, item.size)}
                      disabled={pendingItemKey === `${item.productId}:${item.size}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQty(item.productId, item.size, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQty(item.productId, item.size, item.quantity + 1)}
                        disabled={pendingItemKey === `${item.productId}:${item.size}` || item.quantity >= item.availableStock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-semibold">
                      {(item.product.price * item.quantity).toLocaleString("ru-RU")} руб.
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="lg:w-96 shrink-0">
          <div className="border border-border rounded-lg p-6 sticky top-24">
            <h2 className="font-semibold mb-4">Итого заказа</h2>

            <div className="flex flex-col gap-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Товары ({items.reduce((s, i) => s + i.quantity, 0)} шт.)
                </span>
                <span>{subtotal.toLocaleString("ru-RU")} руб.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Доставка</span>
                <span>
                  {delivery === 0
                    ? "Бесплатно"
                    : `${delivery.toLocaleString("ru-RU")} руб.`}
                </span>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between text-emerald-600">
                  <span>
                    Скидка {appliedPromo ? `(${appliedPromo.code})` : ""}
                  </span>
                  <span>-{discount.toLocaleString("ru-RU")} руб.</span>
                </div>
              ) : null}
            </div>

            <Separator className="mb-4" />

            <div className="flex justify-between font-semibold mb-6">
              <span>Итого</span>
              <span>{total.toLocaleString("ru-RU")} руб.</span>
            </div>

            {/* Promo */}
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Промокод"
                className="h-10 text-sm"
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value)}
              />
              <Button
                variant="outline"
                size="default"
                className="shrink-0"
                onClick={applyPromo}
                disabled={isApplyingPromo || items.length === 0}
              >
                Применить
              </Button>
            </div>
            {appliedPromo ? (
              <div className="flex items-center justify-between gap-3 -mt-4 mb-4">
                <p className="text-xs text-muted-foreground">
                  Применён промокод: {appliedPromo.code} · {appliedPromo.title}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-destructive"
                  onClick={removePromo}
                  disabled={isApplyingPromo}
                >
                  Отменить
                </Button>
              </div>
            ) : null}

            <Button asChild className="w-full h-12" size="lg">
              <Link href="/checkout-date">
                Оформить заказ
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              Бесплатная доставка от 5 000 руб.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
