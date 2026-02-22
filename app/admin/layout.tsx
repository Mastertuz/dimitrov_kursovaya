import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { AdminMobileNav } from "@/components/layout/admin-mobile-nav"
import { RequireRole } from "@/components/auth/guards"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireRole roles={["ADMIN"]} fallbackPath="/">
    <div className="min-h-screen flex flex-col lg:flex-row">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminMobileNav />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
    </RequireRole>
  )
}
