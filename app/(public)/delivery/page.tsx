import Link from "next/link"
import { Truck, Clock, MapPin, CreditCard, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function DeliveryPage() {
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
            <BreadcrumbPage>Доставка и оплата</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-3xl font-bold tracking-tight mb-2 text-balance">Доставка и оплата</h1>
      <p className="text-muted-foreground mb-8">
        Информация о способах доставки, сроках и условиях возврата
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Truck className="h-8 w-8 mb-3" />
            <h3 className="font-semibold mb-1">Быстрая доставка</h3>
            <p className="text-sm text-muted-foreground">От 1 дня по Москве</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <CreditCard className="h-8 w-8 mb-3" />
            <h3 className="font-semibold mb-1">Удобная оплата</h3>
            <p className="text-sm text-muted-foreground">Карта, наличные, СБП</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <RotateCcw className="h-8 w-8 mb-3" />
            <h3 className="font-semibold mb-1">Возврат 14 дней</h3>
            <p className="text-sm text-muted-foreground">Бесплатный возврат</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mb-4">Способы доставки</h2>
      <Card className="mb-8">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Способ</TableHead>
                  <TableHead>Сроки</TableHead>
                  <TableHead>Стоимость</TableHead>
                  <TableHead>Бесплатно</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Курьерская доставка</TableCell>
                  <TableCell>1-2 дня</TableCell>
                  <TableCell>350 руб.</TableCell>
                  <TableCell className="text-muted-foreground">от 5 000 руб.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Самовывоз из магазина</TableCell>
                  <TableCell>Сегодня</TableCell>
                  <TableCell>Бесплатно</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">СДЭК (пункт выдачи)</TableCell>
                  <TableCell>2-5 дней</TableCell>
                  <TableCell>от 250 руб.</TableCell>
                  <TableCell className="text-muted-foreground">от 7 000 руб.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Почта России</TableCell>
                  <TableCell>5-14 дней</TableCell>
                  <TableCell>от 200 руб.</TableCell>
                  <TableCell className="text-muted-foreground">от 10 000 руб.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4">Условия возврата</h2>
      <Card>
        <CardContent className="p-6">
          <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <li>Вы можете вернуть товар в течение 14 дней с момента получения.</li>
            <li>Товар должен быть в оригинальной упаковке, с сохраненными бирками.</li>
            <li>Возврат осуществляется бесплатно курьерской службой или в магазине.</li>
            <li>Денежные средства возвращаются тем же способом оплаты в течение 3-5 рабочих дней.</li>
            <li>Для оформления возврата свяжитесь с нашей поддержкой или оформите заявку в личном кабинете.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
