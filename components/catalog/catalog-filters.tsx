"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"

export type CatalogFiltersState = {
  priceRange: [number, number]
  categories: string[]
  sizes: string[]
  colors: string[]
  materials: string[]
  genders: string[]
  seasons: string[]
  brands: string[]
  availability: string[]
  onlySale: boolean
  onlyNew: boolean
}

export const defaultCatalogFilters: CatalogFiltersState = {
  priceRange: [0, 50000],
  categories: [],
  sizes: [],
  colors: [],
  materials: [],
  genders: [],
  seasons: [],
  brands: [],
  availability: [],
  onlySale: false,
  onlyNew: false,
}

export const categoryOptions = [
  { id: "outerwear", label: "Верхняя одежда" },
  { id: "dresses", label: "Платья" },
  { id: "shirts", label: "Рубашки" },
  { id: "tshirts", label: "Футболки" },
  { id: "jeans", label: "Джинсы" },
  { id: "pants", label: "Брюки" },
  { id: "knitwear", label: "Трикотаж" },
  { id: "skirts", label: "Юбки" },
  { id: "accessories", label: "Аксессуары" },
]

export const sizeOptions = [
  "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL",
  "28", "29", "30", "31", "32", "33", "34", "36",
]

export const colorOptions = [
  { id: "black", label: "Черный", hex: "#000000" },
  { id: "white", label: "Белый", hex: "#FFFFFF" },
  { id: "gray", label: "Серый", hex: "#6B7280" },
  { id: "navy", label: "Темно-синий", hex: "#1E3A5F" },
  { id: "blue", label: "Голубой", hex: "#3B82F6" },
  { id: "red", label: "Красный", hex: "#EF4444" },
  { id: "green", label: "Зеленый", hex: "#22C55E" },
  { id: "beige", label: "Бежевый", hex: "#D4B896" },
  { id: "brown", label: "Коричневый", hex: "#8B5C2A" },
  { id: "pink", label: "Розовый", hex: "#EC4899" },
]

export const materialOptions = [
  { id: "cotton", label: "Хлопок" },
  { id: "linen", label: "Лен" },
  { id: "wool", label: "Шерсть" },
  { id: "silk", label: "Шелк" },
  { id: "polyester", label: "Полиэстер" },
  { id: "cashmere", label: "Кашемир" },
  { id: "denim", label: "Деним" },
  { id: "viscose", label: "Вискоза" },
  { id: "nylon", label: "Нейлон" },
]

export const genderOptions = [
  { id: "male", label: "Мужской" },
  { id: "female", label: "Женский" },
  { id: "kids", label: "Детский" },
  { id: "unisex", label: "Унисекс" },
]

export const seasonOptions = [
  { id: "winter", label: "Зима" },
  { id: "spring", label: "Весна" },
  { id: "summer", label: "Лето" },
  { id: "autumn", label: "Осень" },
  { id: "demi", label: "Демисезон" },
]

export const brandOptions = [
  { id: "brand1", label: "Fashion House" },
  { id: "brand2", label: "Urban Style" },
  { id: "brand3", label: "Classic Fit" },
  { id: "brand4", label: "Eco Wear" },
  { id: "brand5", label: "Prime Collection" },
]

export const availabilityOptions = [
  { id: "instock", label: "В наличии" },
  { id: "preorder", label: "Под заказ" },
  { id: "outofstock", label: "Нет в наличии" },
]

const PRICE_MIN = 0
const PRICE_MAX = 50000
const PRICE_STEP = 500

