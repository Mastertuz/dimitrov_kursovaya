"use client"

import { Save, Store, Truck, CreditCard, Bell, Database, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Конфигурация магазина и системных параметров
          </p>
        </div>
        <Button size="sm">
          <Save className="h-4 w-4 mr-2" />
          Сохранить изменения
        </Button>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="store" className="gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Магазин</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Доставка</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Оплата</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Уведомления</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Система</span>
          </TabsTrigger>
        </TabsList>

        {/* Store settings */}
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Общие настройки магазина</CardTitle>
              <CardDescription>Основная информация о вашем магазине</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store-name">Название магазина</Label>
                  <Input id="store-name" defaultValue="МАГАЗИН ОДЕЖДЫ" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-email">Email магазина</Label>
                  <Input id="store-email" type="email" defaultValue="info@clothing-store.ru" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-phone">Телефон</Label>
                  <Input id="store-phone" defaultValue="+7 (495) 123-45-67" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-address">Адрес</Label>
                  <Input id="store-address" defaultValue="г. Москва, ул. Примерная, д. 1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-desc">Описание</Label>
                <Textarea
                  id="store-desc"
                  defaultValue="Магазин качественной одежды для мужчин, женщин и детей. Широкий выбор, доступные цены, быстрая доставка."
                  rows={3}
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Режим работы</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Будни</Label>
                    <Input defaultValue="10:00 — 21:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Выходные</Label>
                    <Input defaultValue="10:00 — 20:00" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery settings */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Настройки доставки</CardTitle>
              <CardDescription>Управление способами и условиями доставки</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Минимальная сумма для бесплатной доставки</Label>
                  <Input type="number" defaultValue="5000" />
                </div>
                <div className="space-y-2">
                  <Label>Стоимость доставки (стандартная)</Label>
                  <Input type="number" defaultValue="350" />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Способы доставки</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { name: "Курьерская доставка", enabled: true },
                    { name: "Самовывоз из магазина", enabled: true },
                    { name: "Почта России", enabled: false },
                    { name: "СДЭК", enabled: true },
                    { name: "Boxberry", enabled: false },
                  ].map((method) => (
                    <div key={method.name} className="flex items-center justify-between rounded-md border border-border p-3">
                      <span className="text-sm">{method.name}</span>
                      <Switch defaultChecked={method.enabled} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment settings */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Настройки оплаты</CardTitle>
              <CardDescription>Управление способами оплаты</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Способы оплаты</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { name: "Банковская карта онлайн", enabled: true },
                    { name: "Наличные при получении", enabled: true },
                    { name: "Apple Pay / Google Pay", enabled: true },
                    { name: "СБП (Система быстрых платежей)", enabled: false },
                    { name: "Рассрочка", enabled: false },
                  ].map((method) => (
                    <div key={method.name} className="flex items-center justify-between rounded-md border border-border p-3">
                      <span className="text-sm">{method.name}</span>
                      <Switch defaultChecked={method.enabled} />
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Валюта</Label>
                <Select defaultValue="rub">
                  <SelectTrigger className="w-full sm:w-60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rub">Российский рубль (RUB)</SelectItem>
                    <SelectItem value="usd">Доллар США (USD)</SelectItem>
                    <SelectItem value="eur">Евро (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Уведомления</CardTitle>
              <CardDescription>Настройка email и push-уведомлений</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3">
                {[
                  { name: "Новый заказ", desc: "Уведомление при создании нового заказа", enabled: true },
                  { name: "Возврат товара", desc: "Уведомление при запросе возврата", enabled: true },
                  { name: "Мало товара на складе", desc: "Оповещение, когда остаток менее 10 шт.", enabled: true },
                  { name: "Новый пользователь", desc: "Уведомление о регистрации клиента", enabled: false },
                  { name: "Ежедневный отчет", desc: "Сводка по продажам за день", enabled: true },
                  { name: "Еженедельный отчет", desc: "Аналитика за неделю", enabled: false },
                ].map((notif) => (
                  <div key={notif.name} className="flex items-start justify-between rounded-md border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{notif.name}</p>
                      <p className="text-xs text-muted-foreground">{notif.desc}</p>
                    </div>
                    <Switch defaultChecked={notif.enabled} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System settings */}
        <TabsContent value="system">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">База данных</CardTitle>
                <CardDescription>Информация о хранилище данных</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">СУБД</p>
                    <p className="font-medium">PostgreSQL 16.2</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Размер БД</p>
                    <p className="font-medium">248 MB</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Записей в логе</p>
                    <p className="font-medium">4 218</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm">Создать бэкап</Button>
                  <Button variant="outline" size="sm">Восстановить из бэкапа</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Модуль</CardTitle>
                <CardDescription>Параметры модуля прогнозирования</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Модель</p>
                    <p className="font-medium">Random Forest + LSTM</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Последнее обучение</p>
                    <p className="font-medium">14.02.2026</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Точность (R2)</p>
                    <p className="font-medium">0.873</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Автоматическое переобучение</p>
                    <p className="text-xs text-muted-foreground">Модель переобучается каждые 7 дней</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Безопасность</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Двухфакторная аутентификация</p>
                    <p className="text-xs text-muted-foreground">Для администраторов</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Журнал аудита</p>
                    <p className="text-xs text-muted-foreground">Логирование всех действий</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Блокировка после 5 попыток</p>
                    <p className="text-xs text-muted-foreground">Автоматическая блокировка при неудачных входах</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
