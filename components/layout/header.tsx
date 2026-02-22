"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from "@/components/auth/auth-provider"
import { getCart, getFavorites, SHOP_CHANGED_EVENT } from "@/lib/shop-api"

const categories = [
  { name: "Мужчинам", href: "/catalog?gender=male" },
  { name: "Женщинам", href: "/catalog?gender=female" },
  { name: "Детям", href: "/catalog?gender=kids" },
  { name: "Новинки", href: "/catalog?sort=new" },
  { name: "Распродажа", href: "/catalog?sale=true" },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading, logout } = useAuth()
  const isAdmin = user?.role === "ADMIN"
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [cartCount, setCartCount] = useState(0)
  const [favoritesCount, setFavoritesCount] = useState(0)

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("q") ?? ""
    setSearchQuery(query)
  }, [pathname])

  useEffect(() => {
    const loadCounters = async () => {
      if (!token || !isAuthenticated) {
        setCartCount(0)
        setFavoritesCount(0)
        return
      }

      try {
        const [cart, favorites] = await Promise.all([getCart(token), getFavorites(token)])
        setCartCount(cart.summary.totalItems)
        setFavoritesCount(favorites.length)
      } catch {
        setCartCount(0)
        setFavoritesCount(0)
      }
    }

    void loadCounters()

    const onShopChanged = () => {
      void loadCounters()
    }

    window.addEventListener(SHOP_CHANGED_EVENT, onShopChanged)
    return () => {
      window.removeEventListener(SHOP_CHANGED_EVENT, onShopChanged)
    }
  }, [token, isAuthenticated, pathname])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedQuery = searchQuery.trim()

    if (!normalizedQuery) {
      router.push("/catalog")
      setSearchOpen(false)
      return
    }

    router.push(`/catalog?q=${encodeURIComponent(normalizedQuery)}`)
    setSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-8 text-xs">
          <span>Бесплатная доставка от 5 000 руб.</span>
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/about" className="hover:underline">
              О магазине
            </Link>
            <Link href="/delivery" className="hover:underline">
              Доставка
            </Link>
            <Link href="/contacts" className="hover:underline">
              Контакты
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left">Меню</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-6">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    className="px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
                <div className="my-2 border-t border-border" />
                {isAuthenticated ? (
                  <>
                    <span className="px-3 py-2.5 text-sm text-muted-foreground">
                      {user?.fullName}
                    </span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-3 py-2.5 text-left text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                      Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                      Войти
                    </Link>
                    <Link
                      href="/register"
                      className="px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                      Регистрация
                    </Link>
                  </>
                )}
                <div className="my-2 border-t border-border" />
                <Link
                  href="/orders"
                  className="px-3 py-2.5 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                >
                  Мои заказы
                </Link>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="px-3 py-2.5 text-sm text-muted-foreground font-medium rounded-md hover:bg-accent transition-colors"
                  >
                    Панель управления
                  </Link>
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                MO
              </span>
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:inline">
              МАГАЗИН ОДЕЖДЫ
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Search + Actions */}
          <div className="flex items-center gap-1">
            {/* Desktop search */}
            <div className="hidden md:flex items-center relative">
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 animate-in slide-in-from-right-2">
                  <Input
                    placeholder="Поиск товаров..."
                    className="w-56 h-9"
                    autoFocus
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                  <Button type="submit" variant="outline" size="sm" className="h-9">
                    Найти
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Поиск</span>
                </Button>
              )}
            </div>

            {/* Mobile search */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
              <span className="sr-only">Поиск</span>
            </Button>

            <Link href="/favorites">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {favoritesCount > 0 ? (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                    {favoritesCount}
                  </Badge>
                ) : null}
                <span className="sr-only">Избранное</span>
              </Button>
            </Link>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Аккаунт</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isLoading ? null : isAuthenticated ? (
                  <>
                    <DropdownMenuItem disabled>{user?.fullName}</DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders">Мои заказы</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>Выйти</DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/login">Войти</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/register">Регистрация</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/orders">Мои заказы</Link>
                    </DropdownMenuItem>
                  </>
                )}
                {isAdmin ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Панель управления</Link>
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 ? (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                    {cartCount}
                  </Badge>
                ) : null}
                <span className="sr-only">Корзина</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
