# 🛒 Transactional Order & Inventory Service

Microservice e-commerce backend project built with **NestJS**, **Prisma ORM 7**, and **PostgreSQL 17** in **Docker**.  
This project was created to explore modern software development practices: from infrastructure containerization and modular clean architecture to complex relational modeling, migrations, SQL query optimization with indexes, and transactional data integrity.

---

## 🛠 Technology Stack

* **Runtime & Language:** Node.js (v24+), TypeScript (ESM, `"type": "module"`)
* **Backend Framework:** [NestJS 12](https://nestjs.com/)
* **Database:** [PostgreSQL 17](https://www.postgresql.org/) (Alpine in Docker)
* **ORM & Migrations:** [Prisma ORM 7](https://www.prisma.io/) (Rust-free architecture, `@prisma/adapter-pg` driver adapter, `pg` connection pool)
* **Validation & DTO:** `class-validator`, `class-transformer`
* **Infrastructure:** Docker, Docker Compose, pgAdmin 4
* **Code Quality & Tooling:** `oxlint` (ultrafast linter), `vitest` (unit & e2e testing), `prettier`

---

## 🏗 Project Structure

```
order-inventory-service/
├── docs/                           # Learning tasks, summary reports, and deep-dive documentation
│   ├── task.day_1.md               # Day 1: Docker + NestJS Core + DI
│   ├── summary.day_1.md            # Day 1 Summary & Guide
│   ├── task.day_2.md               # Day 2: Pipes, Guards, Interceptors, Decorators
│   ├── summary.day_2.md            # Day 2 Summary & Guide
│   ├── task.day_3.md               # Day 3: Relations 1:1, 1:N, N:M, Prisma 7, Seeding
│   ├── summary.day_3.md            # Day 3 Summary & Guide
│   ├── task.day_4.md               # Day 4: SQL Indexing, EXPLAIN ANALYZE, Optimization
│   └── summary.day_4.md            # Day 4 Summary & Guide
├── server/                         # Backend Core Application (NestJS)
│   ├── prisma/
│   │   ├── migrations/             # Versioned SQL migration files
│   │   ├── schema.prisma           # Declarative Prisma schema & models
│   │   └── seed.ts                 # Database seeder (10 users, 50 products, orders)
│   ├── prisma7.config.ts           # Prisma 7 configuration (driver adapters, paths, seed, DB URL)
│   ├── src/
│   │   ├── auth/                   # Role-Based Access Control (RolesGuard, @Roles decorator)
│   │   ├── common/                 # Interceptors (Logging, Transform) & @CurrentUser decorator
│   │   ├── inventory/              # Inventory module (products, stock reservation)
│   │   ├── orders/                 # Orders module (DTOs, validation, checkout)
│   │   ├── app.module.ts           # Root application module
│   │   └── main.ts                 # Application entry point, global pipes & interceptors
│   └── package.json
├── docker-compose.yml              # PostgreSQL 17 and pgAdmin 4 container orchestration
├── .env.example                    # Environment variables template
└── README.md
```

---

## 🗺️ 5-Day Development Roadmap

- [x] **Day 1: Docker Environment, NestJS Architecture, and Dependency Injection**
  - [x] Provisioned `postgres_db` (port 5433) and `pgadmin` (port 8080) via `docker-compose.yml`.
  - [x] Configured container `healthcheck` (`pg_isready`) and custom bridge network `order_network`.
  - [x] Initialized NestJS project with native ESM support.
  - [x] Implemented domain module `InventoryModule` and exported `InventoryService`.
  - [x] Implemented domain module `OrdersModule` with cross-module Dependency Injection.
  - [x] *Summary:* [docs/summary.day_1.md](docs/summary.day_1.md).

- [x] **Day 2: Pipes, Guards, Interceptors, and Custom Decorators**
  - [x] Input DTOs (`CreateOrderDto`, `OrderItemDto`) with nested array validation (`class-validator`).
  - [x] Configured global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).
  - [x] Role-Based Access Control (RBAC) via `RolesGuard` and `@Roles()` decorator metadata.
  - [x] Aspect-Oriented Interceptors: `LoggingInterceptor` (request execution time) and `TransformInterceptor` (standard `{ success, data, timestamp }` envelope).
  - [x] Custom controller parameter decorator `@CurrentUser()`.
  - [x] *Summary:* [docs/summary.day_2.md](docs/summary.day_2.md).

- [x] **Day 3: Relational Databases, Cardinality (1:1, 1:N, N:M), Prisma 7, and Seeding**
  - [x] Relational modeling in `schema.prisma`:
    - `1:1`: `User` $\leftrightarrow$ `Profile` (with `onDelete: Cascade` and `@unique`).
    - `1:N`: `User` $\leftrightarrow$ `Order` and `Order` $\leftrightarrow$ `OrderItem`.
    - `N:M`: `Product` $\leftrightarrow$ `Category` (implicit Many-to-Many via auto-generated `_CategoryToProduct`).
    - `OrderItem` model as an explicit join entity freezing historical pricing: `unitPrice Decimal(10, 2)`.
  - [x] Configured new Prisma 7 architecture with driver adapter `@prisma/adapter-pg` and `prisma7.config.ts`.
  - [x] Generated initial SQL migration (`npx prisma migrate dev --name init`).
  - [x] Implemented `seed.ts`: populated database with 6 categories, 10 users with profiles, 50 products, and orders.
  - [x] Repository hygiene: configured `.gitignore` for generated client and `"postinstall": "prisma generate"` hook.
  - [x] *Summary:* [docs/summary.day_3.md](docs/summary.day_3.md).

- [x] **Day 4: SQL Indexing, Query Optimization, and EXPLAIN ANALYZE**
  - [x] Algorithmic warm-up: in-memory binary search and index lookup ($O(N)$ vs $O(\log K)$ vs $O(1)$).
  - [x] Mass data generation: 200,000+ orders inserted into PostgreSQL.
  - [x] Execution plan profiling with `EXPLAIN (ANALYZE, BUFFERS)`: comparing `Seq Scan`, `Index Scan`, and `Bitmap Index Scan`.
  - [x] Designed composite B-Tree index `(status, createdAt)` and verified the Leftmost Prefix Rule.
  - [x] Explored query planner selectivity and cost-based optimization (CBO Tipping Point).
  - [x] Created partial index (`Partial Index` with `WHERE status = 'PENDING'`) via custom Prisma migration (`--create-only`), saving 83% disk space.
  - [x] *Summary:* [docs/summary.day_4.md](docs/summary.day_4.md).

- [ ] **Day 5: Transactional Integrity, Isolation Levels (ACID), and Service Integration** *(Planned)*
  - [ ] Connect `PrismaService` to `InventoryService` and `OrdersService` (replacing in-memory storage).
  - [ ] Atomic stock reservation and order creation wrapped inside `prisma.$transaction`.
  - [ ] PostgreSQL transaction isolation levels (Read Committed, Repeatable Read, Serializable).
  - [ ] Concurrency and locking: Optimistic vs Pessimistic locks (`SELECT FOR UPDATE`).
  - [ ] End-to-end API testing (Postman / Vitest E2E) under concurrent load (Race Conditions).

---

## 🚀 Getting Started

### 1. Prerequisites
* Installed **Node.js** (v20+ or v24+) and **Docker** with **Docker Compose**.

### 2. Environment Variables Configuration
Create a `.env` file in the project root (if not already present):
```bash
cp .env.example .env
```
Ensure `.env` contains valid database connection parameters:
```env
PORT=3000
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=123123
POSTGRES_DB=order_inventory_db

DATABASE_URL="postgresql://postgres:123123@localhost:5433/order_inventory_db?schema=public"
```

### 3. Start Database Containers
```bash
docker compose up -d
```
* **PostgreSQL:** available at `localhost:5433`.
* **pgAdmin 4:** accessible in browser at `http://localhost:8080` (login: `admin@admin.com`, password: `admin`).

### 4. Install Dependencies & Generate Prisma Client
Navigate to the `server/` directory:
```bash
cd server
npm install
```
*(The `postinstall` lifecycle hook will automatically generate the Prisma Client).*

### 5. Apply Migrations & Seed Database
```bash
# Apply migrations to PostgreSQL
npx prisma migrate dev

# Seed database (6 categories, 10 users, 50 products, sample orders)
npm run seed
```

### 6. Run the Backend Server
```bash
npm run start:dev
```
The server will start at `http://localhost:3000`.

### 7. Explore Data with Prisma Studio (Optional)
To visually inspect all products, categories, users, and orders in the browser:
```bash
npx prisma studio
```
The interface will open at `http://localhost:5555`.

---

## 🧪 Testing & Code Quality

All commands should be executed from within the `server/` directory:

```bash
# Static code analysis (ultrafast oxlint)
npm run lint

# Run unit tests
npm run test

# Run end-to-end (E2E) tests
npm run test:e2e

# Generate test coverage report
npm run test:cov
```
