"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/components/auth/auth-provider"
import { apiRequest } from "@/lib/api-client"
import { renderOrderStatus } from "@/components/order-status"

type OrderDto = {
  id: string
  createdAt: string
  total: number | string
  status: { code: string; name: string }
}

export default function SalesPage() {
  const { token, isAuthenticated } = useAuth()
  const [orders, setOrders] = useState<OrderDto[]>([])
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

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Продажи</h1>
      <p className="text-sm text-muted-foreground mb-6">История продаж по реальным заказам</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Заказы</CardTitle>
          <CardDescription>Последние операции продаж</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Продажи отсутствуют.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border border-border rounded-md px-3 py-2 text-sm">
                  <span>{order.id}</span>
                  <span className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("ru-RU")}</span>
                  {renderOrderStatus(order.status.code, order.status.name, "text-xs gap-1")}
                  <span className="font-medium">{Number(order.total).toLocaleString("ru-RU")} руб.</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
