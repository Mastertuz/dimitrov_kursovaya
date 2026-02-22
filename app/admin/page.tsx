"use client"

import { useEffect, useMemo, useState } from "react"
import { DollarSign, Package, ShoppingCart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/components/auth/auth-provider"
import { apiRequest } from "@/lib/api-client"
import { getProducts, type CatalogProduct } from "@/lib/shop-api"
import { renderOrderStatus } from "@/components/order-status"
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

export default function AdminDashboard() {
  const { token, isAuthenticated } = useAuth()
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [productsCount, setProductsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!token || !isAuthenticated) {
        setOrders([])
        setProductsCount(0)
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
        setProductsCount(productsData.length)
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [token, isAuthenticated])

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total), 0),
    [orders],
  )

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
      const key = order.status.name
      byStatus.set(key, (byStatus.get(key) ?? 0) + 1)
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Панель управления</h1>
        <p className="text-sm text-muted-foreground mt-1">Реальные данные из базы</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground">Выручка</span><DollarSign className="h-4 w-4 text-muted-foreground" /></div>
            <p className="text-2xl font-bold">{isLoading ? "—" : `${totalRevenue.toLocaleString("ru-RU")} руб.`}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground">Заказы</span><ShoppingCart className="h-4 w-4 text-muted-foreground" /></div>
            <p className="text-2xl font-bold">{isLoading ? "—" : orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground">Товары</span><Package className="h-4 w-4 text-muted-foreground" /></div>
            <p className="text-2xl font-bold">{isLoading ? "—" : productsCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Выручка по месяцам</p>
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
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Статусы заказов</p>
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
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Остатки по размерам</p>
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

      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка данных...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных по заказам.</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 8).map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 border border-border rounded-md p-3">
                  <div>
                    <p className="text-sm font-medium">{order.id}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                  {renderOrderStatus(order.status.code, order.status.name, "text-xs gap-1")}
                  <p className="text-sm font-medium">{Number(order.total).toLocaleString("ru-RU")} руб.</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
