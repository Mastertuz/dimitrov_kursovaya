"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Home, Package } from "lucide-react"
import { RequireAuth } from "@/components/auth/guards"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiRequest } from "@/lib/api-client"
import { getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/utils"

type OrderDto = {
  id: string
  createdAt: string
  deliveryAddress?: string | null
  recipientName?: string | null
  recipientPhone?: string | null
  deliveryDate?: string | null
  total: number | string
  paymentStatus?: string | null
  status: { code: string; name: string }
  items: Array<{
    id: string
    quantity: number
    size?: string | null
    unitPrice: number | string
    product: { id: number; name: string }
  }>
}

function normalizeOrderId(value: string | null) {
  const normalized = value?.trim() || null
  if (!normalized) {
    return null
  }

  if (normalized === '{orderId}' || normalized === ':orderId' || normalized.toLowerCase() === 'orderid') {
    return null
  }

  if (normalized.includes('{') || normalized.includes('}')) {
    return null
  }

  return normalized
}

export default function PaymentSuccessPage() {
  const { token, isAuthenticated } = useAuth()
  const [order, setOrder] = useState<OrderDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = normalizeOrderId(params.get("orderId"))
    const fromSessionStorage = normalizeOrderId(sessionStorage.getItem("kursach.lastOrderId"))
    const fromLocalStorage = normalizeOrderId(localStorage.getItem("kursach.lastOrderId"))
    setOrderId(fromQuery ?? fromSessionStorage ?? fromLocalStorage)
  }, [])

  useEffect(() => {
    const loadOrder = async () => {
      if (!token || !isAuthenticated) {
        setOrder(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      const loadLatestOrder = async () => {
        const orders = await apiRequest<OrderDto[]>("/orders/my", { token })
        const latestOrder = orders[0] ?? null
        setOrder(latestOrder)
        if (latestOrder?.id) {
          sessionStorage.setItem("kursach.lastOrderId", latestOrder.id)
          localStorage.setItem("kursach.lastOrderId", latestOrder.id)
        }
      }

      try {
        if (orderId) {
          try {
            const loadedOrder = await apiRequest<OrderDto>(`/orders/${encodeURIComponent(orderId)}`, { token })
            setOrder(loadedOrder)
            sessionStorage.setItem("kursach.lastOrderId", loadedOrder.id)
            localStorage.setItem("kursach.lastOrderId", loadedOrder.id)
          } catch {
            await loadLatestOrder()
          }
        } else {
          await loadLatestOrder()
        }
      } catch {
        setOrder(null)
      } finally {
        setIsLoading(false)
      }
    }

    void loadOrder()
  }, [token, isAuthenticated, orderId])

  const itemsCount = useMemo(
    () => (order ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0),
    [order],
  )

  const paymentStatusLabel = useMemo(() => {
    return getPaymentStatusLabel(order?.paymentStatus)
  }, [order?.paymentStatus])

  const orderStatusLabel = useMemo(() => {
    return getOrderStatusLabel(order?.status.code, order?.status.name)
  }, [order?.status.code, order?.status.name])

  return (
    <RequireAuth>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <CardTitle className="text-2xl">Оплата прошла успешно</CardTitle>
            <CardDescription>Ваш заказ оформлен и передан в обработку.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center">Загружаем информацию о заказе...</p>
            ) : order ? (
              <div className="space-y-3">
                <div className="rounded-md border border-border p-4 text-sm space-y-2">
                  <p><span className="text-muted-foreground">Номер заказа:</span> {order.id}</p>
                  <p><span className="text-muted-foreground">Статус заказа:</span> {orderStatusLabel}</p>
                  <p><span className="text-muted-foreground">Статус оплаты:</span> {paymentStatusLabel}</p>
                  <p><span className="text-muted-foreground">Количество товаров:</span> {itemsCount}</p>
                  <p><span className="text-muted-foreground">Сумма:</span> {Number(order.total).toLocaleString("ru-RU")} ₽</p>
                  <p>
                    <span className="text-muted-foreground">Дата:</span>{" "}
                    {new Date(order.createdAt).toLocaleString("ru-RU")}
                  </p>
                </div>

                <div className="rounded-md border border-border p-4">
                  <p className="text-sm font-medium mb-3">Состав заказа</p>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Размер: {item.size ?? "—"} · Количество: {item.quantity}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Number(item.unitPrice).toLocaleString("ru-RU")} ₽ × {item.quantity}
                          </p>
                        </div>
                        <span className="shrink-0 font-medium">
                          {(Number(item.unitPrice) * item.quantity).toLocaleString("ru-RU")} ₽
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Итого</span>
                    <span className="font-semibold">{Number(order.total).toLocaleString("ru-RU")} ₽</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
                Не удалось получить детали заказа. Вы можете открыть список заказов и проверить статус там.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link href="/orders">
                  <Package className="h-4 w-4 mr-2" />
                  Перейти в заказы
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  На главную
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  )
}
