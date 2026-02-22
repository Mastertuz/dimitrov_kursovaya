"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth/auth-provider"
import { apiRequest } from "@/lib/api-client"
import { renderOrderStatus } from "@/components/order-status"

type OrderDto = {
  id: string
  createdAt: string
  recipientName?: string | null
  recipientPhone?: string | null
  deliveryAddress?: string | null
  total: number | string
  status: { code: string; name: string }
  items: Array<{ id: string; quantity: number; unitPrice?: number | string; product?: { name?: string } }>
}

export default function OrdersPage() {
  const { token, isAuthenticated } = useAuth()
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!token || !isAuthenticated) {
        setOrders([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const data = await apiRequest<OrderDto[]>("/orders/my", { token })
        setOrders(data)
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [token, isAuthenticated])

  const stats = useMemo(() => {
    const total = orders.length
    const newCount = orders.filter((order) => order.status.code === "NEW").length
    const inProgress = orders.filter((order) => order.status.code === "IN_PROGRESS").length
    const done = orders.filter((order) => ["APPROVED", "CLOSED"].includes(order.status.code)).length
    const sum = orders.reduce((acc, order) => acc + Number(order.total), 0)

    return { total, newCount, inProgress, done, sum }
  }, [orders])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Заказы</h1>
          <p className="text-sm text-muted-foreground mt-1">Реальные заказы из базы данных</p>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Download className="h-4 w-4 mr-2" />
          Экспорт
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Всего</p><p className="text-lg font-bold mt-1">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Новые</p><p className="text-lg font-bold mt-1">{stats.newCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">В работе</p><p className="text-lg font-bold mt-1">{stats.inProgress}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Завершено</p><p className="text-lg font-bold mt-1">{stats.done}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Сумма</p><p className="text-lg font-bold mt-1">{stats.sum.toLocaleString("ru-RU")} руб.</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка заказов...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Заказы отсутствуют.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="border border-border rounded-md p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{order.id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("ru-RU")}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">Позиций: {order.items.length}</div>
                    <div className="text-sm font-medium">{Number(order.total).toLocaleString("ru-RU")} руб.</div>
                    {renderOrderStatus(order.status.code, order.status.name)}
                  </div>

                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => {
                        setExpandedOrderIds((previous) =>
                          previous.includes(order.id)
                            ? previous.filter((id) => id !== order.id)
                            : [...previous, order.id],
                        )
                      }}
                    >
                      {expandedOrderIds.includes(order.id) ? "Скрыть" : "Подробнее"}
                      {expandedOrderIds.includes(order.id) ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>

                  {expandedOrderIds.includes(order.id) ? (
                    <>
                      <Separator className="my-3" />

                      {order.deliveryAddress || order.recipientName || order.recipientPhone ? (
                        <div className="mb-3 rounded-md border border-border/70 bg-muted/30 p-2">
                          <p className="text-[11px] font-medium text-muted-foreground mb-1">Доставка</p>
                          {order.deliveryAddress ? (
                            <p className="text-xs text-muted-foreground line-clamp-1">Адрес: {order.deliveryAddress}</p>
                          ) : null}
                          {order.recipientName ? (
                            <p className="text-xs text-muted-foreground line-clamp-1">Получатель: {order.recipientName}</p>
                          ) : null}
                          {order.recipientPhone ? (
                            <p className="text-xs text-muted-foreground line-clamp-1">Телефон: {order.recipientPhone}</p>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                            <p className="min-w-0 truncate text-muted-foreground">
                              {item.product?.name ?? `Товар #${item.id.slice(0, 6)}`} · {item.quantity} шт.
                            </p>
                            {item.unitPrice ? (
                              <span className="shrink-0">{Number(item.unitPrice).toLocaleString("ru-RU")} руб.</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
