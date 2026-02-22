"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/components/auth/auth-provider"
import { RequireGuest } from "@/components/auth/guards"
import { ApiError } from "@/lib/api-client"

const loginSchema = z.object({
  email: z.string().trim().email("Введите корректный email"),
  password: z
    .string()
    .min(8, "Пароль должен содержать минимум 8 символов")
    .max(72, "Пароль слишком длинный"),
})

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    const validation = loginSchema.safeParse({ email, password })
    if (!validation.success) {
      const formatted = validation.error.flatten().fieldErrors
      setFieldErrors({
        email: formatted.email?.[0],
        password: formatted.password?.[0],
      })
      return
    }

    setIsSubmitting(true)

    try {
      await login({ ...validation.data, rememberMe })
      router.push("/")
    } catch (submissionError) {
      if (submissionError instanceof ApiError) {
        setError(submissionError.message)
      } else {
        setError("Не удалось выполнить вход")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <RequireGuest>
    <div className="min-h-[calc(100vh-200px)] px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Главная</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Вход</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-10 w-10 bg-primary rounded-sm flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-sm">MO</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Вход в аккаунт</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Введите данные для входа
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="h-10"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (fieldErrors.email) {
                  setFieldErrors((previous) => ({ ...previous, email: undefined }))
                }
              }}
              required
            />
            {fieldErrors.email ? (
              <p className="text-xs text-destructive">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Пароль</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Забыли пароль?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Ваш пароль"
              className="h-10"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                if (fieldErrors.password) {
                  setFieldErrors((previous) => ({ ...previous, password: undefined }))
                }
              }}
              required
              minLength={8}
            />
            {fieldErrors.password ? (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <label htmlFor="remember" className="text-sm cursor-pointer">
              Запомнить меня
            </label>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button className="w-full h-10" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Входим..." : "Войти"}
          </Button>
        </form>

        <Separator className="my-6" />

        <p className="text-sm text-center text-muted-foreground">
          Нет аккаунта?{" "}
          <Link
            href="/register"
            className="text-foreground font-medium hover:underline"
          >
            Зарегистрируйтесь
          </Link>
        </p>
      </div>
      </div>
    </div>
    </RequireGuest>
  )
}
