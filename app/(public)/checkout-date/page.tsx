"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api-client"
import { checkoutOrderWithYooKassa, getCart, notifyShopChanged, removeCartItem, type CartResponse } from "@/lib/shop-api"

const recipientNameRegex = /^[A-Za-zА-Яа-яЁё\s]+$/
const recipientPhoneRegex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "")
  const normalized = digits.startsWith("7") ? digits.slice(1) : digits.startsWith("8") ? digits.slice(1) : digits
  const limited = normalized.slice(0, 10)

  let result = "+7"
  if (limited.length > 0) {
    result += ` (${limited.slice(0, 3)}`
  }
  if (limited.length >= 3) {
    result += ")"
  }
  if (limited.length > 3) {
    result += ` ${limited.slice(3, 6)}`
  }
  if (limited.length > 6) {
    result += `-${limited.slice(6, 8)}`
  }
  if (limited.length > 8) {
    result += `-${limited.slice(8, 10)}`
  }

  return result
}

export default function CheckoutDatePage() {
  const router = useRouter()
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
  })

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    const load = async () => {
      if (!isAuthenticated || !token) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const loadedCart = await getCart(token)
        setCart(loadedCart)
      } catch {
        setCart(null)
        setErrorMessage("Не удалось загрузить корзину")
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [isAuthenticated, isAuthLoading, token])

  const minDate = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-muted-foreground">
        Загрузка оформления...
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-3">Нужна авторизация</h1>
        <p className="text-muted-foreground mb-6">Войдите, чтобы выбрать дату оформления заказа.</p>
        <Button asChild>
          <Link href="/login">Войти</Link>
        </Button>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-3">Корзина пуста</h1>
        <p className="text-muted-foreground mb-6">Добавьте товары перед выбором даты заказа.</p>
        <Button asChild>
          <Link href="/catalog">Перейти в каталог</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button asChild variant="ghost" className="px-0">
          <Link href="/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться в корзину
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Выбор даты заказа</CardTitle>
          <CardDescription>Укажите данные получателя и выберите удобную дату оформления.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3">
            <div className="grid gap-2">
              <label htmlFor="recipientName" className="text-sm font-medium">Имя получателя</label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
                placeholder="Например, Иван Иванов"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="recipientPhone" className="text-sm font-medium">Телефон</label>
              <Input
                id="recipientPhone"
                value={recipientPhone}
                onChange={(event) => setRecipientPhone(formatPhoneInput(event.target.value))}
                onFocus={() => {
                  if (!recipientPhone.trim()) {
                    setRecipientPhone("+7 (")
                  }
                }}
                placeholder="+7 (999) 123-12-12"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="deliveryAddress" className="text-sm font-medium">Адрес доставки *</label>
              <Textarea
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                placeholder="Город, улица, дом, квартира"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < minDate}
            />
          </div>

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

          <div className="rounded-md border border-border p-4 text-sm">
            <p className="text-muted-foreground">Выбранная дата:</p>
            <p className="font-semibold mt-1">
              {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: ru }) : "Не выбрана"}
            </p>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!selectedDate || isSubmitting}
            onClick={async () => {
              if (!selectedDate || !token || !cart || cart.items.length === 0) {
                return
              }

              const normalizedAddress = deliveryAddress.trim()
              const normalizedName = recipientName.trim()
              const normalizedPhone = recipientPhone.trim()

              if (!normalizedName || !recipientNameRegex.test(normalizedName)) {
                setErrorMessage("Имя получателя должно содержать только буквы и пробелы")
                return
              }

              if (!recipientPhoneRegex.test(normalizedPhone)) {
                setErrorMessage("Телефон должен быть в формате +7 (999) 123-12-12")
                return
              }

              if (normalizedAddress.length < 5) {
                setErrorMessage("Укажите корректный адрес доставки")
                return
              }

              setIsSubmitting(true)
              setErrorMessage(null)

              try {
                const deliveryDate = new Date(selectedDate)
                deliveryDate.setHours(12, 0, 0, 0)

                const checkout = await checkoutOrderWithYooKassa(token, {
                  items: cart.items.map((item) => ({
                    productId: item.productId,
                    size: item.size,
                    quantity: item.quantity,
                  })),
                  deliveryAddress: normalizedAddress,
                  recipientName: normalizedName,
                  recipientPhone: normalizedPhone,
                  deliveryDate: deliveryDate.toISOString(),
                  returnUrl: `${window.location.origin}/payment/success`,
                })

                sessionStorage.setItem("kursach.lastOrderId", checkout.orderId)
                localStorage.setItem("kursach.lastOrderId", checkout.orderId)

                await Promise.all(cart.items.map((item) => removeCartItem(token, item.productId, item.size)))
                notifyShopChanged()

                window.location.href = checkout.confirmationUrl
              } catch (error) {
                if (error instanceof ApiError) {
                  setErrorMessage(error.message)
                } else {
                  setErrorMessage("Не удалось оформить заказ. Попробуйте снова.")
                }
              } finally {
                setIsSubmitting(false)
              }
            }}
          >
            {isSubmitting ? "Оформляем заказ..." : "Продолжить оформление"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
