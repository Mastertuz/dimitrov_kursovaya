"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { ApiError } from "@/lib/api-client"
import {
  createAdminPromoCode,
  deleteAdminPromoCode,
  listAdminPromoCodes,
  PromoCodeDto,
  updateAdminPromoCode,
} from "@/lib/shop-api"

type PromoFormState = {
  code: string
  title: string
  description: string
  discountType: "PERCENT" | "FIXED"
  discountValue: string
  minSubtotal: string
  maxDiscount: string
  usageLimit: string
  perUserLimit: string
  startsAt: string
  endsAt: string
  isActive: boolean
}

const initialFormState: PromoFormState = {
  code: "",
  title: "",
  description: "",
  discountType: "PERCENT",
  discountValue: "",
  minSubtotal: "",
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
}

function toInputDateTime(date: string | null) {
  if (!date) {
    return ""
  }

  const parsed = new Date(date)
  const pad = (value: number) => String(value).padStart(2, "0")

  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
}

function fromInputDateTime(date: string) {
  if (!date) {
    return null
  }

  return new Date(date).toISOString()
}

function isExpiringSoon(endsAt: string | null) {
  if (!endsAt) {
    return false
  }

  const now = new Date()
  const endDate = new Date(endsAt)
  const inSevenDays = new Date(now)
  inSevenDays.setDate(now.getDate() + 7)

  return endDate >= now && endDate <= inSevenDays
}

function parseOptionalNumber(value: string) {
  if (value === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseRequiredNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message || fallback
  }

  return fallback
}

