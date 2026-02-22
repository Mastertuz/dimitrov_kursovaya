"use client"

import { useEffect, useMemo, useState } from "react"
import { Clock, User, Shield, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/components/auth/auth-provider"
import { apiRequest } from "@/lib/api-client"

type AuditLogDto = {
  id: string
  createdAt: string
  action: string
  entity: string
  entityId?: string | null
  result: string
  user?: { id: string; email: string; fullName: string } | null
}

export default function AuditPage() {
  const { token, isAuthenticated } = useAuth()
  const [logs, setLogs] = useState<AuditLogDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!token || !isAuthenticated) {
        setLogs([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const data = await apiRequest<AuditLogDto[]>("/audit", { token })
        setLogs(data)
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [token, isAuthenticated])

  const criticalCount = useMemo(() => logs.filter((log) => log.result !== "SUCCESS").length, [logs])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Журнал аудита</h1>
          <p className="text-sm text-muted-foreground mt-1">Реальные события из базы данных</p>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Download className="h-4 w-4 mr-2" />
          Экспорт логов
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Всего записей</p><p className="text-lg font-bold mt-1">{logs.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Успешных</p><p className="text-lg font-bold mt-1">{logs.filter((log) => log.result === "SUCCESS").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ошибок</p><p className="text-lg font-bold mt-1">{criticalCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Уникальных действий</p><p className="text-lg font-bold mt-1">{new Set(logs.map((log) => log.action)).size}</p></CardContent></Card>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <Card><CardContent className="p-4 text-sm text-muted-foreground">Загрузка логов...</CardContent></Card>
        ) : logs.length === 0 ? (
          <Card><CardContent className="p-4 text-sm text-muted-foreground">Записи аудита отсутствуют.</CardContent></Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{log.action}</span>
                      <Badge variant={log.result === "SUCCESS" ? "default" : "destructive"} className="text-[10px]">
                        {log.result}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.entity}{log.entityId ? ` (${log.entityId})` : ""}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(log.createdAt).toLocaleString("ru-RU")}</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{log.user?.fullName ?? log.user?.email ?? "Система"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
