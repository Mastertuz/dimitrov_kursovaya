"use client"

import { useEffect, useState } from "react"
import { Brain, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/components/auth/auth-provider"
import { apiRequest } from "@/lib/api-client"

type ForecastDto = {
  generatedAt: string
  horizonDays: number
  notes: string
  recommendations: string[]
  values: Array<{ size: string; demand: number }>
}

export default function ForecastPage() {
  const { token, isAuthenticated } = useAuth()
  const [forecast, setForecast] = useState<ForecastDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadForecast = async () => {
    if (!token || !isAuthenticated) {
      setForecast(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const data = await apiRequest<ForecastDto>("/ai/forecast", { token })
      setForecast(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadForecast()
  }, [token, isAuthenticated])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-tight">AI Прогноз спроса</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Данные прогноза из backend AI-модуля</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadForecast()} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Сводка прогноза</CardTitle>
          <CardDescription>Актуальный прогноз по размерам</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка прогноза...</p>
          ) : !forecast ? (
            <p className="text-sm text-muted-foreground">Прогноз недоступен.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">Горизонт: {forecast.horizonDays} дней</p>
              <p className="text-sm text-muted-foreground">{forecast.notes}</p>
              <p className="text-xs text-muted-foreground">Сгенерировано: {new Date(forecast.generatedAt).toLocaleString("ru-RU")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Размеры</CardTitle>
          </CardHeader>
          <CardContent>
            {!forecast || forecast.values.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет данных.</p>
            ) : (
              <div className="space-y-2">
                {forecast.values.map((item) => (
                  <div key={item.size} className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2">
                    <span>{item.size}</span>
                    <span className="font-medium">{item.demand}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Рекомендации</CardTitle>
          </CardHeader>
          <CardContent>
            {!forecast || forecast.recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет рекомендаций.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                {forecast.recommendations.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
