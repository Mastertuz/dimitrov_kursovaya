import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function AboutPage() {
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
            <BreadcrumbPage>О магазине</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-3xl font-bold tracking-tight mb-2 text-balance">О магазине</h1>
      <p className="text-muted-foreground mb-8">
        Информационная система «Магазин одежды — учет продаж»
      </p>

      <div className="prose prose-neutral max-w-none mb-12">
        <p className="text-foreground leading-relaxed">
          Наш магазин одежды предлагает широкий ассортимент качественной одежды для мужчин, женщин и детей. 
          Мы используем современные технологии, включая методы машинного обучения для прогнозирования 
          спроса по размерам, что позволяет оптимизировать закупки и всегда иметь в наличии нужные размеры.
        </p>
        <p className="text-foreground leading-relaxed mt-4">
          Система разработана на основе стека Next.js + Express.js + Prisma + PostgreSQL с использованием 
          контейнеризации Docker для удобного развертывания. AI-модуль на базе Random Forest и LSTM обеспечивает 
          точный прогноз востребованности размеров.
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-4">Наши ценности</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Качество</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Мы работаем только с проверенными поставщиками и контролируем качество каждого изделия.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Доступность</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Широкий размерный ряд от XS до XXL и честные цены без накруток.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Технологии</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Используем AI для прогнозирования спроса и оптимизации ассортимента.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Сервис</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Быстрая доставка, удобный возврат и поддержка клиентов 7 дней в неделю.</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mb-4">Стек технологий</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="flex items-center justify-center p-3 bg-muted rounded-md text-sm font-medium">Next.js 16</div>
        <div className="flex items-center justify-center p-3 bg-muted rounded-md text-sm font-medium">React 19</div>
        <div className="flex items-center justify-center p-3 bg-muted rounded-md text-sm font-medium">Express.js</div>
        <div className="flex items-center justify-center p-3 bg-muted rounded-md text-sm font-medium">Prisma ORM</div>
        <div className="flex items-center justify-center p-3 bg-muted rounded-md text-sm font-medium">PostgreSQL</div>
        <div className="flex items-center justify-center p-3 bg-muted rounded-md text-sm font-medium">Docker</div>
        <div className="flex items-center justify-center p-3 bg-muted rounded-md text-sm font-medium">TensorFlow.js</div>
        <div className="flex items-center justify-center p-3 bg-muted rounded-md text-sm font-medium">shadcn/ui</div>
        <div className="flex items-center justify-center p-3 bg-muted rounded-md text-sm font-medium">Tailwind CSS</div>
      </div>
    </div>
  )
}
