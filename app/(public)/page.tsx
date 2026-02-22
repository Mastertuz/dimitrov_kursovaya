"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Truck, RotateCcw, Shield, Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/product-card"
import { useAuth } from "@/components/auth/auth-provider"
import { getCart, getCategories, getProducts, SHOP_CHANGED_EVENT, type CatalogCategory, type CatalogProduct } from "@/lib/shop-api"

export default function HomePage() {
  const { token } = useAuth()
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [cartQuantities, setCartQuantities] = useState<Record<number, number>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([getProducts(), getCategories()])
        setProducts(productsData)
        setCategories(categoriesData)

        if (token) {
          const cart = await getCart(token)
          setCartQuantities(Object.fromEntries(cart.items.map((item) => [item.productId, item.quantity])))
        } else {
          setCartQuantities({})
        }
      } catch {
        setProducts([])
        setCategories([])
        setCartQuantities({})
      }
    }

    void load()
  }, [token])

  useEffect(() => {
    if (!token) {
      return
    }

    const syncCart = async () => {
      try {
        const cart = await getCart(token)
        setCartQuantities(Object.fromEntries(cart.items.map((item) => [item.productId, item.quantity])))
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

  const categoryImageMap: Record<string, string> = {
    outerwear: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&h=500&fit=crop",
    dresses: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop",
    knitwear: "https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=400&h=500&fit=crop",
    jeans: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop",
    shirts: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop",
    tshirts: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
    pants: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop",
    skirts: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&h=500&fit=crop",
    accessories: "https://images.unsplash.com/photo-1611923134239-b9be5816af0a?w=400&h=500&fit=crop",
  }

  const heroCategories = useMemo(
    () => categories.slice(0, 4).map((category) => ({
      ...category,
      href: `/catalog?category=${category.key}`,
      image:
        categoryImageMap[category.key] ??
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop",
    })),
    [categories],
  )

  const featuredProducts = useMemo(() => {
    const sale = products.filter((product) => product.isSale)
    return (sale.length > 0 ? sale : products).slice(0, 4)
  }, [products])

  const newArrivals = useMemo(() => {
    const latest = products.filter((product) => product.isNew)
    return (latest.length > 0 ? latest : products).slice(0, 4)
  }, [products])

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-muted overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&h=800&fit=crop)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32 lg:py-40">
          <div className="max-w-xl">
            <Badge variant="secondary" className="mb-4 text-xs">
              Новая коллекция 2026
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-4">
              Стиль, который говорит за вас
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
              Откройте для себя коллекцию одежды, которая сочетает комфорт и
              элегантность
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/catalog">
                  Перейти в каталог
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/catalog?sale=true">Распродажа</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Бесплатная доставка</p>
                <p className="text-xs text-muted-foreground">От 5 000 руб.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Возврат 14 дней</p>
                <p className="text-xs text-muted-foreground">Без вопросов</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Гарантия качества</p>
                <p className="text-xs text-muted-foreground">
                  Проверено
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Headphones className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Поддержка 24/7</p>
                <p className="text-xs text-muted-foreground">Всегда на связи</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Категории</h2>
          <Link
            href="/catalog"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Все категории
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {heroCategories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group relative aspect-[4/5] rounded-lg overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${cat.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="text-sm font-semibold text-white">{cat.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              Популярные товары
            </h2>
            <Link
              href="/catalog?sort=popular"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Смотреть все
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((p) => (
              <ProductCard
                key={p.id}
                {...p}
                initialCartQuantity={cartQuantities[p.id] ?? 0}
                onCartQuantityChange={(productId, quantity) => {
                  setCartQuantities((current) => ({
                    ...current,
                    [productId]: quantity,
                  }))
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Новинки</h2>
          <Link
            href="/catalog?sort=new"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Смотреть все
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {newArrivals.map((p) => (
            <ProductCard
              key={p.id}
              {...p}
              initialCartQuantity={cartQuantities[p.id] ?? 0}
              onCartQuantityChange={(productId, quantity) => {
                setCartQuantities((current) => ({
                  ...current,
                  [productId]: quantity,
                }))
              }}
            />
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-balance">
            Подпишитесь на рассылку
          </h2>
          <p className="text-sm opacity-80 mb-6 max-w-md mx-auto">
            Получайте уведомления о новых коллекциях и скидках первыми
          </p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="Ваш email"
              className="flex-1 h-10 px-4 rounded-md bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
            />
            <Button variant="secondary" size="default">
              Подписаться
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
