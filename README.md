# Kursach — интернет-магазин одежды

Полноценный fullstack-проект интернет-магазина с публичной витриной, корзиной/избранным, оформлением заказа, оплатой через YooKassa и админ-панелью.

## Что умеет сайт

### Публичная часть
- Каталог товаров и карточка товара
- Выбор размера, проверка остатков по размеру
- Избранное и корзина (размер-зависимые позиции)
- Промокоды в корзине
- Оформление заказа с выбором даты
- Онлайн-оплата через YooKassa (redirect flow)
- Страница успешной оплаты с деталями заказа
- Личный раздел «Мои заказы»

### Бизнес-логика остатков
- Остатки хранятся по размерам (`sizeStock`) и общим количеством (`stock`)
- При создании заказа остатки уменьшаются в БД
- Если остаток становится `0`, товар не удаляется, а отображается как «Нет в наличии»

### Админ-панель
- Управление товарами (включая остатки по размерам)
- Просмотр заказов
- Продажи, аналитика и графики
- Промокоды
- Аудит действий

---

## Технологии

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS + shadcn/ui
- Recharts (графики)

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT-аутентификация + role-based access

### Инфраструктура
- Docker + Docker Compose
- Отдельные контейнеры: `frontend`, `backend`, `db`

---

## Структура проекта

- `app/` — маршруты и страницы Next.js
- `components/` — UI и бизнес-компоненты фронтенда
- `lib/` — клиент API, утилиты
- `server/src/` — API (controllers/services/repositories)
- `server/prisma/` — схема БД, миграции, seed
- `docker-compose.yml` — контейнеризация проекта

---

## Переменные окружения

### Frontend
- Скопируйте `.env.example` в `.env`.
- Заполните значения переменных под вашу среду.

### Backend
- Скопируйте `server/.env.example` в `server/.env`.
- Заполните значения переменных под вашу среду.

> В репозиторий не должны попадать реальные секреты (`JWT_SECRET`, ключи оплаты, пароли, реальные строки подключения БД).

---

## Запуск проекта

## 1) Рекомендуемый способ — Docker

### Требования
- Docker Desktop
- Docker Compose v2

### Запуск
```bash
npm run docker:up
```

По умолчанию поднимаются:
- frontend: http://localhost:3000
- backend API: http://localhost:54001/api
- postgres: `localhost:5433`

### Остановка
```bash
npm run docker:down
```

### Остановка + удаление данных БД
```bash
npm run docker:down:v
```

### Когда код backend изменился
Обычный restart **не** пересобирает образ. Используйте:

```bash
docker compose up -d --build backend
```

---

## 2) Локальный запуск без Docker (для разработки)

### Шаги
1. Установить зависимости фронта:
```bash
npm install
```

2. Установить зависимости backend:
```bash
cd server
npm install
```

3. Поднять PostgreSQL (локально или в Docker) и проверить `DATABASE_URL`.

4. В `server/` применить схему и сгенерировать Prisma Client:
```bash
npm run prisma:generate
npm run prisma:push
```

5. (Опционально) заполнить БД сидом:
```bash
npm run prisma:seed
```

6. Запустить backend (в `server/`):
```bash
npm run dev
```

7. В корне проекта запустить frontend:
```bash
npm run dev
```

---

## Полезные команды

### Frontend (корень)
```bash
npm run dev
npm run build
npm run start
```

### Backend (`server/`)
```bash
npm run dev
npm run build
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

### Быстрые проверки API
Health:
```bash
curl http://localhost:54001/api/health
```

Login:
```bash
curl -X POST http://localhost:54001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```

---

## Оплата YooKassa

Используется redirect-сценарий:
1. Backend создаёт заказ
2. Backend создаёт платёж в YooKassa
3. Пользователь уходит на страницу оплаты YooKassa
4. После оплаты возвращается на страницу успеха
5. Webhook обновляет статус оплаты/заказа

Для работы нужны `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY`.

---

## Роли и доступ

Основные роли:
- `CLIENT`
- `OPERATOR`
- `MANAGER`
- `ADMIN`

Доступ к админским разделам ограничен middleware авторизации и ролей.

---

## Примечания

- Товары с нулевым остатком сохраняются в БД и отображаются как «Нет в наличии».
- Остатки уменьшаются при оформлении заказа.
- Для актуализации backend-кода в Docker используйте пересборку контейнера, а не только restart.
