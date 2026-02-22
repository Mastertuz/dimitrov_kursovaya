"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal, Grid3X3, LayoutGrid, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ProductCard } from "@/components/product-card"
import {
  CatalogFilters,
  availabilityOptions,
  brandOptions,
  categoryOptions,
  colorOptions,
  defaultCatalogFilters,
  genderOptions,
  materialOptions,
  seasonOptions,
  type CatalogFiltersState,
} from "@/components/catalog/catalog-filters"
import { useAuth } from "@/components/auth/auth-provider"
import {
  getCart,
  getFavorites,
  getProducts,
  SHOP_CHANGED_EVENT,
  type CatalogProduct,
} from "@/lib/shop-api"

function CatalogPageContent() {
  const PAGE_SIZE_GRID3 = 9
  const PAGE_SIZE_GRID4 = 12

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useAuth()
  const [grid, setGrid] = useState<"grid3" | "grid4">("grid4")
  const [sort, setSort] = useState("popular")
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({})
  const [filters, setFilters] = useState<CatalogFiltersState>(defaultCatalogFilters)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUrlStateReady, setIsUrlStateReady] = useState(false)
  const isInternalUrlUpdateRef = useRef(false)

  const areStringArraysEqual = (left: string[], right: string[]) => {
    if (left.length !== right.length) {
      return false
    }

    return left.every((value, index) => value === right[index])
  }

  const areFiltersEqual = (left: CatalogFiltersState, right: CatalogFiltersState) => {
    return (
      left.onlyNew === right.onlyNew &&
      left.onlySale === right.onlySale &&
      left.priceRange[0] === right.priceRange[0] &&
      left.priceRange[1] === right.priceRange[1] &&
      areStringArraysEqual(left.categories, right.categories) &&
      areStringArraysEqual(left.sizes, right.sizes) &&
      areStringArraysEqual(left.colors, right.colors) &&
      areStringArraysEqual(left.materials, right.materials) &&
      areStringArraysEqual(left.genders, right.genders) &&
      areStringArraysEqual(left.seasons, right.seasons) &&
      areStringArraysEqual(left.brands, right.brands) &&
      areStringArraysEqual(left.availability, right.availability)
    )
  }

  const normalizeQueryString = (params: URLSearchParams) => {
    const pairs = Array.from(params.entries()).sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey === rightKey) {
        return leftValue.localeCompare(rightValue)
      }

      return leftKey.localeCompare(rightKey)
    })

    const normalized = new URLSearchParams()
    pairs.forEach(([key, value]) => {
      normalized.append(key, value)
    })

    return normalized.toString()
  }

  const buildParamsFromState = (
    currentFilters: CatalogFiltersState,
    currentSort: string,
    currentSearchQuery: string,
    baseParams: URLSearchParams,
  ) => {
    const nextParams = new URLSearchParams(baseParams.toString())

    nextParams.delete("category")
    nextParams.delete("gender")
    nextParams.delete("sale")
    nextParams.delete("sort")
    nextParams.delete("q")
    nextParams.delete("search")

    currentFilters.categories.forEach((value) => {
      nextParams.append("category", value)
    })

    currentFilters.genders.forEach((value) => {
      nextParams.append("gender", value)
    })

    if (currentFilters.onlySale) {
      nextParams.set("sale", "true")
    }

    if (currentFilters.onlyNew) {
      nextParams.set("sort", "new")
    } else if (currentSort !== "popular") {
      nextParams.set("sort", currentSort)
    }

    const trimmedQuery = currentSearchQuery.trim()
    if (trimmedQuery.length > 0) {
      nextParams.set("q", trimmedQuery)
    }

    return nextParams
  }

  const optionLabelMaps = {
    categories: new Map(categoryOptions.map((item) => [item.id, item.label])),
    colors: new Map(colorOptions.map((item) => [item.id, item.label])),
    materials: new Map(materialOptions.map((item) => [item.id, item.label])),
    genders: new Map(genderOptions.map((item) => [item.id, item.label])),
    seasons: new Map(seasonOptions.map((item) => [item.id, item.label])),
    brands: new Map(brandOptions.map((item) => [item.id, item.label])),
    availability: new Map(availabilityOptions.map((item) => [item.id, item.label])),
  }

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const loadedProducts = await getProducts()
        setProducts(loadedProducts)

        if (token) {
          const [favorites, cart] = await Promise.all([getFavorites(token), getCart(token)])
          setFavoriteIds(favorites.map((entry) => entry.productId))
          const quantities = Object.fromEntries(cart.items.map((item) => [`${item.productId}:${item.size}`, item.quantity]))
          setCartQuantities(quantities)
        } else {
          setFavoriteIds([])
          setCartQuantities({})
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [token])

  useEffect(() => {
    if (!token) {
      return
    }

    const syncPersonalData = async () => {
      try {
        const [favorites, cart] = await Promise.all([getFavorites(token), getCart(token)])
        setFavoriteIds(favorites.map((entry) => entry.productId))
        setCartQuantities(Object.fromEntries(cart.items.map((item) => [`${item.productId}:${item.size}`, item.quantity])))
      } catch {
        setFavoriteIds([])
        setCartQuantities({})
      }
    }

    const handleShopChanged = () => {
      void syncPersonalData()
    }

    window.addEventListener(SHOP_CHANGED_EVENT, handleShopChanged)
    return () => {
      window.removeEventListener(SHOP_CHANGED_EVENT, handleShopChanged)
    }
  }, [token])

  useEffect(() => {
    if (isInternalUrlUpdateRef.current) {
      isInternalUrlUpdateRef.current = false
      if (!isUrlStateReady) {
        setIsUrlStateReady(true)
      }
      return
    }

    const categories = searchParams.getAll("category")
    const genders = searchParams.getAll("gender")
    const sale = searchParams.get("sale")
    const sortParam = searchParams.get("sort")
    const queryParam = searchParams.get("q") ?? searchParams.get("search") ?? ""

    const nextFilters: CatalogFiltersState = {
      ...defaultCatalogFilters,
      categories: categories,
      genders: genders,
      onlySale: sale === "true",
      onlyNew: sortParam === "new",
    }

    const nextSearchQuery = queryParam.trim()

    const nextSort =
      sortParam && ["popular", "price_asc", "price_desc", "name"].includes(sortParam)
        ? sortParam
        : "popular"

    setFilters((current) => (areFiltersEqual(current, nextFilters) ? current : nextFilters))
    setSearchQuery((current) => (current === nextSearchQuery ? current : nextSearchQuery))
    setSort((current) => (current === nextSort ? current : nextSort))

    if (!isUrlStateReady) {
      setIsUrlStateReady(true)
    }
  }, [searchParams, isUrlStateReady])

  useEffect(() => {
    if (!isUrlStateReady) {
      return
    }

    const baseParams = new URLSearchParams(searchParams.toString())
    const nextParams = buildParamsFromState(filters, sort, searchQuery, baseParams)
    const nextQueryString = normalizeQueryString(nextParams)
    const currentQueryString = normalizeQueryString(baseParams)

    if (nextQueryString === currentQueryString) {
      return
    }

    isInternalUrlUpdateRef.current = true
    router.replace(nextQueryString.length > 0 ? `${pathname}?${nextQueryString}` : pathname)
  }, [filters, sort, searchQuery, searchParams, pathname, router, isUrlStateReady])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const base = products.filter((product) => {
      if (normalizedQuery.length > 0) {
        const searchableText = [
          product.name,
          product.sku,
          product.category,
          product.brand,
          product.description ?? "",
        ]
          .join(" ")
          .toLowerCase()

        if (!searchableText.includes(normalizedQuery)) {
          return false
        }
      }

      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false
      }

      if (filters.onlyNew && !product.isNew) {
        return false
      }

      if (filters.onlySale && !product.isSale) {
        return false
      }

      if (filters.categories.length > 0 && !filters.categories.includes(product.categoryKey)) {
        return false
      }

      if (filters.sizes.length > 0 && !product.sizes.some((size) => filters.sizes.includes(size))) {
        return false
      }

      if (filters.colors.length > 0 && !filters.colors.includes(product.color)) {
        return false
      }

      if (filters.materials.length > 0 && !filters.materials.includes(product.material)) {
        return false
      }

      if (filters.genders.length > 0 && !filters.genders.includes(product.gender)) {
        return false
      }

      if (filters.seasons.length > 0 && !filters.seasons.includes(product.season)) {
        return false
      }

      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
        return false
      }

      if (filters.availability.length > 0 && !filters.availability.includes(product.availability)) {
        return false
      }

      return true
    })

    if (sort === "price_asc") {
      return [...base].sort((a, b) => a.price - b.price)
    }
    if (sort === "price_desc") {
      return [...base].sort((a, b) => b.price - a.price)
    }
    if (sort === "name") {
      return [...base].sort((a, b) => a.name.localeCompare(b.name, "ru"))
    }

    return base
  }, [filters, products, searchQuery, sort])

  const activeFiltersCount = useMemo(() => {
    return (
      filters.categories.length +
      filters.sizes.length +
      filters.colors.length +
      filters.materials.length +
      filters.genders.length +
      filters.seasons.length +
      filters.brands.length +
      filters.availability.length +
      (searchQuery.trim().length > 0 ? 1 : 0) +
      (filters.onlySale ? 1 : 0) +
      (filters.onlyNew ? 1 : 0) +
      (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000 ? 1 : 0)
    )
  }, [filters, searchQuery])

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = []

    filters.categories.forEach((value) => {
      chips.push({
        key: `category-${value}`,
        label: optionLabelMaps.categories.get(value) ?? value,
        onRemove: () =>
          setFilters((current) => ({
            ...current,
            categories: current.categories.filter((item) => item !== value),
          })),
      })
    })

    filters.genders.forEach((value) => {
      chips.push({
        key: `gender-${value}`,
        label: optionLabelMaps.genders.get(value) ?? value,
        onRemove: () =>
          setFilters((current) => ({
            ...current,
            genders: current.genders.filter((item) => item !== value),
          })),
      })
    })

    filters.sizes.forEach((value) => {
      chips.push({
        key: `size-${value}`,
        label: `Размер ${value}`,
        onRemove: () =>
          setFilters((current) => ({
            ...current,
            sizes: current.sizes.filter((item) => item !== value),
          })),
      })
    })

    filters.colors.forEach((value) => {
      chips.push({
        key: `color-${value}`,
        label: optionLabelMaps.colors.get(value) ?? value,
        onRemove: () =>
          setFilters((current) => ({
            ...current,
            colors: current.colors.filter((item) => item !== value),
          })),
      })
    })

    filters.materials.forEach((value) => {
      chips.push({
        key: `material-${value}`,
        label: optionLabelMaps.materials.get(value) ?? value,
        onRemove: () =>
          setFilters((current) => ({
            ...current,
            materials: current.materials.filter((item) => item !== value),
          })),
      })
    })

    filters.seasons.forEach((value) => {
      chips.push({
        key: `season-${value}`,
        label: optionLabelMaps.seasons.get(value) ?? value,
        onRemove: () =>
          setFilters((current) => ({
            ...current,
            seasons: current.seasons.filter((item) => item !== value),
          })),
      })
    })

    filters.brands.forEach((value) => {
      chips.push({
        key: `brand-${value}`,
        label: optionLabelMaps.brands.get(value) ?? value,
        onRemove: () =>
          setFilters((current) => ({
            ...current,
            brands: current.brands.filter((item) => item !== value),
          })),
      })
    })

    filters.availability.forEach((value) => {
      chips.push({
        key: `availability-${value}`,
        label: optionLabelMaps.availability.get(value) ?? value,
        onRemove: () =>
          setFilters((current) => ({
            ...current,
            availability: current.availability.filter((item) => item !== value),
          })),
      })
    })

    if (filters.onlySale) {
      chips.push({
        key: "onlySale",
        label: "Только со скидкой",
        onRemove: () => setFilters((current) => ({ ...current, onlySale: false })),
      })
    }

    if (filters.onlyNew) {
      chips.push({
        key: "onlyNew",
        label: "Только новинки",
        onRemove: () => setFilters((current) => ({ ...current, onlyNew: false })),
      })
    }

    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) {
      chips.push({
        key: "priceRange",
        label: `${filters.priceRange[0].toLocaleString("ru-RU")} - ${filters.priceRange[1].toLocaleString("ru-RU")} руб.`,
        onRemove: () =>
          setFilters((current) => ({
            ...current,
            priceRange: [0, 50000],
          })),
      })
    }

    if (searchQuery.trim().length > 0) {
      chips.push({
        key: "searchQuery",
        label: `Поиск: ${searchQuery}`,
        onRemove: () => setSearchQuery(""),
      })
    }

    return chips
  }, [filters, optionLabelMaps.availability, optionLabelMaps.brands, optionLabelMaps.categories, optionLabelMaps.colors, optionLabelMaps.genders, optionLabelMaps.materials, optionLabelMaps.seasons, searchQuery])

  const pageSize = grid === "grid3" ? PAGE_SIZE_GRID3 : PAGE_SIZE_GRID4
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))

  const requestedPage = useMemo(() => {
    const rawValue = searchParams.get("page")
    const parsedValue = Number(rawValue)

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      return 1
    }

    return parsedValue
  }, [searchParams])

  const currentPage = Math.min(requestedPage, totalPages)

  const setPage = (page: number) => {
    const clampedPage = Math.min(Math.max(page, 1), totalPages)
    const params = new URLSearchParams(searchParams.toString())

    if (clampedPage <= 1) {
      params.delete("page")
    } else {
      params.set("page", String(clampedPage))
    }

    const queryString = params.toString()
    router.push(queryString.length > 0 ? `${pathname}?${queryString}` : pathname)
  }

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [currentPage, filteredProducts, pageSize])

  const pageItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis", totalPages] as const
    }

    if (currentPage >= totalPages - 3) {
      return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const
    }

    return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages] as const
  }, [currentPage, totalPages])

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
            <BreadcrumbPage>Каталог</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Каталог одежды
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredProducts.length} товаров
          </p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop filters */}
        <div className="hidden lg:block w-64 shrink-0">
          <CatalogFilters value={filters} onChange={setFilters} />
        </div>

        {/* Products area */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              {/* Mobile filter trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Фильтры
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Фильтры</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <CatalogFilters value={filters} onChange={setFilters} />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Active filters badges */}
              <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
                {activeFiltersCount > 0 ? (
                  <>
                    <Badge variant="secondary" className="text-xs gap-1">
                      Фильтров: {activeFiltersCount}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setFilters(defaultCatalogFilters)}
                    >
                      Сбросить
                      <X className="h-3 w-3 ml-1" />
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1">
                <Button
                  variant={grid === "grid3" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setGrid("grid3")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={grid === "grid4" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setGrid("grid4")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">По популярности</SelectItem>
                  <SelectItem value="price_asc">Цена по возрастанию</SelectItem>
                  <SelectItem value="price_desc">Цена по убыванию</SelectItem>
                  <SelectItem value="name">По названию</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products grid */}
          <div
            className={`grid gap-4 md:gap-6 ${
              grid === "grid3"
                ? "grid-cols-2 md:grid-cols-3"
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {activeFilterChips.length > 0 ? (
              <div className="col-span-full flex flex-wrap gap-2 pb-1">
                {activeFilterChips.map((chip) => (
                  <Button
                    key={chip.key}
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={chip.onRemove}
                  >
                    {chip.label}
                    <X className="h-3 w-3 ml-1" />
                  </Button>
                ))}
              </div>
            ) : null}

            {isLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-72 rounded-lg bg-muted animate-pulse" />
                ))
              : paginatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    {...p}
                    isFavorite={favoriteIds.includes(p.id)}
                    initialCartQuantity={cartQuantities[`${p.id}:${p.sizes[0] ?? ""}`] ?? 0}
                    initialCartQuantitiesBySize={Object.fromEntries(
                      p.sizes.map((size) => [size, cartQuantities[`${p.id}:${size}`] ?? 0]),
                    )}
                    onFavoriteStateChange={(productId, isFavorite) => {
                      setFavoriteIds((current) => {
                        if (isFavorite) {
                          return current.includes(productId) ? current : [...current, productId]
                        }

                        return current.filter((id) => id !== productId)
                      })
                    }}
                    onCartQuantityChange={(productId, quantity, size) => {
                      setCartQuantities((current) => ({
                        ...current,
                        [`${productId}:${size}`]: quantity,
                      }))
                    }}
                  />
                ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-10">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Назад
            </Button>
            {pageItems.map((item, index) =>
              item === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className="text-muted-foreground text-sm px-1">
                  ...
                </span>
              ) : (
                <Button
                  key={item}
                  variant={currentPage === item ? "default" : "outline"}
                  size="sm"
                  className="min-w-[2.5rem]"
                  onClick={() => setPage(item)}
                  disabled={isLoading}
                >
                  {item}
                </Button>
              ),
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Вперед
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted-foreground">
          Загрузка каталога...
        </div>
      }
    >
      <CatalogPageContent />
    </Suspense>
  )
}
