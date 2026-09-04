# 📋 Підсумки роботи: Day 1 — Docker-середовище, Архітектура NestJS та Dependency Injection

Цей документ містить повний звіт про виконану роботу в рамках **Day 1**, детальний аналіз архітектурних рішень, пояснення технологій («що, як, для чого і чому») та відповіді на концептуальні питання щодо **TypeScript, Docker і NestJS IoC/DI**.

---

## 📑 Зміст
1. [Огляд завдань](#-огляд-завдань)
2. [Блок 1: Docker-середовище бази даних (PostgreSQL & pgAdmin)](#-блок-1-docker-середовище-бази-даних)
3. [Блок 2: Ініціалізація ядра NestJS та модульна архітектура](#-блок-2-ініціалізація-ядра-nestjs-та-модульна-архітектура)
4. [Блок 3: Реалізація доменного модуля Inventory (In-Memory склад)](#-блок-3-реалізація-доменного-модуля-inventory)
5. [Блок 4: Модуль Orders та Dependency Injection (DI)](#-блок-4-модуль-orders-та-dependency-injection-di)
6. [🎯 Відповіді на питання для самоперевірки та інтерв'ю](#-відповіді-на-питання-для-самоперевірки-та-інтервю)

---

## 🎯 Огляд завдань

Головна мета Day 1 — закласти надійний фундамент для бекенд-сервісу замовлень та складу:
* **Ізоляція інфраструктури:** підготовка контейнеризованого середовища для реляційної бази даних PostgreSQL та веб-інтерфейсу керування pgAdmin через Docker Compose.
* **Каркас бекенду:** ініціалізація проєкту NestJS з підтримкою TypeScript ESM.
* **Модульність та Inversion of Control (IoC):** проектування незалежних модулів `Inventory` та `Orders` і зв'язування їх через механізм Dependency Injection.

---

## 🐳 Блок 1: Docker-середовище бази даних

### Що було зроблено:
1. Створено файл конфігурації [docker-compose.yml](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/docker-compose.yml).
2. Налаштовано сервіс **`postgres_db`**:
   - Використано образ `postgres:17-alpine`.
   - Змінні середовища (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) винесено у `.env`.
   - Прокинуто порт `5432:5432`.
   - Підключено persistent volume `postgres_data` для збереження даних між перезапусками контейнерів.
   - Налаштовано `healthcheck` за допомогою утиліти `pg_isready`.
3. Налаштовано сервіс **`pgadmin`**:
   - Образ `dpage/pgadmin4`.
   - Прокинуто порт `8080:80`.
   - Встановлено залежність від готовності бази (`depends_on` з умовою `service_healthy`).
4. Об'єднано сервіси у спільну ізольовану bridge-мережу `order_network`.

### Як це працює:
```yaml
services:
  postgres_db:
    image: postgres:17-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4
    depends_on:
      postgres_db:
        condition: service_healthy
```

### Для чого і чому:
* **Ізоляція:** розробникам не потрібно встановлювати PostgreSQL та pgAdmin локально на хост-машину, що усуває конфлікти версій («працює на моєму комп'ютері»).
* **Persistent Volumes:** без підключення `volume` усі таблиці та записи видалялися б при кожному `docker compose down`. Volume монтує каталог хоста до каталогу всередині контейнера (`/var/lib/postgresql/data`).
* **Healthcheck замість звичайного `depends_on`:** стандартний `depends_on` чекає лише факту *старту процесу контейнера*, але не готовності Postgres приймати TCP-з'єднання. `condition: service_healthy` гарантує, що залежні сервіси почнуть роботу лише тоді, коли сокет БД дійсно готовий до запитів.

---

## ⚙️ Блок 2: Ініціалізація ядра NestJS та модульна архітектура

### Що було зроблено:
1. Створено новий проєкт NestJS у папці `server/` з конфігурацією ECMAScript Modules (`"type": "module"` у `package.json`).
2. Налаштовано систему скриптів компіляції та запуску:
   - `npm run start:dev` (режим розробки з гарячим перезапуском `--watch`).
   - `oxlint` для швидкого статичного аналізу коду.
   - `vitest` для юніт-тестування.
3. Організовано модульну структуру додатку у кореневому модулі [AppModule](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/app.module.ts).

### Для чого і чому:
* **ESM (`"type": "module"`):** сучасний стандарт JavaScript. Усі внутрішні відносні імпорти TypeScript використовують явне розширення `.js` (наприклад, `import { ... } from './inventory.service.js'`), що забезпечує нативну сумісність з Node.js без додаткових хаків бандлерів.

---

## 📦 Блок 3: Реалізація доменного модуля Inventory

### Що було зроблено:
1. Створено доменний модуль [InventoryModule](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/inventory/inventory.module.ts), контролер [InventoryController](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/inventory/inventory.controller.ts) та сервіс [InventoryService](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/inventory/inventory.service.ts).
2. Описано інтерфейс товару [Product](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/inventory/interfaces/product.interface.ts):
   ```typescript
   export interface Product {
     id: string;
     name: string;
     quantity: number;
     price: number;
   }
   ```
3. У [InventoryService](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/inventory/inventory.service.ts) реалізовано in-memory сховище товарів та методи:
   - `getProducts(): Product[]` — отримання списку доступних товарів.
   - `checkAvailability(productId: string, quantity: number): boolean` — перевірка, чи є товар у достатній кількості на складі (без списання).
   - `reserve(productId: string, quantity: number): boolean` — фактичне списання залишку зі складу.
4. **Експорт сервісу:** у `inventory.module.ts` сервіс `InventoryService` додано у секцію `exports: [InventoryService]`.

### Для чого і чому:
* **Інкапсуляція:** модуль `Inventory` є єдиним власником знань про товари та складські залишки. Жоден інший модуль не має права напряму мутувати масив `products`.
* **Секція `exports`:** за замовчуванням усі провайдери в NestJS є приватними (локальними для свого модуля). Щоб надати доступ до `InventoryService` іншим модулям додатку, його обов'язково потрібно явно експортувати.

---

## 🛒 Блок 4: Модуль Orders та Dependency Injection (DI)

### Що було зроблено:
1. Створено модуль [OrdersModule](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/orders/orders.module.ts), контролер [OrdersController](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/orders/orders.controller.ts) та сервіс [OrdersService](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/orders/orders.service.ts).
2. Імпортовано `InventoryModule` у секцію `imports` файлу `orders.module.ts`:
   ```typescript
   @Module({
     imports: [InventoryModule],
     controllers: [OrdersController],
     providers: [OrdersService],
   })
   export class OrdersModule {}
   ```
3. Заінжекчено `InventoryService` через конструктор [OrdersService](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/orders/orders.service.ts):
   ```typescript
   @Injectable()
   export class OrdersService {
     constructor(private readonly inventoryService: InventoryService) {}
     // ...
   }
   ```
4. Реалізовано створення замовлення зі статусом `ORDER_STATUS.PENDING` та перевіркою наявності товарів на складі.

### Для чого і чому:
* **Слабке зв'язування (Loose Coupling):** `OrdersService` не створює екземпляр `new InventoryService()` власноруч. Він делегує створення залежностей IoC-контейнеру NestJS. Це дозволяє легко замінити реальний сервіс на mock-об'єкт під час тестування.

---

## 🎯 Відповіді на питання для самоперевірки та інтерв'ю

### 1. Чим `Record<K, T>` відрізняється від index signature `{[key: string]: T}`?

* **Index signature `{[key: string]: T}`:**
  - Дозволяє ключам бути практично будь-якими рядками (відкритий набір ключів).
  - Не підтримує об'єднання літеральних типів як ключі (наприклад, не можна написати `{[key: 'ADMIN' | 'USER']: T}`).
* **`Record<K, T>`:**
  - Це вбудований utility-тип: `type Record<K extends keyof any, T> = { [P in K]: T; }`.
  - Дозволяє явно обмежити множину ключів `K` конкретним union-типом (наприклад, `Record<Role, Permission[]>`).
  - Гарантує вичерпну перевірку (exhaustive check): TypeScript вимагатиме визначити всі ключі з `K`.

---

### 2. Як працюють utility types `Pick`, `Omit`, `Partial`, `Required` на рівні Generics?

Усі вони побудовані на базі **Mapped Types** та оператора пошуку ключів `keyof`:

#### Як влаштований `Partial<T>`:
Робить кожне поле необов'язковим за допомогою модифікатора `?`:
```typescript
type MyPartial<T> = {
  [P in keyof T]?: T[P];
};
```

#### Як влаштований `Required<T>`:
Видаляє модифікатор необов'язковості за допомогою `-?`:
```typescript
type MyRequired<T> = {
  [P in keyof T]-?: T[P];
};
```

#### Як влаштований `Pick<T, K>`:
Вибирає лише вказані ключі `K`, де `K extends keyof T`:
```typescript
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

#### Як влаштований `Omit<T, K>`:
Відкидає ключі `K`, використовуючи `Exclude`:
```typescript
type MyOmit<T, K extends keyof any> = MyPick<T, Exclude<keyof T, K>>;
```

---

### 3. У чому різниця між Dependency Injection (DI) та Inversion of Control (IoC)? Як це реалізовано в NestJS?

* **Inversion of Control (IoC) — Архітектурний принцип:**
  - У традиційному програмуванні наш код сам керує створенням об'єктів: `const service = new InventoryService()`.
  - Принцип IoC каже: *"Передайте керування створенням об'єктів і життєвим циклом сторонньому фреймворку/контейнеру (Hollywood Principle: Don't call us, we'll call you)"*.
* **Dependency Injection (DI) — Патерн проектування (конкретна реалізація IoC):**
  - Об'єкт отримує свої залежності ззовні (найчастіше через параметри конструктора), а не створює їх самостійно.
* **Реалізація в NestJS:**
  - **IoC Container:** під час старту додатку NestJS аналізує метадані декораторів (`@Module`, `@Injectable`) за допомогою бібліотеки `reflect-metadata`.
  - Контейнер будує граф залежностей (Dependency Graph), інстанціює синглтони провайдерів у правильному топологічному порядку та підставляє (інжектує) їх у конструктори класів.

---

### 4. Навіщо у Docker Compose вказувати `healthcheck` для БД і як `condition: service_healthy` допомагає залежним сервісам?

1. **Проблема:** Створення контейнера PostgreSQL займає частки секунди, але ініціалізація самої СУБД (налаштування пам'яті, читання WAL, запуск процесів і відкриття сокету порту 5432) триває кілька секунд.
2. **Чому звичайний `depends_on` не рятує:** Простий `depends_on: [postgres_db]` запускає залежний сервіс (pgAdmin або наш бекенд) одразу після старту контейнера Postgres. Якщо застосунок спробує підключитися до БД в цей момент — він впаде з помилкою `Connection refused` (ECONNREFUSED).
3. **Рішення:** 
   - `healthcheck` періодично запускає команду `pg_isready` всередині контейнера.
   - Стан контейнера переходить з `starting` у `healthy` лише тоді, коли база дійсно готова приймати запити.
   - `depends_on: { postgres_db: { condition: service_healthy } }` блокує старт залежних сервісів до отримання статусу `healthy`.

---

## 🏆 Підсумок
Усі вимоги **Day 1** заклали міцний інженерний фундамент для масштабування сервісу замовлень та безпечного управління складськими залишками!
