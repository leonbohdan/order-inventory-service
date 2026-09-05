# ⚙️ Order & Inventory Service — Backend Core (NestJS)

Цей каталог містить вихідний код основного мікросервісу на базі **NestJS 12**, **Prisma ORM 7** та **TypeScript (ESM)**.

---

## 📂 Структура каталогів

```
server/
├── prisma/
│   ├── migrations/             # Версіоновані SQL-міграції бази даних
│   ├── schema.prisma           # Декларативна схема сутностей та реляцій
│   └── seed.ts                 # Скрипт початкового наповнення (10 юзерів, 50 товарів)
├── prisma7.config.ts           # Конфігурація Prisma 7 (Driver Adapters, шлях до .env)
├── src/
│   ├── auth/                   # Авторизація за ролями (RBAC)
│   │   ├── decorators/         # @Roles('ADMIN', 'CUSTOMER')
│   │   └── guards/             # RolesGuard (перевірка заголовка x-user-role)
│   ├── common/                 # Наскрізна функціональність
│   │   ├── decorators/         # @CurrentUser('id')
│   │   └── interceptors/       # LoggingInterceptor, TransformInterceptor
│   ├── inventory/              # Модуль складу (InventoryModule, Service, Controller)
│   ├── orders/                 # Модуль замовлень (OrdersModule, Service, Controller, DTO)
│   ├── app.module.ts           # Кореневий модуль NestJS
│   └── main.ts                 # Ініціалізація додатку, глобальні Pipes та Interceptors
├── test/                       # Конфігурація та файли e2e тестів
├── package.json
└── tsconfig.json
```

---

## 🚀 Доступні npm-скрипти

| Команда | Призначення |
| :--- | :--- |
| `npm run start:dev` | Запуск сервера у режимі розробки з гарячим перезавантаженням (`--watch`). |
| `npm run start` | Звичайний запуск компільованого NestJS додатку. |
| `npm run build` | Компіляція TypeScript-проєкту в папку `dist/`. |
| `npm run seed` | Запуск скрипта [prisma/seed.ts](prisma/seed.ts) через Prisma CLI (`prisma db seed`). |
| `npm run lint` | Статичний аналіз коду за допомогою утиліти `oxlint`. |
| `npm run format` | Автоматичне форматування коду за допомогою `prettier`. |
| `npm run test` | Запуск юніт-тестів через `vitest`. |
| `npm run test:watch`| Запуск тестів в інтерактивному watch-режимі. |
| `npm run test:e2e` | Запуск наскрізних (end-to-end) тестів API. |
| `npm run test:cov` | Генерація звіту про покриття коду тестами (Coverage). |

---

## 🗄️ Робота з базою даних через Prisma 7 CLI

У проєкті використовується оновлена архітектура **Prisma 7** без монолітного Rust-рушія з драйвером `@prisma/adapter-pg`.

* **Застосування або генерація нових міграцій:**
  ```bash
  npx prisma migrate dev --name <migration_name>
  ```
* **Перевірка статусу міграцій у базі даних:**
  ```bash
  npx prisma migrate status
  ```
* **Генерація клієнта Prisma Client у `src/generated/prisma`:**
  ```bash
  npx prisma generate
  ```
  *(Виконується автоматично після `npm install` завдяки хуку `postinstall`).*
* **Візуальний веб-інтерфейс бази даних (Prisma Studio):**
  ```bash
  npx prisma studio
  ```
  *Відкриває веб-адмінку на `http://localhost:5555`.*

---

## 🛡️ Заголовки для тестування API в Postman / cURL

Для тестування захищених ендпоінтів створення замовлень використовуйте наступні кастомні заголовки:

* **`x-user-role`**: Роль користувача (`ADMIN`, `CUSTOMER`, `MANAGER`).  
  *Якщо заголовок відсутній або роль не відповідає `@Roles()`, повертається `403 Forbidden`.*
* **`x-user-id`**: Ідентифікатор користувача (витягується в контролері через `@CurrentUser('id')`).

---

## 🔄 Стандартизований формат відповіді API

Усі успішні HTTP-відповіді автоматично загортаються інтерцептором [TransformInterceptor](src/common/interceptors/transform.interceptor.ts) у формат:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-09-05T12:00:00.000Z"
}
```

А час виконання запитів автоматично логується [LoggingInterceptor](src/common/interceptors/logging.interceptor.ts) у консоль сервера (`[POST] /orders - 8ms`).