type FilterSectionProps = {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function FilterSection({ title, defaultOpen = true, children }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3">
        <span className="text-sm font-semibold">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

type CatalogFiltersProps = {
  value: CatalogFiltersState
  onChange: (next: CatalogFiltersState) => void
}

function toggleItem(arr: string[], item: string) {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
}

export function CatalogFilters({ value, onChange }: CatalogFiltersProps) {
  const [minPriceInput, setMinPriceInput] = useState(String(value.priceRange[0]))
  const [maxPriceInput, setMaxPriceInput] = useState(String(value.priceRange[1]))

  const clampPrice = (price: number, fallback: number) => {
    if (!Number.isFinite(price)) {
      return fallback
    }

    return Math.min(PRICE_MAX, Math.max(PRICE_MIN, price))
  }

  const applyPriceRange = (nextMin: number, nextMax: number) => {
    const min = clampPrice(nextMin, value.priceRange[0])
    const max = clampPrice(nextMax, value.priceRange[1])
    const normalizedMin = Math.min(min, max)
    const normalizedMax = Math.max(min, max)

    onChange({ ...value, priceRange: [normalizedMin, normalizedMax] })
  }

  useEffect(() => {
    setMinPriceInput(String(value.priceRange[0]))
  }, [value.priceRange[0]])

  useEffect(() => {
    setMaxPriceInput(String(value.priceRange[1]))
  }, [value.priceRange[1]])

  const commitMinPriceInput = () => {
    if (minPriceInput.trim() === "") {
      setMinPriceInput(String(value.priceRange[0]))
      return
    }

    applyPriceRange(Number(minPriceInput), value.priceRange[1])
  }

  const commitMaxPriceInput = () => {
    if (maxPriceInput.trim() === "") {
      setMaxPriceInput(String(value.priceRange[1]))
      return
    }

    applyPriceRange(value.priceRange[0], Number(maxPriceInput))
  }

  const activeFiltersCount =
    value.categories.length +
    value.sizes.length +
    value.colors.length +
    value.materials.length +
    value.genders.length +
    value.seasons.length +
    value.brands.length +
    value.availability.length +
    (value.onlySale ? 1 : 0) +
    (value.onlyNew ? 1 : 0) +
    (value.priceRange[0] > PRICE_MIN || value.priceRange[1] < PRICE_MAX ? 1 : 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">Фильтры</h3>
        {activeFiltersCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(defaultCatalogFilters)}
            className="text-xs text-muted-foreground h-7"
          >
            Сбросить ({activeFiltersCount})
          </Button>
        ) : null}
      </div>

      <Separator />

      <div className="py-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={value.onlyNew}
            onCheckedChange={(checked) => onChange({ ...value, onlyNew: checked === true })}
          />
          <span className="text-sm">Только новинки</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={value.onlySale}
            onCheckedChange={(checked) => onChange({ ...value, onlySale: checked === true })}
          />
          <span className="text-sm">Только со скидкой</span>
        </label>
      </div>

      <Separator />

      <FilterSection title="Цена, руб.">
        <div className="px-1">
          <p className="text-xs text-muted-foreground mb-2">Укажите диапазон цены</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="От"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={minPriceInput}
              onChange={(event) => {
                const nextValue = event.target.value
                setMinPriceInput(nextValue)

                if (nextValue.trim() === "") {
                  return
                }

                applyPriceRange(Number(nextValue), value.priceRange[1])
              }}
              onBlur={commitMinPriceInput}
            />
            <Input
              type="number"
              inputMode="numeric"
              placeholder="До"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={maxPriceInput}
              onChange={(event) => {
                const nextValue = event.target.value
                setMaxPriceInput(nextValue)

                if (nextValue.trim() === "") {
                  return
                }

                applyPriceRange(value.priceRange[0], Number(nextValue))
              }}
              onBlur={commitMaxPriceInput}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>От {value.priceRange[0].toLocaleString("ru-RU")}</span>
            <span>До {value.priceRange[1].toLocaleString("ru-RU")}</span>
          </div>
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Пол">
        <div className="flex flex-col gap-2">
          {genderOptions.map((option) => (
            <label key={option.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={value.genders.includes(option.id)}
                onCheckedChange={() =>
                  onChange({ ...value, genders: toggleItem(value.genders, option.id) })
                }
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Категория">
        <div className="flex flex-col gap-2">
          {categoryOptions.map((option) => (
            <label key={option.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={value.categories.includes(option.id)}
                onCheckedChange={() =>
                  onChange({ ...value, categories: toggleItem(value.categories, option.id) })
                }
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Размер">
        <div className="flex flex-wrap gap-1.5">
          {sizeOptions.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onChange({ ...value, sizes: toggleItem(value.sizes, size) })}
              className={`h-8 min-w-[2.5rem] px-2 text-xs font-medium rounded border transition-colors ${
                value.sizes.includes(size)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-foreground/30"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Цвет">
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange({ ...value, colors: toggleItem(value.colors, option.id) })}
              className={`flex items-center gap-2 h-8 px-2.5 rounded border text-xs transition-colors ${
                value.colors.includes(option.id)
                  ? "border-foreground bg-accent"
                  : "border-border hover:border-foreground/30"
              }`}
              title={option.label}
            >
              <span
                className="h-3.5 w-3.5 rounded-full shrink-0 border border-border"
                style={{ backgroundColor: option.hex }}
              />
              <span className="text-xs">{option.label}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Материал">
        <div className="flex flex-col gap-2">
          {materialOptions.map((option) => (
            <label key={option.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={value.materials.includes(option.id)}
                onCheckedChange={() =>
                  onChange({ ...value, materials: toggleItem(value.materials, option.id) })
                }
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Сезон">
        <div className="flex flex-col gap-2">
          {seasonOptions.map((option) => (
            <label key={option.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={value.seasons.includes(option.id)}
                onCheckedChange={() =>
                  onChange({ ...value, seasons: toggleItem(value.seasons, option.id) })
                }
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Бренд" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          {brandOptions.map((option) => (
            <label key={option.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={value.brands.includes(option.id)}
                onCheckedChange={() =>
                  onChange({ ...value, brands: toggleItem(value.brands, option.id) })
                }
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <Separator />

      <FilterSection title="Наличие">
        <div className="flex flex-col gap-2">
          {availabilityOptions.map((option) => (
            <label key={option.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={value.availability.includes(option.id)}
                onCheckedChange={() =>
                  onChange({ ...value, availability: toggleItem(value.availability, option.id) })
                }
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  )
}
