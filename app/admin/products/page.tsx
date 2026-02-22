"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { ApiError } from "@/lib/api-client"
import {
  createAdminProduct,
  deleteAdminProduct,
  getCategories,
  getProducts,
  type CatalogCategory,
  type CatalogProduct,
  updateAdminProduct,
} from "@/lib/shop-api"
import { UploadDropzone } from "@/lib/uploadthing"

type ProductFormState = {
  sku: string
  name: string
  description: string
  image: string
  price: string
  oldPrice: string
  stock: string
  categoryId: string
  sizes: string
  color: string
  material: string
  gender: string
  season: string
  brand: string
  isSale: boolean
  isNew: boolean
}

type SizeRow = {
  id: string
  size: string
  quantity: string
}

const initialFormState: ProductFormState = {
  sku: "PRODUCT-0001",
  name: "",
  description: "",
  image: "",
  price: "",
  oldPrice: "",
  stock: "0",
  categoryId: "",
  sizes: "",
  color: "black",
  material: "cotton",
  gender: "unisex",
  season: "demi",
  brand: "brand1",
  isSale: false,
  isNew: false,
}

const initialSizeRows: SizeRow[] = [{ id: "row-0", size: "M", quantity: "0" }]
const ALLOWED_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const

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

function createSkuFromName(name: string) {
  const cleaned = name
    .trim()
    .toUpperCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  const prefix = (cleaned || "PRODUCT").slice(0, 10)
  const hash = Array.from(cleaned || "PRODUCT").reduce((acc, char) => {
    return (acc * 31 + char.charCodeAt(0)) % 10000
  }, 7)

  return `${prefix}-${String(hash).padStart(4, "0")}`
}

function formatSizeStock(sizeStock: Record<string, number> | undefined, sizes: string[] | undefined) {
  const entries = Object.entries(sizeStock ?? {})
    .filter(([size]) => size.trim().length > 0)
    .sort(([left], [right]) => left.localeCompare(right))

  if (entries.length > 0) {
    return entries.map(([size, amount]) => `${size}:${amount}`).join(", ")
  }

  return (sizes ?? []).join(", ")
}

function parseSizeStockInput(input: string) {
  const parts = input
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (parts.length === 0) {
    return {
      sizes: [] as string[],
      sizeStock: {} as Record<string, number>,
      totalStock: 0,
      hasQuantities: false,
      error: null as string | null,
    }
  }

  const sizeStock: Record<string, number> = {}
  const sizes: string[] = []
  let hasQuantities = false

  for (const part of parts) {
    const [rawSize, rawAmount] = part.split(":").map((entry) => entry?.trim())
    const size = (rawSize ?? "").toUpperCase()

    if (!size) {
      continue
    }

    sizes.push(size)

    if (rawAmount == null || rawAmount === "") {
      sizeStock[size] = 0
      continue
    }

    const parsedAmount = Number(rawAmount)
    if (!Number.isInteger(parsedAmount) || parsedAmount < 0) {
      return {
        sizes: [] as string[],
        sizeStock: {} as Record<string, number>,
        totalStock: 0,
        hasQuantities: false,
        error: `Некорректное количество для размера ${size}`,
      }
    }

    hasQuantities = true
    sizeStock[size] = parsedAmount
  }

  const uniqueSizes = Array.from(new Set(sizes))
  const normalizedStock = Object.fromEntries(uniqueSizes.map((size) => [size, sizeStock[size] ?? 0]))
  const totalStock = Object.values(normalizedStock).reduce((sum, value) => sum + value, 0)

  return {
    sizes: uniqueSizes,
    sizeStock: normalizedStock,
    totalStock,
    hasQuantities,
    error: null as string | null,
  }
}

function mapProductToForm(product: CatalogProduct): ProductFormState {
  return {
    sku: product.sku,
    name: product.name,
    description: product.description ?? "",
    image: product.image,
    price: String(product.price),
    oldPrice: product.oldPrice == null ? "" : String(product.oldPrice),
    stock: String(product.stock),
    categoryId: "",
    sizes: formatSizeStock(product.sizeStock, product.sizes),
    color: product.color,
    material: product.material,
    gender: product.gender,
    season: product.season,
    brand: product.brand,
    isSale: product.isSale ?? false,
    isNew: product.isNew ?? false,
  }
}

function mapProductToSizeRows(product: CatalogProduct): SizeRow[] {
  const stockEntries = Object.entries(product.sizeStock ?? {})
  if (stockEntries.length > 0) {
    return stockEntries.map(([size, quantity], index) => ({
      id: `row-${index}`,
      size,
      quantity: String(quantity),
    }))
  }

  if (product.sizes.length > 0) {
    return product.sizes.map((size, index) => ({
      id: `row-${index}`,
      size,
      quantity: "0",
    }))
  }

  return initialSizeRows
}

