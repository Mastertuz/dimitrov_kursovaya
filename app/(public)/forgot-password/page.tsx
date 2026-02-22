import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Главная</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Восстановление пароля</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-bold tracking-tight mb-3">Восстановление пароля</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Функция восстановления пароля будет доступна на следующем этапе.
      </p>
      <Button asChild>
        <Link href="/login">Вернуться ко входу</Link>
      </Button>
    </div>
  )
}
