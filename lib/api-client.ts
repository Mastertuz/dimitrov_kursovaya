const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')

const API_BASE_URLS = configuredApiUrl
  ? [configuredApiUrl]
  : ['http://localhost:54001/api', 'http://localhost:4000/api']

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  token?: string | null
}

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let lastError: unknown

  for (const baseUrl of API_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: 'no-store',
      })

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; details?: unknown }
        | null

      if (!response.ok) {
        throw new ApiError(
          payload?.message ?? 'Ошибка запроса к серверу',
          response.status,
          payload?.details,
        )
      }

      return payload as T
    } catch (error) {
      lastError = error
      if (error instanceof ApiError) {
        throw error
      }
    }
  }

  throw new ApiError('Сервер недоступен. Проверьте запуск backend', 503, lastError)
}