export default function PromoCodesAdminPage() {
  const { token } = useAuth()
  const formCardRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [promoCodes, setPromoCodes] = useState<PromoCodeDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null)
  const [promoToDelete, setPromoToDelete] = useState<PromoCodeDto | null>(null)
  const [form, setForm] = useState<PromoFormState>(initialFormState)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [periodFilter, setPeriodFilter] = useState<"all" | "valid" | "expired" | "no-end-date">("all")
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false)

  const isEditing = editingPromoId != null

  const stats = useMemo(() => {
    const total = promoCodes.length
    const active = promoCodes.filter((promo) => promo.isActive).length
    const expired = promoCodes.filter((promo) => promo.endsAt && new Date(promo.endsAt) < new Date()).length

    return { total, active, expired }
  }, [promoCodes])

  const filteredPromoCodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const now = new Date()
    const inSevenDays = new Date(now)
    inSevenDays.setDate(now.getDate() + 7)

    return promoCodes.filter((promo) => {
      if (statusFilter === "active" && !promo.isActive) {
        return false
      }

      if (statusFilter === "inactive" && promo.isActive) {
        return false
      }

      const isExpired = Boolean(promo.endsAt && new Date(promo.endsAt) < now)
      const hasEndDate = Boolean(promo.endsAt)
      const isExpiringSoon = Boolean(
        promo.endsAt &&
        new Date(promo.endsAt) >= now &&
        new Date(promo.endsAt) <= inSevenDays,
      )

      if (expiringSoonOnly && !isExpiringSoon) {
        return false
      }

      if (periodFilter === "valid" && isExpired) {
        return false
      }

      if (periodFilter === "expired" && !isExpired) {
        return false
      }

      if (periodFilter === "no-end-date" && hasEndDate) {
        return false
      }

      if (!query) {
        return true
      }

      const haystack = `${promo.code} ${promo.title} ${promo.description ?? ""}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [expiringSoonOnly, periodFilter, promoCodes, searchQuery, statusFilter])

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setPeriodFilter("all")
    setExpiringSoonOnly(false)
  }

  const loadPromoCodes = async () => {
    if (!token) {
      setPromoCodes([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    try {
      const data = await listAdminPromoCodes(token)
      setPromoCodes(data)
    } catch {
      setErrorMessage("Не удалось загрузить промокоды")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPromoCodes()
  }, [token])

  const resetForm = () => {
    setEditingPromoId(null)
    setForm(initialFormState)
  }

  const startEdit = (promo: PromoCodeDto) => {
    setEditingPromoId(promo.id)
    setForm({
      code: promo.code,
      title: promo.title,
      description: promo.description ?? "",
      discountType: promo.discountType,
      discountValue: String(promo.discountValue),
      minSubtotal: promo.minSubtotal == null ? "" : String(promo.minSubtotal),
      maxDiscount: promo.maxDiscount == null ? "" : String(promo.maxDiscount),
      usageLimit: promo.usageLimit == null ? "" : String(promo.usageLimit),
      perUserLimit: promo.perUserLimit == null ? "" : String(promo.perUserLimit),
      startsAt: toInputDateTime(promo.startsAt),
      endsAt: toInputDateTime(promo.endsAt),
      isActive: promo.isActive,
    })

    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    requestAnimationFrame(() => {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    })
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) {
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    const trimmedCode = form.code.trim().toUpperCase()
    const trimmedTitle = form.title.trim()
    const discountValue = parseRequiredNumber(form.discountValue)
    const minSubtotal = parseOptionalNumber(form.minSubtotal)
    const maxDiscount = parseOptionalNumber(form.maxDiscount)
    const usageLimit = parseOptionalNumber(form.usageLimit)
    const perUserLimit = parseOptionalNumber(form.perUserLimit)
    const startsAt = fromInputDateTime(form.startsAt)
    const endsAt = fromInputDateTime(form.endsAt)

    if (!trimmedCode || !trimmedTitle) {
      setErrorMessage("Укажите код и название промокода")
      setIsSaving(false)
      return
    }

    if (discountValue == null || discountValue <= 0) {
      setErrorMessage("Размер скидки должен быть больше 0")
      setIsSaving(false)
      return
    }

    if (form.discountType === "PERCENT" && discountValue > 100) {
      setErrorMessage("Процент скидки не может быть больше 100")
      setIsSaving(false)
      return
    }

    if (minSubtotal != null && minSubtotal < 0) {
      setErrorMessage("Минимальная сумма заказа не может быть отрицательной")
      setIsSaving(false)
      return
    }

    if (maxDiscount != null && maxDiscount < 0) {
      setErrorMessage("Максимальная скидка не может быть отрицательной")
      setIsSaving(false)
      return
    }

    if (usageLimit != null && (!Number.isInteger(usageLimit) || usageLimit <= 0)) {
      setErrorMessage("Общий лимит использований должен быть целым числом больше 0")
      setIsSaving(false)
      return
    }

    if (perUserLimit != null && (!Number.isInteger(perUserLimit) || perUserLimit <= 0)) {
      setErrorMessage("Лимит на пользователя должен быть целым числом больше 0")
      setIsSaving(false)
      return
    }

    if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
      setErrorMessage("Дата окончания должна быть позже даты начала")
      setIsSaving(false)
      return
    }

    const payload = {
      code: trimmedCode,
      title: trimmedTitle,
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue,
      minSubtotal,
      maxDiscount,
      usageLimit,
      perUserLimit,
      startsAt,
      endsAt,
      isActive: form.isActive,
    }

    try {
      if (isEditing && editingPromoId != null) {
        await updateAdminPromoCode(token, editingPromoId, payload)
        toast({
          title: "Изменения сохранены",
          description: `Промокод ${trimmedCode} успешно обновлён.`,
        })
      } else {
        await createAdminPromoCode(token, payload)
        toast({
          title: "Промокод добавлен",
          description: `Промокод ${trimmedCode} успешно создан.`,
        })
      }

      await loadPromoCodes()
      resetForm()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Не удалось сохранить промокод"))
    } finally {
      setIsSaving(false)
    }
  }

  const onDelete = async () => {
    if (!token) {
      return
    }

    if (!promoToDelete) {
      return
    }

    setIsDeleting(true)
    setErrorMessage(null)

    try {
      const deletedPromoCode = promoToDelete.code
      await deleteAdminPromoCode(token, promoToDelete.id)
      if (editingPromoId === promoToDelete.id) {
        resetForm()
      }
      await loadPromoCodes()
      setPromoToDelete(null)
      toast({
        title: "Промокод удалён",
        description: `Промокод ${deletedPromoCode} успешно удалён.`,
      })
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Не удалось удалить промокод"))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Промокоды</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Управление промокодами и сроками действия
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Всего</p><p className="text-lg font-semibold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Активных</p><p className="text-lg font-semibold">{stats.active}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Истекли</p><p className="text-lg font-semibold">{stats.expired}</p></CardContent></Card>
      </div>

      <Card ref={formCardRef} className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{isEditing ? "Редактировать промокод" : "Добавить промокод"}</CardTitle>
          <CardDescription>Укажите параметры скидки и период действия</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage ? <p className="text-sm text-destructive mb-3">{errorMessage}</p> : null}

          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Код (например WELCOME10)"
              value={form.code}
              onChange={(event) => setForm((state) => ({ ...state, code: event.target.value.toUpperCase() }))}
              required
            />
            <Input
              ref={titleInputRef}
              placeholder="Название"
              value={form.title}
              onChange={(event) => setForm((state) => ({ ...state, title: event.target.value }))}
              required
            />
            <Input
              placeholder="Описание"
              value={form.description}
              onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
            />
            <select
              value={form.discountType}
              onChange={(event) => setForm((state) => ({ ...state, discountType: event.target.value as "PERCENT" | "FIXED" }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="PERCENT">Скидка в %</option>
              <option value="FIXED">Фиксированная скидка</option>
            </select>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Размер скидки"
              value={form.discountValue}
              onChange={(event) => setForm((state) => ({ ...state, discountValue: event.target.value }))}
              required
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Мин. сумма заказа"
              value={form.minSubtotal}
              onChange={(event) => setForm((state) => ({ ...state, minSubtotal: event.target.value }))}
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Макс. размер скидки"
              value={form.maxDiscount}
              onChange={(event) => setForm((state) => ({ ...state, maxDiscount: event.target.value }))}
            />
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="Общий лимит использований"
              value={form.usageLimit}
              onChange={(event) => setForm((state) => ({ ...state, usageLimit: event.target.value }))}
            />
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="Лимит на пользователя"
              value={form.perUserLimit}
              onChange={(event) => setForm((state) => ({ ...state, perUserLimit: event.target.value }))}
            />
            <Input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => setForm((state) => ({ ...state, startsAt: event.target.value }))}
            />
            <Input
              type="datetime-local"
              value={form.endsAt}
              onChange={(event) => setForm((state) => ({ ...state, endsAt: event.target.value }))}
            />

            <div className="col-span-1 md:col-span-2 flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="text-sm">Промокод активен</span>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((state) => ({ ...state, isActive: checked }))}
              />
            </div>

            <div className="col-span-1 md:col-span-2 flex gap-2">
              <Button type="submit" disabled={isSaving}>
                <Plus className="h-4 w-4 mr-2" />
                {isEditing ? "Сохранить" : "Добавить"}
              </Button>
              {isEditing ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Отмена
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Список промокодов</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMessage ? <p className="text-sm text-destructive mb-3">{errorMessage}</p> : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            <Input
              placeholder="Поиск по коду или названию"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Все статусы</option>
              <option value="active">Только активные</option>
              <option value="inactive">Только неактивные</option>
            </select>
            <select
              value={periodFilter}
              onChange={(event) =>
                setPeriodFilter(event.target.value as "all" | "valid" | "expired" | "no-end-date")
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Любой срок</option>
              <option value="valid">Действующие по сроку</option>
              <option value="expired">С истекшим сроком</option>
              <option value="no-end-date">Без срока окончания</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              type="button"
              variant={expiringSoonOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setExpiringSoonOnly((value) => !value)}
            >
              Истекают в ближайшие 7 дней
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Сбросить фильтры
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : filteredPromoCodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Промокоды не найдены.</p>
          ) : (
            <div className="space-y-2">
              {filteredPromoCodes.map((promo) => (
                <div key={promo.id} className="border border-border rounded-md p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{promo.code} · {promo.title}</p>
                      {isExpiringSoon(promo.endsAt) ? (
                        <Badge variant="destructive" className="text-[10px] h-5">
                          Истекает скоро
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {promo.discountType === "PERCENT" ? `${promo.discountValue}%` : `${promo.discountValue.toLocaleString("ru-RU")} ₽`}
                      {promo.minSubtotal != null ? ` · Мин. заказ: ${promo.minSubtotal.toLocaleString("ru-RU")} ₽` : ""}
                      {promo.endsAt ? ` · До ${new Date(promo.endsAt).toLocaleString("ru-RU")}` : " · Без срока"}
                    </p>
                    <p className="text-xs text-muted-foreground">Использовано: {promo.usedCount}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(promo)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Изменить
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setPromoToDelete(promo)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={promoToDelete != null} onOpenChange={(open) => {
        if (!open) {
          setPromoToDelete(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить промокод?</AlertDialogTitle>
            <AlertDialogDescription>
              Промокод {promoToDelete?.code} будет удалён без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
