# ⚙️ Order & Inventory Service — Backend Core (NestJS)

This directory contains the source code for the core microservice built with **NestJS 12**, **Prisma ORM 7**, and **TypeScript (native ESM)**.

---

## 📂 Directory Structure

```
server/
├── prisma/
│   ├── migrations/             # Versioned SQL database migrations
│   ├── schema.prisma           # Declarative Prisma schema & entities
│   └── seed.ts                 # Database seeding script (10 users, 50 products)
├── prisma7.config.ts           # Prisma 7 configuration (driver adapters, .env path)
├── src/
│   ├── auth/                   # Role-Based Access Control (RBAC)
│   │   ├── decorators/         # @Roles('ADMIN', 'CUSTOMER')
│   │   └── guards/             # RolesGuard (inspects x-user-role header)
│   ├── common/                 # Cross-cutting concerns
│   │   ├── decorators/         # @CurrentUser('id')
│   │   └── interceptors/       # LoggingInterceptor, TransformInterceptor
│   ├── inventory/              # Inventory module (InventoryModule, Service, Controller)
│   ├── orders/                 # Orders module (OrdersModule, Service, Controller, DTOs)
│   ├── app.module.ts           # Root NestJS module
│   └── main.ts                 # Application entry point, global pipes & interceptors
├── test/                       # E2E test configuration and test suites
├── package.json
└── tsconfig.json
```

---

## 🚀 Available npm Scripts

| Command | Description |
| :--- | :--- |
| `npm run start:dev` | Starts the server in development mode with hot-reload (`--watch`). |
| `npm run start` | Runs the compiled NestJS application in production mode. |
| `npm run build` | Compiles the TypeScript project into the `dist/` folder. |
| `npm run seed` | Runs the [prisma/seed.ts](prisma/seed.ts) script via Prisma CLI (`prisma db seed`). |
| `npm run lint` | Performs static code analysis using the ultrafast `oxlint` linter. |
| `npm run format` | Automatically formats code using `prettier`. |
| `npm run test` | Runs unit tests using `vitest`. |
| `npm run test:watch`| Runs tests in interactive watch mode. |
| `npm run test:e2e` | Executes end-to-end (E2E) API test suites. |
| `npm run test:cov` | Generates a test code coverage report. |

---

## 🗄️ Database Management with Prisma 7 CLI

This project leverages the modern **Prisma 7** architecture (Rust-free, JavaScript runtime) paired with the `@prisma/adapter-pg` driver adapter.

* **Apply or generate new migrations:**
  ```bash
  npx prisma migrate dev --name <migration_name>
  ```
* **Check migration status against the database:**
  ```bash
  npx prisma migrate status
  ```
* **Create an empty migration for custom native SQL (e.g., Partial Indexes):**
  ```bash
  npx prisma migrate dev --create-only --name <migration_name>
  ```
* **Generate Prisma Client to `src/generated/prisma`:**
  ```bash
  npx prisma generate
  ```
  *(Runs automatically after `npm install` via the `postinstall` hook).*
* **Visual database web client (Prisma Studio):**
  ```bash
  npx prisma studio
  ```
  *Opens visual database management UI at `http://localhost:5555`.*

---

## 🛡️ Headers for API Testing (Postman / cURL)

When testing protected order creation endpoints, use the following custom headers:

* **`x-user-role`**: User role (`ADMIN`, `CUSTOMER`, `MANAGER`).  
  *If the header is missing or does not match `@Roles()`, the request returns `403 Forbidden`.*
* **`x-user-id`**: User ID (extracted in controllers via the `@CurrentUser('id')` decorator).

---

## 🔄 Standardized API Response Format

All successful HTTP responses are automatically wrapped by the [TransformInterceptor](src/common/interceptors/transform.interceptor.ts) into a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-09-05T12:00:00.000Z"
}
```

Request duration is automatically measured and logged to the server console by the [LoggingInterceptor](src/common/interceptors/logging.interceptor.ts) (e.g., `[POST] /orders - 8ms`).
