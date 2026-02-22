"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { apiRequest } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type AdminUserDto = {
  id: string
  fullName: string
  email: string
  role: string
  status: string
  createdAt: string
  stats: {
    ordersCount: number
    favoritesCount: number
    cartItemsCount: number
  }
}

export default function UsersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState<AdminUserDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setUsers([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const data = await apiRequest<AdminUserDto[]>("/admin/users", { token })
        setUsers(data)
      } catch {
        setErrorMessage("Не удалось загрузить пользователей")
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [token])

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Пользователи</h1>
      <p className="text-sm text-muted-foreground mb-6">Реальные данные пользователей из backend API</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Список пользователей</CardTitle>
          <CardDescription>Количество: {users.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage ? <p className="text-sm text-destructive mb-3">{errorMessage}</p> : null}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пользователи не найдены.</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="border border-border rounded-md p-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                    <p className="text-sm font-semibold">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString("ru-RU")}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">Роль: {user.role} · Статус: {user.status}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Заказы: {user.stats.ordersCount} · Избранное: {user.stats.favoritesCount} · В корзине: {user.stats.cartItemsCount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
