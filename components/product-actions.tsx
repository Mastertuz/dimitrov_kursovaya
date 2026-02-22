"use client"

import { useEffect, useState } from "react"
import { Heart, ShoppingBag } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  addFavorite,
  addToCart,
  notifyShopChanged,
  removeFavorite,
  type CartResponse,
  updateCartItem,
} from "@/lib/shop-api"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "@/hooks/use-toast"

type ProductActionsProps = {
  productId: number
  initialIsFavorite?: boolean
  initialCartQuantity?: number
  initialCartQuantitiesBySize?: Record<string, number>
  availableSizes?: string[]
  sizeStock?: Record<string, number>
  defaultSize?: string
  quantity?: number
  maxQuantity?: number
  size?: "default" | "large"
  className?: string
  onFavoriteStateChange?: (isFavorite: boolean) => void
  onAddedToCart?: () => void
  onCartQuantityChange?: (quantity: number, size: string) => void
}

export function ProductActions({
  productId,
  initialIsFavorite = false,
  initialCartQuantity = 0,
  initialCartQuantitiesBySize,
  availableSizes,
  sizeStock,
  defaultSize,
  quantity = 1,
  maxQuantity,
  size = "default",
  className,
  onFavoriteStateChange,
  onAddedToCart,
  onCartQuantityChange,
}: ProductActionsProps) {
  const router = useRouter()
  const { token, isAuthenticated } = useAuth()
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [cartQuantity, setCartQuantity] = useState(initialCartQuantity)
  const [selectedSize, setSelectedSize] = useState<string>(
    defaultSize ?? availableSizes?.[0] ?? Object.keys(sizeStock ?? {})[0] ?? "",
  )
  const [isBusy, setIsBusy] = useState(false)

  const normalizedAvailableSizes = (availableSizes && availableSizes.length > 0
    ? availableSizes
    : Object.keys(sizeStock ?? {})) as string[]
  const selectedSizeStock = selectedSize ? sizeStock?.[selectedSize] ?? maxQuantity : maxQuantity
  const totalAvailableStock =
    sizeStock && Object.keys(sizeStock).length > 0
      ? Object.values(sizeStock).reduce((sum, value) => sum + value, 0)
      : (maxQuantity ?? 0)
  const isOutOfStock = totalAvailableStock <= 0

  useEffect(() => {
    setIsFavorite(initialIsFavorite)
  }, [initialIsFavorite])

  useEffect(() => {
    setCartQuantity(initialCartQuantity)
  }, [initialCartQuantity])

  useEffect(() => {
    const nextDefaultSize = defaultSize ?? normalizedAvailableSizes[0] ?? ""
    if (!selectedSize && nextDefaultSize) {
      setSelectedSize(nextDefaultSize)
    }
  }, [defaultSize, normalizedAvailableSizes, selectedSize])

  useEffect(() => {
    if (!selectedSize) {
      return
    }

    if (initialCartQuantitiesBySize) {
      setCartQuantity(initialCartQuantitiesBySize[selectedSize] ?? 0)
      return
    }

    setCartQuantity(initialCartQuantity)
  }, [initialCartQuantitiesBySize, initialCartQuantity, selectedSize])

  const getQuantityFromResponse = (response: CartResponse) => {
    const updatedItem = response.items.find((item) => item.productId === productId && item.size === selectedSize)
    return updatedItem?.quantity ?? 0
  }

  const requireAuth = () => {
    if (isAuthenticated && token) {
      return token
    }

    toast({
      title: "Требуется авторизация",
      description: "Войдите в аккаунт, чтобы добавлять товары.",
      variant: "destructive",
    })
    router.push("/login")
    return null
  }

  const handleToggleFavorite = async () => {
    const authToken = requireAuth()
    if (!authToken) {
      return
    }

    setIsBusy(true)
    try {
      if (isFavorite) {
        await removeFavorite(authToken, productId, selectedSize)
        setIsFavorite(false)
        onFavoriteStateChange?.(false)
        toast({
          title: "Удалено из избранного",
          description: "Товар убран из избранного.",
        })
      } else {
        if (!selectedSize) {
          toast({ title: "Выберите размер", description: "Перед добавлением выберите размер." })
          return
        }
        await addFavorite(authToken, productId, selectedSize)
        setIsFavorite(true)
        onFavoriteStateChange?.(true)
        toast({
          title: "Добавлено в избранное",
          description: "Товар сохранен в избранном.",
        })
      }
      notifyShopChanged()
    } catch {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить избранное.",
        variant: "destructive",
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleAddToCart = async () => {
    const authToken = requireAuth()
    if (!authToken) {
      return
    }

    if (selectedSizeStock !== undefined && selectedSizeStock <= 0) {
      toast({
        title: "Нет на складе",
        description: "Этот товар сейчас недоступен для заказа.",
        variant: "destructive",
      })
      return
    }

    if (!selectedSize) {
      toast({ title: "Выберите размер", description: "Перед добавлением выберите размер." })
      return
    }

    setIsBusy(true)
    try {
      const response = await addToCart(authToken, productId, selectedSize, quantity)
      const nextQuantity = getQuantityFromResponse(response)
      setCartQuantity(nextQuantity)
      onCartQuantityChange?.(nextQuantity, selectedSize)
      onAddedToCart?.()
      toast({
        title: "Товар добавлен",
        description: "Товар добавлен в корзину.",
      })
      notifyShopChanged()
    } catch {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар в корзину.",
        variant: "destructive",
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleChangeCartQuantity = async (nextQuantity: number) => {
    const authToken = requireAuth()
    if (!authToken) {
      return
    }

    if (!selectedSize) {
      toast({ title: "Выберите размер", description: "Перед изменением количества выберите размер." })
      return
    }

    if (selectedSizeStock !== undefined && nextQuantity > selectedSizeStock) {
      toast({
        title: "Достигнут лимит",
        description: `На складе доступно только ${selectedSizeStock} шт.`,
        variant: "destructive",
      })
      return
    }

    setIsBusy(true)
    try {
      const response = await updateCartItem(authToken, productId, selectedSize, Math.max(0, nextQuantity))
      const updatedQuantity = getQuantityFromResponse(response)
      setCartQuantity(updatedQuantity)
      onCartQuantityChange?.(updatedQuantity, selectedSize)
      notifyShopChanged()
    } catch {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить количество товара.",
        variant: "destructive",
      })
    } finally {
      setIsBusy(false)
    }
  }

  const isLarge = size === "large"

  return (
    <div className={className ?? "space-y-2"}>
      {normalizedAvailableSizes.length > 0 ? (
        <div className="w-full">
          <Select value={selectedSize} onValueChange={setSelectedSize} disabled={isBusy || isOutOfStock}>
            <SelectTrigger className="h-9 text-xs mb-2">
              <SelectValue placeholder="Выберите размер" />
            </SelectTrigger>
            <SelectContent>
              {normalizedAvailableSizes.map((sizeOption) => (
                <SelectItem key={sizeOption} value={sizeOption}>
                  {sizeOption} · {sizeStock?.[sizeOption] ?? maxQuantity ?? 0} шт.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSize ? (
            <p className="text-[11px] text-muted-foreground mb-2">
              В наличии для размера {selectedSize}: {selectedSizeStock ?? 0} шт.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={`flex gap-2 ${isOutOfStock ? "opacity-60" : ""}`}>
      <Button
        variant={isFavorite ? "secondary" : "outline"}
        size={isLarge ? "lg" : "sm"}
        className={isLarge ? "h-12 w-12 shrink-0" : "h-9 w-9 shrink-0 px-0"}
        onClick={handleToggleFavorite}
        disabled={isBusy}
      >
        <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
      </Button>
      {cartQuantity > 0 ? (
        <div className={isLarge ? "flex-1 flex items-center gap-2" : "flex-1 flex items-center gap-1"}>
          <Button
            variant="outline"
            size={isLarge ? "lg" : "sm"}
            className={isLarge ? "h-12 px-3" : "h-9 px-2"}
            onClick={() => void handleChangeCartQuantity(cartQuantity - 1)}
            disabled={isBusy}
          >
            -
          </Button>
          <Button
            variant="default"
            size={isLarge ? "lg" : "sm"}
            className={isLarge ? "flex-1 h-12" : "flex-1"}
            disabled
          >
            {cartQuantity} шт.
          </Button>
          <Button
            variant="outline"
            size={isLarge ? "lg" : "sm"}
            className={isLarge ? "h-12 px-3" : "h-9 px-2"}
            onClick={() => void handleChangeCartQuantity(cartQuantity + 1)}
            disabled={isBusy || (selectedSizeStock !== undefined && cartQuantity >= selectedSizeStock)}
          >
            +
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size={isLarge ? "lg" : "sm"}
          className={isLarge ? "flex-1 h-12" : "flex-1"}
          onClick={handleAddToCart}
          disabled={isBusy || isOutOfStock || (selectedSizeStock !== undefined && selectedSizeStock <= 0)}
        >
          <ShoppingBag className="h-4 w-4 mr-2" />
          {isOutOfStock ? "Нет в наличии" : "В корзину"}
        </Button>
      )}
      </div>
    </div>
  )
}
