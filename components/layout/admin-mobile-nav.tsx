"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Users,
  Brain,
  FileText,
  Settings,
  Menu,
  ChevronLeft,
  BarChart3,
  TicketPercent,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const links = [
  { href: "/admin", label: "Панель", icon: LayoutDashboard },
  { href: "/admin/products", label: "Товары", icon: Package },
  { href: "/admin/orders", label: "Заказы", icon: ClipboardList },
  { href: "/admin/sales", label: "Продажи", icon: ShoppingCart },
  { href: "/admin/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/admin/promo-codes", label: "Промокоды", icon: TicketPercent },
  { href: "/admin/forecast", label: "AI Прогноз", icon: Brain },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/audit", label: "Журнал аудита", icon: FileText },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
]

export function AdminMobileNav() {
  const pathname = usePathname()

  return (
    <div className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-background">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Меню администратора</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle className="text-left">Панель управления</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              На сайт
            </Link>
          </div>
          <nav className="flex flex-col gap-0.5 mt-4">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/admin" && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
      <span className="text-sm font-semibold">Панель управления</span>
      <div className="w-10" />
    </div>
  )
}
