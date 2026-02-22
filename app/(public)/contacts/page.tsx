import Link from "next/link"
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContactsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Главная</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Контакты</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-3xl font-bold tracking-tight mb-2 text-balance">Контакты</h1>
      <p className="text-muted-foreground mb-8">
        Свяжитесь с нами любым удобным способом
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Адрес</h3>
              <p className="text-sm text-muted-foreground">г. Москва, ул. Примерная, д. 1</p>
              <p className="text-sm text-muted-foreground">ТЦ «Мода», 2 этаж</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Телефон</h3>
              <p className="text-sm text-muted-foreground">+7 (495) 123-45-67</p>
              <p className="text-sm text-muted-foreground">+7 (800) 100-20-30 (бесплатно)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Email</h3>
              <p className="text-sm text-muted-foreground">info@clothing-store.ru</p>
              <p className="text-sm text-muted-foreground">support@clothing-store.ru</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Режим работы</h3>
              <p className="text-sm text-muted-foreground">Пн-Пт: 10:00 — 21:00</p>
              <p className="text-sm text-muted-foreground">Сб-Вс: 10:00 — 20:00</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mb-4">Обратная связь</h2>
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input id="name" placeholder="Ваше имя" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="example@mail.ru" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <Label htmlFor="subject">Тема</Label>
            <Input id="subject" placeholder="Тема обращения" />
          </div>
          <div className="space-y-2 mb-6">
            <Label htmlFor="message">Сообщение</Label>
            <Textarea id="message" placeholder="Ваше сообщение..." rows={4} />
          </div>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Отправить
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
