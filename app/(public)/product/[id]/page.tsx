"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Minus, Plus, Truck, RotateCcw, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductCard } from "@/components/product-card"
import { ProductActions } from "@/components/product-actions"
import { CopySkuButton } from "@/components/copy-sku-button"
import { useAuth } from "@/components/auth/auth-provider"
import { getCart, getProductById, getProducts, SHOP_CHANGED_EVENT, type CatalogProduct } from "@/lib/shop-api"
import { getProductImageSrc } from "@/lib/utils"

function formatGenderLabel(gender: string) {
  if (gender === "male") {
    return "Мужской"
  }

  if (gender === "female") {
    return "Женский"
  }

  if (gender === "kids") {
    return "Детский"
  }

  if (gender === "unisex") {
    return "Унисекс"
  }

  return gender
}

export default function ProductPage() {
  const params = useParams<{ id: string }>()
  const productReference = params.id
  const { token } = useAuth()

  const [product, setProduct] = useState<CatalogProduct | null>(null)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!productReference) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const [productData, allProducts] = await Promise.all([
          getProductById(productReference),
          getProducts(),
        ])

        setProduct(productData)
        setProducts(allProducts)
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [productReference])

  useEffect(() => {
    const loadCart = async () => {
      if (!token) {
        setCartQuantities({})
        return
      }

      try {
        const cart = await getCart(token)
        setCartQuantities(Object.fromEntries(cart.items.map((item) => [`${item.productId}:${item.size}`, item.quantity])))
      } catch {
        setCartQuantities({})
      }
    }

    void loadCart()
  }, [token])

  useEffect(() => {
    if (!token) {
      return
    }

    const syncCart = async () => {
      try {
        const cart = await getCart(token)
        setCartQuantities(Object.fromEntries(cart.items.map((item) => [`${item.productId}:${item.size}`, item.quantity])))
      } catch {
        setCartQuantities({})
      }
    }

    const handleShopChanged = () => {
      void syncCart()
    }

    window.addEventListener(SHOP_CHANGED_EVENT, handleShopChanged)
    return () => {
      window.removeEventListener(SHOP_CHANGED_EVENT, handleShopChanged)
    }
  }, [token])

  const similarProducts = useMemo(() => {
    if (!product) {
      return []
    }

    return products
      .filter((item) => item.id !== product.id && item.categoryKey === product.categoryKey)
      .slice(0, 4)
  }, [product, products])

  useEffect(() => {
    if (!product) {
      setSelectedSize("")
      return
    }

    const firstAvailableSize = product.sizes.find((size) => (product.sizeStock?.[size] ?? 0) > 0) ?? product.sizes[0] ?? ""
    setSelectedSize(firstAvailableSize)
    setQuantity(1)
  }, [product])

  const selectedSizeStock = product && selectedSize ? product.sizeStock?.[selectedSize] ?? 0 : 0

  const productImageSrc = getProductImageSrc(product?.image)

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted-foreground">
        Загрузка товара...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Товар не найден</h1>
        <Button asChild>
          <Link href="/catalog">Вернуться в каталог</Link>
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
            <BreadcrumbLink asChild>
              <Link href="/catalog">Каталог</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="flex-1 min-w-0">
          <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
            {product.stock <= 0 ? (
              <Badge className="absolute top-3 left-3 z-10 bg-destructive text-destructive-foreground text-xs">
                Нет в наличии
              </Badge>
            ) : null}
            {product.isSale && product.oldPrice ? (
              <Badge
                className={`absolute left-3 z-10 bg-destructive text-destructive-foreground text-xs ${
                  product.stock <= 0 ? "top-12" : "top-3"
                }`}
              >
                {`-${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%`}
              </Badge>
            ) : null}
            <img
              src={productImageSrc}
              alt={product.name}
              className="w-full h-full object-cover object-center"
              onError={(event) => {
                event.currentTarget.onerror = null
                event.currentTarget.src = getProductImageSrc()
              }}
            />
          </div>
        </div>

        <div className="lg:w-[420px] shrink-0">
          <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
          <h1 className="text-2xl font-bold tracking-tight mb-2">{product.name}</h1>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs text-muted-foreground">Артикул: {product.sku}</p>
            <CopySkuButton sku={product.sku} />
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-2xl font-bold">{product.price.toLocaleString("ru-RU")} руб.</span>
            {product.oldPrice ? (
              <span className="text-lg text-muted-foreground line-through">
                {product.oldPrice.toLocaleString("ru-RU")} руб.
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {selectedSize
              ? `На складе (${selectedSize}): ${selectedSizeStock} шт.`
              : product.stock > 0
                ? `На складе: ${product.stock} шт.`
                : "Нет в наличии"}
          </p>

          <Separator className="mb-6" />

          <div className="mb-6">
            <span className="text-sm font-semibold mb-3 block">Размер</span>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`text-xs rounded-md border px-3 py-1 transition-colors ${
                    selectedSize === size
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-secondary text-secondary-foreground"
                  }`}
                  onClick={() => {
                    setSelectedSize(size)
                    setQuantity(1)
                  }}
                >
                  {size} · {product.sizeStock?.[size] ?? 0}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <span className="text-sm font-semibold mb-3 block">Количество</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => setQuantity(quantity + 1)}
                disabled={quantity >= selectedSizeStock || selectedSizeStock <= 0}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ProductActions
            productId={product.id}
            quantity={quantity}
            size="large"
            className="mb-6 space-y-2"
            maxQuantity={selectedSizeStock}
            availableSizes={product.sizes}
            sizeStock={product.sizeStock}
            defaultSize={selectedSize}
            initialCartQuantity={cartQuantities[`${product.id}:${selectedSize}`] ?? 0}
            initialCartQuantitiesBySize={Object.fromEntries(
              product.sizes.map((size) => [size, cartQuantities[`${product.id}:${size}`] ?? 0]),
            )}
            onCartQuantityChange={(value, size) => {
              setCartQuantities((current) => ({ ...current, [`${product.id}:${size}`]: value }))
            }}
          />

          <Separator className="mb-6" />

          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Доставка 1-3 дня по Москве</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <RotateCcw className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Возврат в течение 14 дней</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Гарантия качества</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Описание</TabsTrigger>
            <TabsTrigger value="details">Детали</TabsTrigger>
            <TabsTrigger value="delivery">Доставка</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.description ?? "Описание товара скоро будет доступно."}
            </p>
          </TabsContent>
          <TabsContent value="details" className="mt-6">
            <div className="max-w-2xl text-sm text-muted-foreground space-y-2">
              <p>Категория: {product.category}</p>
              <p>Пол: {formatGenderLabel(product.gender)}</p>
              <p>Наличие: {product.availability === "instock" ? "В наличии" : product.availability === "preorder" ? "Под заказ" : "Нет в наличии"}</p>
              <p>Остаток: {product.stock} шт.</p>
            </div>
          </TabsContent>
          <TabsContent value="delivery" className="mt-6">
            <div className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              <p className="mb-2">Бесплатная доставка при заказе от 5 000 руб.</p>
              <p>Курьером по Москве: 1-2 рабочих дня. По России: 3-7 рабочих дней.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {similarProducts.length > 0 ? (
        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight mb-6">Похожие товары</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {similarProducts.map((item) => (
              <ProductCard
                key={item.id}
                {...item}
                initialCartQuantity={cartQuantities[`${item.id}:${item.sizes[0] ?? ""}`] ?? 0}
                initialCartQuantitiesBySize={Object.fromEntries(
                  item.sizes.map((size) => [size, cartQuantities[`${item.id}:${size}`] ?? 0]),
                )}
                onCartQuantityChange={(productId, value, size) => {
                  setCartQuantities((current) => ({ ...current, [`${productId}:${size}`]: value }))
                }}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
