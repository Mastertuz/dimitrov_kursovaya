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
  ChevronLeft,
  BarChart3,
  TicketPercent,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-muted/30 shrink-0">
      <div className="flex items-center gap-2 h-16 px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">На сайт</span>
        </Link>
      </div>
      <div className="px-3 py-4">
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Управление
        </p>
        <nav className="flex flex-col gap-0.5">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/admin" && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
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
      </div>
    </aside>
  )
}
