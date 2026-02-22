"use client"

import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ProductActions } from "@/components/product-actions"
import { CopySkuButton } from "@/components/copy-sku-button"
import { getProductImageSrc } from "@/lib/utils"

interface ProductCardProps {
  id: number
  sku: string
  name: string
  price: number
  oldPrice?: number
  image: string
  category: string
  sizes: string[]
  sizeStock: Record<string, number>
  stock: number
  isNew?: boolean
  isSale?: boolean
  isFavorite?: boolean
  initialCartQuantity?: number
  initialCartQuantitiesBySize?: Record<string, number>
  onFavoriteStateChange?: (productId: number, isFavorite: boolean) => void
  onCartQuantityChange?: (productId: number, quantity: number, size: string) => void
}

export function ProductCard({
  id,
  sku,
  name,
  price,
  oldPrice,
  image,
  category,
  sizes,
  sizeStock,
  stock,
  isNew,
  isSale,
  isFavorite,
  initialCartQuantity,
  initialCartQuantitiesBySize,
  onFavoriteStateChange,
  onCartQuantityChange,
}: ProductCardProps) {
  const productImageSrc = getProductImageSrc(image)

  return (
    <div className="group block">
      <Link href={`/product/${sku}`} className="block">
        <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden mb-3">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 z-10" />
        <img
          src={productImageSrc}
          alt={name}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = getProductImageSrc()
          }}
        />
        <div className="absolute top-2 left-2 z-20 flex gap-1.5">
          {stock <= 0 ? (
            <Badge variant="destructive" className="text-[10px] font-medium">
              Нет в наличии
            </Badge>
          ) : null}
          {isNew && (
            <Badge className="bg-foreground text-background text-[10px] font-medium">
              Новинка
            </Badge>
          )}
          {isSale && oldPrice && (
            <Badge variant="destructive" className="text-[10px] font-medium">
              {`-${Math.round(((oldPrice - price) / oldPrice) * 100)}%`}
            </Badge>
          )}
        </div>
        <div className="absolute bottom-2 left-2 right-2 z-20 flex gap-1 flex-wrap opacity-0 group-hover:opacity-100 transition-opacity">
          {sizes.map((s) => (
            <span
              key={s}
              className="bg-background/90 text-foreground text-[10px] px-1.5 py-0.5 rounded"
            >
              {s} · {sizeStock[s] ?? 0}
            </span>
          ))}
        </div>
      </div>
      </Link>
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{category}</p>
        <Link href={`/product/${sku}`} className="block">
          <h3 className="text-sm font-medium leading-tight mb-1 group-hover:underline line-clamp-2">
            {name}
          </h3>
        </Link>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Артикул: {sku}</p>
          <CopySkuButton sku={sku} className="h-6 px-1.5 text-xs" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {price.toLocaleString("ru-RU")} руб.
          </span>
          {oldPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {oldPrice.toLocaleString("ru-RU")} руб.
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {stock > 0 ? `На складе: ${stock} шт.` : "Нет в наличии"}
        </p>
        <ProductActions
          productId={id}
          initialIsFavorite={Boolean(isFavorite)}
          initialCartQuantity={initialCartQuantity}
          initialCartQuantitiesBySize={initialCartQuantitiesBySize}
          availableSizes={sizes}
          sizeStock={sizeStock}
          maxQuantity={stock}
          className="mt-3 space-y-2"
          onFavoriteStateChange={(nextIsFavorite) => onFavoriteStateChange?.(id, nextIsFavorite)}
          onCartQuantityChange={(quantity, size) => onCartQuantityChange?.(id, quantity, size)}
        />
      </div>
    </div>
  )
}
