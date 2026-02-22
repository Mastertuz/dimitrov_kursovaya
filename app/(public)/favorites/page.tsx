"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useAuth } from "@/components/auth/auth-provider"
import {
  getCart,
  getFavorites,
  SHOP_CHANGED_EVENT,
  type FavoriteItem,
} from "@/lib/shop-api"
import { ProductActions } from "@/components/product-actions"
import { CopySkuButton } from "@/components/copy-sku-button"
import { getProductImageSrc } from "@/lib/utils"

export default function FavoritesPage() {
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [items, setItems] = useState<FavoriteItem[]>([])
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    const load = async () => {
      if (!isAuthenticated || !token) {
        setItems([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage(null)
      try {
        const [favorites, cart] = await Promise.all([getFavorites(token), getCart(token)])
        setItems(favorites)
        setCartQuantities(Object.fromEntries(cart.items.map((item) => [`${item.productId}:${item.size}`, item.quantity])))
      } catch {
        setItems([])
        setCartQuantities({})
        setErrorMessage("Не удалось загрузить избранное")
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

    const syncPersonalData = async () => {
      try {
        const [favorites, cart] = await Promise.all([getFavorites(token), getCart(token)])
        setItems(favorites)
        setCartQuantities(Object.fromEntries(cart.items.map((item) => [`${item.productId}:${item.size}`, item.quantity])))
      } catch {
        setErrorMessage("Не удалось синхронизировать данные корзины")
      }
    }

    const handleShopChanged = () => {
      void syncPersonalData()
    }

    window.addEventListener(SHOP_CHANGED_EVENT, handleShopChanged)
    return () => {
      window.removeEventListener(SHOP_CHANGED_EVENT, handleShopChanged)
    }
  }, [isAuthenticated, token])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted-foreground">
        Загрузка избранного...
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Избранное доступно после входа</h1>
        <p className="text-muted-foreground mb-6">Войдите, чтобы видеть свои избранные товары</p>
        <Button asChild>
          <Link href="/login">Войти</Link>
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Избранное пусто</h1>
        <p className="text-muted-foreground mb-6">Добавьте товары из каталога в избранное</p>
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
            <BreadcrumbPage>Избранное</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">Избранное ({items.length})</h1>
  {errorMessage ? <p className="text-sm text-destructive mb-4">{errorMessage}</p> : null}

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="border border-border rounded-lg overflow-hidden">
            <Link href={`/product/${item.product.sku}`} className="block">
              <img
                src={getProductImageSrc(item.product.image)}
                alt={item.product.name}
                className="h-72 w-full bg-muted object-cover object-center"
                onError={(event) => {
                  event.currentTarget.onerror = null
                  event.currentTarget.src = getProductImageSrc()
                }}
              />
            </Link>
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{item.product.category}</p>
              <Link href={`/product/${item.product.sku}`} className="font-medium hover:underline line-clamp-2">
                {item.product.name}
              </Link>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">Артикул: {item.product.sku}</p>
                <CopySkuButton sku={item.product.sku} className="h-6 px-1.5 text-xs" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {item.product.stock > 0 ? `На складе: ${item.product.stock} шт.` : "Нет в наличии"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Размер в избранном: {item.size}</p>
              <p className="text-sm font-semibold mt-2">{item.product.price.toLocaleString("ru-RU")} руб.</p>
              <ProductActions
                productId={item.productId}
                initialIsFavorite
                defaultSize={item.size}
                availableSizes={item.product.sizes}
                sizeStock={item.product.sizeStock}
                initialCartQuantity={cartQuantities[`${item.productId}:${item.size}`] ?? 0}
                initialCartQuantitiesBySize={Object.fromEntries(
                  item.product.sizes.map((size) => [size, cartQuantities[`${item.productId}:${size}`] ?? 0]),
                )}
                maxQuantity={item.product.stock}
                className="mt-4 space-y-2"
                onFavoriteStateChange={(isFavorite) => {
                  if (!isFavorite) {
                    setItems((current) => current.filter((entry) => !(entry.productId === item.productId && entry.size === item.size)))
                  }
                }}
                onAddedToCart={() => {
                  setErrorMessage(null)
                }}
                onCartQuantityChange={(quantity, size) => {
                  setCartQuantities((current) => ({
                    ...current,
                    [`${item.productId}:${size}`]: quantity,
                  }))
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
