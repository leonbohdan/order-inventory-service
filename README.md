# Transactional Order & Inventory Service

An educational microservice project designed to explore and demonstrate transactional workflows, modular NestJS architecture, Dependency Injection (DI), and containerized database management.

---

## 📌 Project Overview

The **Order & Inventory Service** simulates a real-world e-commerce backend flow where orders depend on stock availability. The primary focus of this project is mastering:
- **Clean Architecture & Modular Design** with NestJS.
- **Dependency Injection (DI) & Inversion of Control (IoC)** across separate domain modules.
- **Transactional State Management** and atomic stock reservation.
- **Dockerized Infrastructure** using PostgreSQL and pgAdmin with healthchecks and isolated networks.

---

## 🛠 Tech Stack

- **Runtime & Language:** Node.js, TypeScript
- **Backend Framework:** [NestJS](https://nestjs.com/)
- **Database:** [PostgreSQL 17 / 16](https://www.postgresql.org/) (Alpine)
- **Database Management:** [pgAdmin 4](https://www.pgadmin.org/)
- **DevOps & Containerization:** Docker, Docker Compose

---

## 🏗 Architecture & Core Modules

The application is structured into decoupled domain modules:

```
order-inventory-service/
├── .agents/                # Agent configurations & guidelines
├── docs/                   # Educational tasks & theoretical interview answers
│   ├── task.md             # Project requirements & tasks
│   └── interview_answers.md# Detailed answers for self-check & interview prep
├── server/                 # NestJS application core (order-service)
│   ├── src/
│   │   ├── inventory/      # Inventory module (stock management, reservation logic)
│   │   ├── orders/         # Orders module (order creation, checkout orchestration)
│   │   ├── app.module.ts   # Root application module
│   │   └── main.ts         # Application entry point
├── docker-compose.yml      # Containerized PostgreSQL & pgAdmin services
├── .env.example            # Environment variable template
└── README.md
```

### Key Modules:
- **`InventoryModule`**: Manages product items, stock availability checks (`checkAvailability`), and inventory reservation (`reserve`). Exports its service for external module consumption.
- **`OrdersModule`**: Handles order lifecycle and orchestrates calls to `InventoryService` via NestJS Dependency Injection.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18+ or v20+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) / [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

### 1. Environment Setup

Create a `.env` file based on the template:

```bash
cp .env.example .env
```

Configure your environment variables:
```env
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=order_inventory_db
POSTGRES_PORT=5433

# pgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=admin
PGADMIN_PORT=8080
```

### 2. Run Database Infrastructure

Start PostgreSQL and pgAdmin using Docker Compose:

```bash
docker compose up -d
```

- **PostgreSQL**: Accessible on `localhost:5433` (or configured `POSTGRES_PORT`)
- **pgAdmin**: Accessible on [http://localhost:8080](http://localhost:8080)

### 3. Run the NestJS Application

Navigate to the `server` directory, install dependencies, and run in development mode:

```bash
cd server
npm install
npm run start:dev
```

The API will be available at `http://localhost:3000`.

---

## 🗺 Implementation Roadmap

- [x] **Phase 1: Infrastructure**
  - [x] Configure `docker-compose.yml` with `postgres_db` and `pgadmin` services.
  - [x] Set up isolated Docker network (`order_network`) and persistence volumes.
  - [x] Configure PostgreSQL healthcheck with `pg_isready`.

- [x] **Phase 2: NestJS Core & Dependency Injection**
  - [x] Initialize `server` (order-service) project via `@nestjs/cli`.
  - [x] Implement `InventoryModule` with in-memory stock availability & reservation.
  - [x] Implement `OrdersModule` and inject `InventoryService` across modules.

- [ ] **Phase 3: Persistence & Transactions (Upcoming)**
  - [ ] Integrate TypeORM or Prisma ORM.
  - [ ] Implement ACID database transactions for simultaneous order creation and stock deduction.

---

## 📝 Learning Objectives & Self-Check

As part of this educational project, review the detailed answers in [docs/interview_answers.md](docs/interview_answers.md):
1. Differences between `Record<K, T>` and index signatures (`{[key: string]: T}`) in TypeScript.
2. How TypeScript utility types (`Partial`, `Pick`, `Omit`, `Required`) operate under the hood with generics.
3. How Inversion of Control (IoC) and Dependency Injection (DI) are resolved by the NestJS IoC container.
4. Why Docker healthchecks (`healthcheck` + `condition: service_healthy`) are crucial for microservice startup order.
