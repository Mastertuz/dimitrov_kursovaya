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

const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "Имя должно содержать минимум 2 символа")
      .max(50, "Имя слишком длинное"),
    lastName: z
      .string()
      .trim()
      .min(2, "Фамилия должна содержать минимум 2 символа")
      .max(50, "Фамилия слишком длинная"),
    email: z.string().trim().email("Введите корректный email"),
    password: z
      .string()
      .min(8, "Пароль должен содержать минимум 8 символов")
      .max(72, "Пароль слишком длинный"),
    confirmPassword: z
      .string()
      .min(8, "Подтверждение пароля должно содержать минимум 8 символов"),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: "Необходимо принять пользовательское соглашение" }),
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  })

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string
    lastName?: string
    email?: string
    password?: string
    confirmPassword?: string
    acceptedTerms?: string
  }>({})

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    const validation = registerSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      acceptedTerms,
    })

    if (!validation.success) {
      const formatted = validation.error.flatten().fieldErrors
      setFieldErrors({
        firstName: formatted.firstName?.[0],
        lastName: formatted.lastName?.[0],
        email: formatted.email?.[0],
        password: formatted.password?.[0],
        confirmPassword: formatted.confirmPassword?.[0],
        acceptedTerms: formatted.acceptedTerms?.[0],
      })
      return
    }

    setIsSubmitting(true)
    try {
      await register({
        fullName: `${validation.data.firstName} ${validation.data.lastName}`.trim(),
        email: validation.data.email,
        password: validation.data.password,
      })
      router.push("/")
    } catch (submissionError) {
      if (submissionError instanceof ApiError) {
        setError(submissionError.message)
      } else {
        setError("Не удалось зарегистрироваться")
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
              <BreadcrumbPage>Регистрация</BreadcrumbPage>
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
          <h1 className="text-2xl font-bold tracking-tight">Регистрация</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Создайте аккаунт для покупок
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                placeholder="Иван"
                className="h-10"
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value)
                  if (fieldErrors.firstName) {
                    setFieldErrors((previous) => ({ ...previous, firstName: undefined }))
                  }
                }}
                required
              />
              {fieldErrors.firstName ? (
                <p className="text-xs text-destructive">{fieldErrors.firstName}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                placeholder="Иванов"
                className="h-10"
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value)
                  if (fieldErrors.lastName) {
                    setFieldErrors((previous) => ({ ...previous, lastName: undefined }))
                  }
                }}
                required
              />
              {fieldErrors.lastName ? (
                <p className="text-xs text-destructive">{fieldErrors.lastName}</p>
              ) : null}
            </div>
          </div>

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
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="Минимум 8 символов"
              className="h-10"
              autoComplete="new-password"
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Повторите пароль"
              className="h-10"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((previous) => ({ ...previous, confirmPassword: undefined }))
                }
              }}
              required
              minLength={8}
            />
            {fieldErrors.confirmPassword ? (
              <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
            ) : null}
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              className="mt-0.5"
              checked={acceptedTerms}
              onCheckedChange={(checked) => {
                setAcceptedTerms(checked === true)
                if (fieldErrors.acceptedTerms) {
                  setFieldErrors((previous) => ({ ...previous, acceptedTerms: undefined }))
                }
              }}
            />
            <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
              Я согласен с{" "}
              <Link href="/terms" className="text-foreground underline">
                пользовательским соглашением
              </Link>{" "}
              и{" "}
              <Link href="/privacy" className="text-foreground underline">
                политикой конфиденциальности
              </Link>
            </label>
          </div>
          {fieldErrors.acceptedTerms ? (
            <p className="text-xs text-destructive">{fieldErrors.acceptedTerms}</p>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button className="w-full h-10" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Создаём аккаунт..." : "Создать аккаунт"}
          </Button>
        </form>

        <Separator className="my-6" />

        <p className="text-sm text-center text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link
            href="/login"
            className="text-foreground font-medium hover:underline"
          >
            Войти
          </Link>
        </p>
      </div>
      </div>
    </div>
    </RequireGuest>
  )
}