export default function ProductsPage() {
  const { token } = useAuth()
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [productToDelete, setProductToDelete] = useState<CatalogProduct | null>(null)
  const [form, setForm] = useState<ProductFormState>(initialFormState)
  const [sizeRows, setSizeRows] = useState<SizeRow[]>(initialSizeRows)
  const [searchQuery, setSearchQuery] = useState("")

  const isEditing = editingProductId != null

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return products
    }

    return products.filter((product) => {
      const haystack = `${product.name} ${product.sku} ${product.category} ${product.brand}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [products, searchQuery])

  const loadData = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [productsData, categoriesData] = await Promise.all([getProducts(), getCategories()])
      setProducts(productsData)
      setCategories(categoriesData)
    } catch {
      setErrorMessage("Не удалось загрузить товары")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl)
      }
    }
  }, [localPreviewUrl])

  const resetForm = () => {
    setEditingProductId(null)
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl)
    }
    setLocalPreviewUrl(null)
    setForm(initialFormState)
    setSizeRows(initialSizeRows)
  }

  const startEdit = (product: CatalogProduct) => {
    setEditingProductId(product.id)
    setForm(mapProductToForm(product))
    setSizeRows(mapProductToSizeRows(product))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleNameChange = (name: string) => {
    if (isEditing) {
      setForm((state) => ({ ...state, name }))
      return
    }

    setForm((state) => ({
      ...state,
      name,
      sku: createSkuFromName(name),
    }))
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) {
      setErrorMessage("Нужна авторизация администратора")
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    const name = form.name.trim()
    const price = parseRequiredNumber(form.price)
    const oldPrice = parseOptionalNumber(form.oldPrice)
    const stock = parseRequiredNumber(form.stock)
    const categoryId = form.categoryId === "" ? null : Number(form.categoryId)
    const normalizedRows = sizeRows
      .map((row) => ({
        size: row.size.trim().toUpperCase(),
        quantity: row.quantity.trim(),
      }))
      .filter((row) => row.size.length > 0)

    if (normalizedRows.length === 0) {
      setErrorMessage("Добавьте хотя бы один размер")
      setIsSaving(false)
      return
    }

    const parsedSizeData = parseSizeStockInput(
      normalizedRows.map((row) => `${row.size}:${row.quantity || "0"}`).join(", "),
    )

    if (parsedSizeData.error) {
      setErrorMessage(parsedSizeData.error)
      setIsSaving(false)
      return
    }

    const invalidSizes = parsedSizeData.sizes.filter((size) => !ALLOWED_SIZES.includes(size as (typeof ALLOWED_SIZES)[number]))
    if (invalidSizes.length > 0) {
      setErrorMessage(`Недопустимые размеры: ${invalidSizes.join(", ")}`)
      setIsSaving(false)
      return
    }

    if (parsedSizeData.sizes.length !== new Set(parsedSizeData.sizes).size) {
      setErrorMessage("Размеры не должны повторяться")
      setIsSaving(false)
      return
    }

    if (!name) {
      setErrorMessage("Укажите название товара")
      setIsSaving(false)
      return
    }

    if (price == null || price <= 0) {
      setErrorMessage("Цена должна быть больше 0")
      setIsSaving(false)
      return
    }

    if (oldPrice != null && oldPrice < 0) {
      setErrorMessage("Старая цена не может быть отрицательной")
      setIsSaving(false)
      return
    }

    if (stock == null || !Number.isInteger(stock) || stock < 0) {
      setErrorMessage("Остаток должен быть целым числом от 0")
      setIsSaving(false)
      return
    }

    const finalStock = parsedSizeData.hasQuantities ? parsedSizeData.totalStock : stock

    if (categoryId != null && (!Number.isInteger(categoryId) || categoryId <= 0)) {
      setErrorMessage("Некорректная категория")
      setIsSaving(false)
      return
    }

    const finalSku = isEditing ? form.sku.trim().toUpperCase() : createSkuFromName(name)

    if (!form.image.trim()) {
      setErrorMessage("Сначала загрузите фото товара")
      setIsSaving(false)
      return
    }

    const payload = {
      sku: finalSku,
      name,
      description: form.description.trim() || undefined,
      image: form.image.trim() || undefined,
      price,
      oldPrice,
      stock: finalStock,
      categoryId,
      sizes: parsedSizeData.sizes,
      sizeStock: parsedSizeData.sizeStock,
      color: form.color.trim() || undefined,
      material: form.material.trim() || undefined,
      gender: form.gender.trim() || undefined,
      season: form.season.trim() || undefined,
      brand: form.brand.trim() || undefined,
      isSale: form.isSale,
      isNew: form.isNew,
    }

    try {
      if (isEditing && editingProductId != null) {
        await updateAdminProduct(token, editingProductId, payload)
        toast({
          title: "Изменения сохранены",
          description: `Товар ${finalSku} успешно обновлён.`,
        })
      } else {
        await createAdminProduct(token, payload)
        toast({
          title: "Товар добавлен",
          description: `Товар ${finalSku} успешно создан.`,
        })
      }

      await loadData()
      resetForm()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Не удалось сохранить товар"))
    } finally {
      setIsSaving(false)
    }
  }

  const onDelete = async () => {
    if (!token || !productToDelete) {
      return
    }

    setIsDeleting(true)
    setErrorMessage(null)

    try {
      await deleteAdminProduct(token, productToDelete.id)
      toast({
        title: "Товар удалён",
        description: `Товар ${productToDelete.sku} успешно удалён.`,
      })
      if (editingProductId === productToDelete.id) {
        resetForm()
      }
      setProductToDelete(null)
      await loadData()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Не удалось удалить товар"))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Товары</h1>
      <p className="text-sm text-muted-foreground mb-6">Управление каталогом и изображениями товаров</p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{isEditing ? "Редактировать товар" : "Добавить товар"}</CardTitle>
          <CardDescription>Артикул создается автоматически. Фото загружается файлом через UploadThing.</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage ? <p className="text-sm text-destructive mb-3">{errorMessage}</p> : null}

          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Артикул (автоматически)" value={form.sku} readOnly />
            <Input
              placeholder="Название"
              value={form.name}
              onChange={(event) => handleNameChange(event.target.value)}
              required
            />

            <div className="md:col-span-2 space-y-2">
              <p className="text-sm text-muted-foreground">Фото товара (перетащите файл или выберите)</p>
              <UploadDropzone
                endpoint="productImage"
                onBeforeUploadBegin={(files) => {
                  const selectedFile = files[0]
                  if (!selectedFile) {
                    return files
                  }

                  if (localPreviewUrl) {
                    URL.revokeObjectURL(localPreviewUrl)
                  }

                  const objectUrl = URL.createObjectURL(selectedFile)
                  setLocalPreviewUrl(objectUrl)
                  return files
                }}
                onUploadBegin={() => {
                  setIsUploadingImage(true)
                }}
                onClientUploadComplete={(res) => {
                  const file = res?.[0] as
                    | {
                        ufsUrl?: string
                        appUrl?: string
                        serverData?: { url?: string }
                      }
                    | undefined

                  const uploadedUrl =
                    file?.serverData?.url ??
                    file?.ufsUrl ??
                    file?.appUrl ??
                    ""

                  if (!uploadedUrl) {
                    toast({
                      title: "Ошибка загрузки",
                      description: "Сервер не вернул URL изображения.",
                      variant: "destructive",
                    })
                    return
                  }

                  setForm((state) => ({ ...state, image: uploadedUrl }))
                  if (localPreviewUrl) {
                    URL.revokeObjectURL(localPreviewUrl)
                    setLocalPreviewUrl(null)
                  }
                  setIsUploadingImage(false)
                  toast({
                    title: "Изображение загружено",
                    description: "Фото успешно загружено и добавлено в карточку товара.",
                  })
                }}
                onUploadError={(error: Error) => {
                  setIsUploadingImage(false)
                  setErrorMessage(`Ошибка загрузки фото: ${error.message}`)
                  toast({
                    title: "Ошибка загрузки",
                    description: error.message,
                    variant: "destructive",
                  })
                }}
                appearance={{
                  container: "border border-dashed border-border rounded-md",
                  label: "text-sm text-muted-foreground",
                  allowedContent: "text-xs text-muted-foreground",
                  button: "ut-ready:bg-primary ut-uploading:cursor-not-allowed ut-uploading:bg-primary/70",
                }}
              />

              {isUploadingImage ? (
                <p className="text-xs text-muted-foreground">Загрузка изображения...</p>
              ) : null}

              {form.image ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Превью загруженного фото:</p>
                  <img
                    src={localPreviewUrl ?? form.image}
                    alt="Предпросмотр товара"
                    className="h-32 w-24 object-cover rounded-md border border-border"
                    onError={() => {
                      setErrorMessage("Не удалось загрузить превью изображения. Попробуйте загрузить файл заново.")
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm((state) => ({ ...state, image: "" }))}
                  >
                    Удалить фото
                  </Button>
                </div>
              ) : null}
            </div>

            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Цена"
              value={form.price}
              onChange={(event) => setForm((state) => ({ ...state, price: event.target.value }))}
              required
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Старая цена"
              value={form.oldPrice}
              onChange={(event) => setForm((state) => ({ ...state, oldPrice: event.target.value }))}
            />
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Остаток"
              value={form.stock}
              onChange={(event) => setForm((state) => ({ ...state, stock: event.target.value }))}
              required
            />
            <select
              value={form.categoryId}
              onChange={(event) => setForm((state) => ({ ...state, categoryId: event.target.value }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Без категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Цвет"
              value={form.color}
              onChange={(event) => setForm((state) => ({ ...state, color: event.target.value }))}
            />
            <Input
              placeholder="Материал"
              value={form.material}
              onChange={(event) => setForm((state) => ({ ...state, material: event.target.value }))}
            />
            <Input
              placeholder="Пол"
              value={form.gender}
              onChange={(event) => setForm((state) => ({ ...state, gender: event.target.value }))}
            />
            <Input
              placeholder="Сезон"
              value={form.season}
              onChange={(event) => setForm((state) => ({ ...state, season: event.target.value }))}
            />
            <Input
              placeholder="Бренд"
              value={form.brand}
              onChange={(event) => setForm((state) => ({ ...state, brand: event.target.value }))}
            />
            <Input
              placeholder="Описание"
              value={form.description}
              onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
            />

            <div className="col-span-1 md:col-span-2 rounded-md border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Размеры и остатки</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSizeRows((current) => [
                      ...current,
                      { id: `row-${Date.now()}-${current.length}`, size: "", quantity: "0" },
                    ])
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Добавить размер
                </Button>
              </div>

              <div className="space-y-2">
                {sizeRows.map((row, index) => (
                  <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    {(() => {
                      const selectedInOtherRows = new Set(
                        sizeRows
                          .filter((entry) => entry.id !== row.id)
                          .map((entry) => entry.size)
                          .filter(Boolean),
                      )

                      const availableSizeOptions = ALLOWED_SIZES.filter(
                        (sizeOption) => sizeOption === row.size || !selectedInOtherRows.has(sizeOption),
                      )

                      return (
                    <Select
                      value={row.size || undefined}
                      onValueChange={(value) => {
                        setSizeRows((current) =>
                          current.map((entry) =>
                            entry.id === row.id ? { ...entry, size: value } : entry,
                          ),
                        )
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Размер" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSizeOptions.map((sizeOption) => (
                          <SelectItem key={sizeOption} value={sizeOption}>
                            {sizeOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                      )
                    })()}
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Количество"
                      value={row.quantity}
                      onChange={(event) => {
                        const value = event.target.value
                        setSizeRows((current) =>
                          current.map((entry) =>
                            entry.id === row.id ? { ...entry, quantity: value } : entry,
                          ),
                        )
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={sizeRows.length <= 1}
                      onClick={() => {
                        setSizeRows((current) => current.filter((entry) => entry.id !== row.id))
                      }}
                      aria-label={`Удалить размер ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="text-sm">Товар по акции</span>
                <Switch
                  checked={form.isSale}
                  onCheckedChange={(checked) => setForm((state) => ({ ...state, isSale: checked }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="text-sm">Новинка</span>
                <Switch
                  checked={form.isNew}
                  onCheckedChange={(checked) => setForm((state) => ({ ...state, isNew: checked }))}
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 flex gap-2">
              <Button type="submit" disabled={isSaving || isUploadingImage}>
                <Plus className="h-4 w-4 mr-2" />
                {isUploadingImage ? "Дождитесь загрузки фото" : isEditing ? "Сохранить" : "Добавить"}
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
          <CardTitle className="text-base">Список товаров</CardTitle>
          <CardDescription>Нажмите «Изменить», чтобы редактировать карточку товара</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Поиск по имени, SKU, категории, бренду"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="mb-4"
          />

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Товары не найдены.</p>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border border-border rounded-md p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-16 w-12 object-cover rounded-md border border-border"
                    />
                    <div>
                      <p className="text-sm font-semibold">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.category} · {product.stock} шт. · {product.price.toLocaleString("ru-RU")} ₽
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Размеры: {formatSizeStock(product.sizeStock, product.sizes) || "не указаны"}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {product.stock <= 0 ? <Badge variant="destructive">Нет в наличии</Badge> : null}
                        {product.isSale ? <Badge variant="secondary">Акция</Badge> : null}
                        {product.isNew ? <Badge variant="outline">Новинка</Badge> : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(product)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Изменить
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setProductToDelete(product)}>
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

      <AlertDialog
        open={productToDelete != null}
        onOpenChange={(open) => {
          if (!open) {
            setProductToDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить товар?</AlertDialogTitle>
            <AlertDialogDescription>
              Товар {productToDelete?.sku} будет удалён без возможности восстановления.
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
