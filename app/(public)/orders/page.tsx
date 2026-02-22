"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Package, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { RequireAuth } from "@/components/auth/guards"
import { useAuth } from "@/components/auth/auth-provider"
import { apiRequest } from "@/lib/api-client"
import { getProductImageSrc } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { renderOrderStatus } from "@/components/order-status"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

type OrderDto = {
  id: string
  createdAt: string
  deliveryAddress?: string | null
  recipientName?: string | null
  recipientPhone?: string | null
  deliveryDate?: string | null
  total: number | string
  status: { code: string; name: string }
  items: Array<{
    id: string
    quantity: number
    unitPrice: number | string
    product: { id: number; name: string; image?: string | null }
  }>
}

type ProfileStatsDto = {
  totalOrders: number
  approvedOrders: number
  rejectedOrders: number
  totalSpent: number
  averageCheck: number
  lastOrderAt: string | null
  favoritesCount: number
  cartItemsCount: number
  monthlySpend: Array<{
    month: string
    amount: number
    orders: number
  }>
}

type ProfileDto = {
  id: string
  fullName: string
  email: string
  role: string
  status?: string
  createdAt?: string
  stats?: ProfileStatsDto
}

const spendChartConfig = {
  amount: {
    label: "Сумма",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const ordersChartConfig = {
  orders: {
    label: "Заказы",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export default function OrdersPage() {
  const { token, isAuthenticated } = useAuth()
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([])
  const [profile, setProfile] = useState<ProfileDto | null>(null)
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
        const [ordersData, profileData] = await Promise.all([
          apiRequest<OrderDto[]>("/orders/my", { token }),
          apiRequest<ProfileDto>("/users/me", { token }),
        ])
        setOrders(ordersData)
        setProfile(profileData)
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [token, isAuthenticated])

  return (
    <RequireAuth>
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Главная</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Мои заказы</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">Мои заказы</h1>

        {profile?.stats ? (
          <div className="border border-border rounded-lg p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold">Профиль покупателя</h2>
                <p className="text-sm text-muted-foreground">{profile.fullName} · {profile.email}</p>
              </div>
              {profile.stats.lastOrderAt ? (
                <p className="text-xs text-muted-foreground">
                  Последний заказ: {new Date(profile.stats.lastOrderAt).toLocaleDateString("ru-RU")}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">Всего заказов</p>
                <p className="text-lg font-semibold">{profile.stats.totalOrders}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">Потратил всего</p>
                <p className="text-lg font-semibold">{Number(profile.stats.totalSpent).toLocaleString("ru-RU")} ₽</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">Средний чек</p>
                <p className="text-lg font-semibold">{Number(profile.stats.averageCheck).toLocaleString("ru-RU")} ₽</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">В избранном</p>
                <p className="text-lg font-semibold">{profile.stats.favoritesCount}</p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Траты по месяцам (с момента регистрации)</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Сумма по месяцам</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ChartContainer config={spendChartConfig} className="h-56 w-full">
                      <BarChart data={profile.stats.monthlySpend}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="amount" fill="var(--color-amount)" radius={6} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Количество заказов</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ChartContainer config={ordersChartConfig} className="h-56 w-full">
                      <BarChart data={profile.stats.monthlySpend}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="orders" fill="var(--color-orders)" radius={6} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Подтверждено: {profile.stats.approvedOrders} · Отклонено: {profile.stats.rejectedOrders} · В корзине: {profile.stats.cartItemsCount}
            </p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Загрузка заказов...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
            <h2 className="text-xl font-semibold mb-2">Заказов пока нет</h2>
            <p className="text-muted-foreground mb-6">Ваши заказы появятся здесь после оформления</p>
            <Button asChild>
              <Link href="/catalog">Перейти в каталог</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-border rounded-lg p-4 md:p-6">
                {(() => {
                  const isExpanded = expandedOrderIds.includes(order.id)

                  return (
                    <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{order.id}</span>
                      {renderOrderStatus(order.status.code, order.status.name, "text-xs gap-1")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleString("ru-RU")}
                    </p>
                    {order.deliveryDate ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        Дата оформления: {new Date(order.deliveryDate).toLocaleDateString("ru-RU")}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-sm font-semibold">
                    {Number(order.total).toLocaleString("ru-RU")} руб.
                  </span>
                </div>

                <div className="flex justify-end">
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
                    {isExpanded ? "Скрыть" : "Подробнее"}
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </Button>
                </div>

                {isExpanded ? (
                  <>
                    <Separator className="my-4" />

                    {order.deliveryAddress || order.recipientName || order.recipientPhone ? (
                      <div className="mb-4 rounded-md border border-border/70 bg-muted/30 p-2">
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

                    <div className="flex flex-col gap-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <img
                            src={getProductImageSrc(item.product.image)}
                            alt={item.product.name}
                            className="w-12 h-14 rounded object-cover bg-muted shrink-0"
                            onError={(event) => {
                              event.currentTarget.src = getProductImageSrc()
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">Количество: {item.quantity}</p>
                          </div>
                          <span className="text-sm shrink-0">
                            {Number(item.unitPrice).toLocaleString("ru-RU")} руб.
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
                    </>
                  )
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  )
}
