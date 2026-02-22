"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/components/auth/auth-provider"
import { apiRequest } from "@/lib/api-client"
import { getProducts, type CatalogProduct } from "@/lib/shop-api"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from "recharts"

type OrderDto = {
  id: string
  createdAt: string
  total: number | string
  status: { code: string; name: string }
  items: Array<{ id: string; quantity: number }>
}

const monthlyChartConfig = {
  revenue: {
    label: "Выручка",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const statusChartConfig = {
  value: {
    label: "Заказы",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const sizeChartConfig = {
  value: {
    label: "Остаток",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export default function AnalyticsPage() {
  const { token, isAuthenticated } = useAuth()
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!token || !isAuthenticated) {
        setOrders([])
        setProducts([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const [ordersData, productsData] = await Promise.all([
          apiRequest<OrderDto[]>("/orders/my", { token }),
          getProducts(),
        ])
        setOrders(ordersData)
        setProducts(productsData)
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [token, isAuthenticated])

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0)
    const avgCheck = orders.length ? revenue / orders.length : 0
    const items = orders.reduce((sum, order) => sum + order.items.reduce((a, i) => a + i.quantity, 0), 0)

    return { revenue, avgCheck, items }
  }, [orders])

  const monthlyRevenueData = useMemo(() => {
    const byMonth = new Map<string, number>()

    orders.forEach((order) => {
      const date = new Date(order.createdAt)
      const monthKey = `${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`
      byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + Number(order.total))
    })

    return Array.from(byMonth.entries())
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }))
      .sort((left, right) => left.month.localeCompare(right.month))
  }, [orders])

  const orderStatusData = useMemo(() => {
    const byStatus = new Map<string, number>()

    orders.forEach((order) => {
      byStatus.set(order.status.name, (byStatus.get(order.status.name) ?? 0) + 1)
    })

    return Array.from(byStatus.entries()).map(([status, value]) => ({ status, value }))
  }, [orders])

  const sizeDistributionData = useMemo(() => {
    const bySize = new Map<string, number>()

    products.forEach((product) => {
      Object.entries(product.sizeStock ?? {}).forEach(([size, count]) => {
        bySize.set(size, (bySize.get(size) ?? 0) + Number(count))
      })
    })

    return Array.from(bySize.entries())
      .map(([size, value]) => ({ size, value }))
      .sort((left, right) => left.size.localeCompare(right.size))
  }, [products])

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Аналитика</h1>
      <p className="text-sm text-muted-foreground mb-6">Показатели рассчитаны по реальным заказам</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Выручка</CardTitle><CardDescription>Сумма заказов</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold">{isLoading ? "—" : `${stats.revenue.toLocaleString("ru-RU")} руб.`}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Средний чек</CardTitle><CardDescription>По заказам</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold">{isLoading ? "—" : `${Math.round(stats.avgCheck).toLocaleString("ru-RU")} руб.`}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Товаров</CardTitle><CardDescription>Продано штук</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold">{isLoading ? "—" : stats.items}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Выручка по месяцам</CardTitle>
            <CardDescription>Динамика общей суммы заказов</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || monthlyRevenueData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Недостаточно данных для графика</p>
            ) : (
              <ChartContainer config={monthlyChartConfig} className="h-64 w-full">
                <BarChart data={monthlyRevenueData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={6} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Статусы заказов</CardTitle>
            <CardDescription>Распределение по статусам</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || orderStatusData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Недостаточно данных для графика</p>
            ) : (
              <ChartContainer config={statusChartConfig} className="h-64 w-full">
                <PieChart>
                  <Pie data={orderStatusData} dataKey="value" nameKey="status" innerRadius={50} outerRadius={90}>
                    {orderStatusData.map((entry, index) => (
                      <Cell key={entry.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Остатки по размерам</CardTitle>
            <CardDescription>Суммарный склад по каждому размеру</CardDescription>
          </CardHeader>
          <CardContent>
            {sizeDistributionData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет данных по размерам</p>
            ) : (
              <ChartContainer config={sizeChartConfig} className="h-64 w-full">
                <BarChart data={sizeDistributionData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="size" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={6} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
