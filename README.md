# 🛒 Transactional Order & Inventory Service

Навчальний мікросервісний проєкт e-commerce бекенду на базі **NestJS**, **Prisma ORM 7** та **PostgreSQL 17** у **Docker**.  
Проєкт створено для вивчення повної картини сучасної розробки: від контейнеризації інфраструктури та чистої модульної архітектури до складного реляційного моделювання, міграцій, оптимізації SQL-запитів через індекси та транзакційної цілісності даних.

---

## 🛠 Технологічний стек

* **Runtime & Мова:** Node.js (v24+), TypeScript (ESM, `"type": "module"`)
* **Бекенд-фреймворк:** [NestJS 12](https://nestjs.com/)
* **База даних:** [PostgreSQL 17](https://www.postgresql.org/) (Alpine у Docker)
* **ORM & Міграції:** [Prisma ORM 7](https://www.prisma.io/) (нова Rust-free архітектура, Driver Adapter `@prisma/adapter-pg`, пул з'єднань `pg`)
* **Валідація та DTO:** `class-validator`, `class-transformer`
* **Інфраструктура:** Docker, Docker Compose, pgAdmin 4
* **Інструменти якості коду:** `oxlint` (надшвидкий лінтер), `vitest` (юніт та e2e тести), `prettier`

---

## 🏗 Структура проєкту

```
order-inventory-service/
├── docs/                           # Навчальні завдання, підсумкові звіти та теорія
│   ├── task.day_1.md               # День 1: Docker + NestJS Core + DI
│   ├── summary.day_1.md            # Звіт та конспект за День 1
│   ├── task.day_2.md               # День 2: Pipes, Guards, Interceptors, Decorators
│   ├── summary.day_2.md            # Звіт та конспект за День 2
│   ├── task.day_3.md               # День 3: Реляції 1:1, 1:N, N:M, Prisma 7, Seeding
│   ├── summary.day_3.md            # Звіт та конспект за День 3
│   └── task.day_4.md               # День 4: Індексація, EXPLAIN ANALYZE, оптимізація
├── server/                         # Ядро бекенд-додатку (NestJS)
│   ├── prisma/
│   │   ├── migrations/             # SQL-файли міграцій бази даних
│   │   ├── schema.prisma           # Декларативна схема моделей та зв'язків
│   │   └── seed.ts                 # Скрипт наповнення (10 юзерів, 50 товарів, замовлення)
│   ├── prisma7.config.ts           # Конфігурація Prisma 7 (шляхи, міграції, seed, DB URL)
│   ├── src/
│   │   ├── auth/                   # RBAC авторизація (RolesGuard, декоратор @Roles)
│   │   ├── common/                 # Інтерцептори (Logging, Transform) та декоратор @CurrentUser
│   │   ├── inventory/              # Модуль складу (товари, резервування, залишки)
│   │   ├── orders/                 # Модуль замовлень (DTO, валідація, оформлення)
│   │   ├── app.module.ts           # Головний модуль додатку
│   │   └── main.ts                 # Точка входу, глобальні Pipes та Interceptors
│   └── package.json
├── docker-compose.yml              # Контейнеризація PostgreSQL 17 та pgAdmin 4
├── .env.example                    # Шаблон змінних оточення
└── README.md
```

---

## 🗺️ 5-денний план розвитку (Roadmap)

- [x] **День 1: Docker-середовище, Архітектура NestJS та Dependency Injection**
  - [x] Розгортання `postgres_db` (порт 5433) та `pgadmin` (порт 8080) у `docker-compose.yml`.
  - [x] Налаштування `healthcheck` (`pg_isready`) та кастомної bridge-мережі `order_network`.
  - [x] Ініціалізація проєкту NestJS з підтримкою ESM.
  - [x] Доменний модуль `InventoryModule` та експорт `InventoryService`.
  - [x] Доменний модуль `OrdersModule` та впровадження залежностей через NestJS DI.
  - [x] *Звіт:* [docs/summary.day_1.md](docs/summary.day_1.md).

- [x] **День 2: Pipes, Guards, Interceptors та кастомні декоратори**
  - [x] Вхідні DTO (`CreateOrderDto`, `OrderItemDto`) з валідацією вкладених масивів (`class-validator`).
  - [x] Підключення глобального `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).
  - [x] Рольова авторизація (RBAC) через `RolesGuard` та метадані декоратора `@Roles()`.
  - [x] Аспектно-орієнтовані інтерцептори: `LoggingInterceptor` (вимірювання часу запиту) та `TransformInterceptor` (єдиний формат `{ success, data, timestamp }`).
  - [x] Кастомний декоратор параметра контролера `@CurrentUser()`.
  - [x] *Звіт:* [docs/summary.day_2.md](docs/summary.day_2.md).

- [x] **День 3: Реляційні бази даних, зв'язки (1:1, 1:N, N:M), Prisma 7 та Seeding**
  - [x] Проєктування реляційної схеми в `schema.prisma`:
    - `1:1`: `User` $\leftrightarrow$ `Profile` (із каскадним видаленням `onDelete: Cascade` та `@unique`).
    - `1:N`: `User` $\leftrightarrow$ `Order` та `Order` $\leftrightarrow$ `OrderItem`.
    - `N:M`: `Product` $\leftrightarrow$ `Category` (implicit Many-to-Many з автоматичною таблицею `_CategoryToProduct`).
    - Модель `OrderItem` як явна Join-таблиця з фіксацією історичної ціни `unitPrice Decimal(10, 2)`.
  - [x] Налаштування нової архітектури Prisma 7 з драйвер-адаптером `@prisma/adapter-pg` і конфігом `prisma7.config.ts`.
  - [x] Генерація початкової SQL-міграції (`npx prisma migrate dev --name init`).
  - [x] Скрипт `seed.ts` для наповнення бази: 6 категорій, 10 користувачів із профілями, 50 товарів, тестові замовлення.
  - [x] Чистота репозиторію: налаштування `.gitignore` для згенерованого клієнта та хук `"postinstall": "prisma generate"`.
  - [x] *Звіт:* [docs/summary.day_3.md](docs/summary.day_3.md).

- [ ] **День 4: Індексація в SQL, оптимізація запитів та EXPLAIN ANALYZE** *(У процесі)*
  - [ ] Алгоритмічний розігрів: бінарний пошук та індексований кеш у пам'яті ($O(N)$ vs $O(\log N)$ vs $O(1)$).
  - [ ] Масова генерація 200,000+ замовлень у PostgreSQL.
  - [ ] Дослідження планів виконання через `EXPLAIN (ANALYZE, BUFFERS)`: різниця між `Seq Scan`, `Index Scan` та `Bitmap Index Scan`.
  - [ ] Створення складених (Composite) індексів та перевірка правила лівого префікса (Leftmost Prefix Rule).
  - [ ] Проєктування часткових індексів (Partial Index) для оптимізації черг замовлень (`WHERE status = 'PENDING'`).
  - [ ] *Завдання:* [docs/task.day_4.md](docs/task.day_4.md).

- [ ] **День 5: Транзакційна надійність, рівні ізоляції (ACID) та інтеграція сервісів** *(Заплановано)*
  - [ ] Підключення `PrismaService` до `InventoryService` та `OrdersService` (відмова від in-memory масивів).
  - [ ] Атомарне списання залишків та створення замовлення через `prisma.$transaction`.
  - [ ] Дослідження рівнів ізоляції транзакцій PostgreSQL (Read Committed, Repeatable Read, Serializable).
  - [ ] Конкурентний доступ та блокування: оптимістичні (Optimistic) та песимістичні (Pessimistic) блокування (`SELECT FOR UPDATE`).
  - [ ] Наскрізне тестування API (Postman / Vitest E2E) в умовах паралельних запитів (Race Conditions).

---

## 🚀 Швидкий старт (Getting Started)

### 1. Передумови
* Встановлені **Node.js** (v20+ або v24+) та **Docker** з **Docker Compose**.

### 2. Налаштування змінних оточення
Створи файл `.env` у корені проєкту (якщо ще не створено):
```bash
cp .env.example .env
```
Переконайся, що в `.env` налаштовано рядок підключення до БД:
```env
PORT=3000
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=123123
POSTGRES_DB=order_inventory_db

DATABASE_URL="postgresql://postgres:123123@localhost:5433/order_inventory_db?schema=public"
```

### 3. Запуск контейнерів бази даних
```bash
docker compose up -d
```
* **PostgreSQL:** доступний на порту `localhost:5433`.
* **pgAdmin 4:** доступний у браузері на `http://localhost:8080` (логін: `admin@admin.com`, пароль: `admin`).

### 4. Встановлення залежностей та генерація Prisma Client
Перейди до папки бекенду:
```bash
cd server
npm install
```
*(Завдяки хуку `postinstall`, Prisma Client згенерується автоматично).*

### 5. Накатка міграцій та наповнення тестовими даними
```bash
# Застосування міграцій до PostgreSQL
npx prisma migrate dev

# Наповнення бази (6 категорій, 10 користувачів, 50 товарів, замовлення)
npm run seed
```

### 6. Запуск бекенд-сервера
```bash
npm run start:dev
```
Сервер запуститься на `http://localhost:3000`.

### 7. Перегляд бази через Prisma Studio (Опціонально)
Для зручного візуального перегляду всіх 50 товарів, зв'язків та замовлень у браузері:
```bash
npx prisma studio
```
Інтерфейс відкриється за адресою `http://localhost:5555`.

---

## 🧪 Тестування та перевірка якості коду

Усі команди виконуються всередині каталогу `server/`:

```bash
# Статичний аналіз коду (надшвидкий linter)
npm run lint

# Запуск юніт-тестів
npm run test

# Запуск e2e тестів
npm run test:e2e

# Перевірка тестового покриття
npm run test:cov
```
