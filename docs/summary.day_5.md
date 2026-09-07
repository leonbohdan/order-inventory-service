# 📋 Підсумки роботи: Day 5 — Транзакції в SQL, рівні ізоляції, аномалії паралелізму та блокування (Pessimistic vs Optimistic Locking) у NestJS

Цей документ містить вичерпний звіт про виконану роботу в рамках **Day 5** — фінального дня першого мікропроєкту **Transactional Order & Inventory API**. У фокусі дня: забезпечення цілісності фінансових та складських операцій в умовах високої конкурентності (High Concurrency), розбір властивостей ACID, експериментальне виявлення аномалій паралельного доступу в PostgreSQL, архітектурна інтеграція Prisma 7 у NestJS та реалізація двох фундаментальних стратегій блокування: **Pessimistic Locking** (`SELECT FOR UPDATE`) та **Optimistic Locking** (`version Compare-And-Swap`).

---

## 📑 Зміст
1. [Огляд завдань Дня 5](#-огляд-завдань-дня-5)
2. [Блок 1: Алгоритмічний розігрів — Race Condition у Node.js Event Loop та Mutex](#-блок-1-алгоритмічний-розігрів--race-condition-у-nodejs-event-loop-та-mutex)
3. [Блок 2: Експерименти з рівнями ізоляції в PostgreSQL](#-блок-2-експерименти-з-рівнями-ізоляції-в-postgresql)
   - [2.1. Аномалія Lost Update на рівні READ COMMITTED](#21-аномалія-lost-update-на-рівні-read-committed)
   - [2.2. Захист через REPEATABLE READ та помилка серіалізації 40001](#22-захист-через-repeatable-read-та-помилка-серіалізації-40001)
4. [Блок 3: Архітектурна інтеграція Prisma 7 у NestJS](#-блок-3-архітектурна-інтеграція-prisma-7-у-nestjs)
5. [Блок 4: Песимістичне блокування (Pessimistic Locking — SELECT FOR UPDATE)](#-блок-4-песимістичне-блокування-pessimistic-locking--select-for-update)
6. [Блок 5: Оптимістичне блокування (Optimistic Locking — version CAS)](#-блок-5-оптимістичне-блокування-optimistic-locking--version-cas)
7. [Блок 6: Стрес-тестування конкурентності (Race Condition Demo)](#-блок-6-стрес-тестування-конкурентності-race-condition-demo)
8. [Блок 7: Повна документація Postman API Collection](#-блок-7-повна-документація-postman-api-collection)
9. [📊 Порівняльна інженерна матриця стратегій контролю конкурентності](#-порівняльна-інженерна-матриця-стратегій-контролю-конкурентності)

---

## 🎯 Огляд завдань Дня 5

Головна мета Day 5 — захистити операції списання залишків та оформлення замовлень від стану гонитви (Race Conditions) та дефіциту/овербукінгу:
* **Розуміння природи Race Condition у Node.js:** дослідження впливу асинхронних пауз (`await`) на консистентність даних у пам'яті одного процесу.
* **Практичні аномалії в PostgreSQL 17:** моделювання паралельних сесій клієнтів (Сесія A та Сесія B) у psql / pgAdmin, відтворення втраченого оновлення (**Lost Update**) на `READ COMMITTED` та аналіз механизму Snapshot Isolation на `REPEATABLE READ`.
* **Інтеграція ORM у NestJS:** створення глобального `PrismaModule` та `PrismaService` із використанням нового рушія **Prisma 7** та адаптера `@prisma/adapter-pg`.
* **Песимістичний патерн:** використання інтерактивних транзакцій `$transaction` та нативного SQL-блокування рядків `SELECT ... FOR UPDATE`.
* **Оптимістичний патерн:** додавання поля `version` у схему БД, генерація міграції та реалізація атомарного оновлення з перевіркою версії (Compare-And-Swap).
* **Стрес-тест під навантаженням:** перевірка стійкості API до 10 паралельних конкурентних запитів.

---

## 🧩 Блок 1: Алгоритмічний розігрів — Race Condition у Node.js Event Loop та Mutex

Хоча середовище виконання JavaScript у Node.js є однопотоковим (Single-Threaded Event Loop), наявність асинхронних операцій вводу-виводу (`await Promise`, I/O, запити до БД) створює розрив між операціями **читання** та **запису** стану.

### Анатомія проблеми: Check-Then-Act
```
Клієнт 1:  [ Читає: balance = 100 ] ──> ( await I/O ... ) ──> [ Записує: 100 - 80 = 20 ]
                                                ▲
                                                │ вклинюється Клієнт 2!
Клієнт 2:                       [ Читає: balance = 100 ] ──> ( await I/O ... ) ──> [ Записує: 100 - 80 = -60! ]
```

### Рішення: Примітив Mutex (Mutual Exclusion)
Реалізовано синхронізаційний примітив, що чергує критичні секції асинхронного коду через чергу промісів:
1. Метод `acquire(): Promise<() => void>` повертає функцію звільнення блокування `release()`.
2. Метод `runExclusive<T>(fn: () => Promise<T>): Promise<T>` гарантує автоматичний виклик `release()` навіть у випадку викидання винятку (`try ... finally`).

---

## 🛡️ Блок 2: Експерименти з рівнями ізоляції в PostgreSQL

Для експерименту в таблиці `"Product"` було створено тестовий товар:
```sql
INSERT INTO "Product" (id, sku, title, price, "stockQuantity")
VALUES ('test-product-day5', 'TEST-DAY5', 'Тестовий товар для експериментів', 100, 10);
```

Було відкрито два паралельних сеанси терміналу (Сесія A та Сесія B) через `docker exec -it postgres_db psql -U postgres -d order_inventory_db`.

---

### 2.1. Аномалія Lost Update на рівні READ COMMITTED

`READ COMMITTED` — рівень за замовчуванням у PostgreSQL. Кожен запит бачить лише дані, зафіксовані до початку цього запиту.

#### Хід виконання:
1. **Сесія A:** `BEGIN;` $\to$ `SELECT "stockQuantity" FROM "Product" ...;` (бачить **10**).
2. **Сесія B:** `BEGIN;` $\to$ `SELECT "stockQuantity" FROM "Product" ...;` (бачить **10**).
3. **Сесія A:** списує 3 шт:
   ```sql
   UPDATE "Product" SET "stockQuantity" = 7 WHERE id = 'test-product-day5';
   ```
4. **Сесія B:** списує 4 шт (розраховано від 10: $10 - 4 = 6$):
   ```sql
   UPDATE "Product" SET "stockQuantity" = 6 WHERE id = 'test-product-day5';
   ```
   *(Сесія B стає в чергу очікування на блокуванні рядка `RowExclusiveLock`).*
5. **Сесія A:** `COMMIT;` $\to$ блокування звільняється, Сесія B розблоковується та записує `6`.
6. **Сесія B:** `COMMIT;`.

#### Результат:
```sql
SELECT "stockQuantity" FROM "Product" WHERE id = 'test-product-day5';
-- Результат: 6
```
> [!WARNING]
> **Аномалія:** Списано $3 + 4 = 7$ одиниць. Очікуваний залишок: $10 - 7 = 3$. Фактичний залишок у базі: **6**. Оновлення Сесії A безслідно затерлося Сесією B (**Lost Update**).

---

### 2.2. Захист через REPEATABLE READ та помилка серіалізації 40001

Рівень `REPEATABLE READ` використовує знімок даних (**Snapshot Isolation / MVCC**), зафіксований на момент виконання першого запиту в транзакції.

#### Хід виконання:
1. Обидві сесії:
   ```sql
   BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
   ```
2. Обидві сесії зчитують початковий стан (`10`).
3. **Сесія A:** `UPDATE "Product" SET "stockQuantity" = 7 ...;`
4. **Сесія B:** `UPDATE "Product" SET "stockQuantity" = 6 ...;` (чекає на блокуванні).
5. **Сесія A:** `COMMIT;`.
6. **Сесія B:** миттєво падає з помилкою:
   ```text
   ERROR: could not serialize access due to concurrent update
   SQL state: 40001
   ```

> [!IMPORTANT]
> **Висновок:** Рушій PostgreSQL виявив, що рядок, який Сесія B намагається змінити, був модифікований та зафіксований іншою транзакцією після старту знімка Сесії B. База даних абортувала транзакцію B (`40001`), запобігши тихому спотворенню даних.

---

## 🏗️ Блок 3: Архітектурна інтеграція Prisma 7 у NestJS

Для роботи зі справжньою базою даних сервіс було переведено з in-memory масивів на повноцінний `PrismaService`.

### 1. `PrismaService` ([server/src/prisma/prisma.service.ts](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/prisma/prisma.service.ts))
Підключення драйвера `@prisma/adapter-pg` та керування життєвим циклом:
```typescript
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 2. Глобальний модуль `PrismaModule` ([server/src/prisma/prisma.module.ts](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/prisma/prisma.module.ts))
Забезпечує доступність `PrismaService` в усіх модулях додатку без потреби дублювання імпортів:
```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## 🔒 Блок 4: Песимістичне блокування (Pessimistic Locking — SELECT FOR UPDATE)

### Концепція:
Ми припускаємо високу ймовірність конфлікту (гарячий товар, розпродаж). На момент читання товару ми захоплюємо ексклюзивне блокування рядка в PostgreSQL за допомогою `SELECT ... FOR UPDATE`. Усі конкурентні транзакції чекають своєї черги і після розблокування зчитують **вже актуалізований залишок**.

### Реалізація в `InventoryService` ([server/src/inventory/inventory.service.ts](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/inventory/inventory.service.ts)):
```typescript
async reserveStockPessimistic(
  productId: string,
  quantity: number,
): Promise<Product> {
  return this.prisma.$transaction(async (tx) => {
    // 1. Блокуємо рядок товару на рівні PostgreSQL
    const [product] = await tx.$queryRaw<Product[]>`
      SELECT * FROM "Product" WHERE id = ${productId} FOR UPDATE
    `;

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // 2. Атомарна перевірка залишку
    if (product.stockQuantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock for product ${product.title}. Available: ${product.stockQuantity}, requested: ${quantity}`,
      );
    }

    // 3. Зменшення залишку та фіксація
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        stockQuantity: product.stockQuantity - quantity,
      },
    });

    return updatedProduct;
  });
}
```

---

## 🛡️ Блок 5: Оптимістичне блокування (Optimistic Locking — version CAS)

### Концепція:
Ми припускаємо, що конфлікти трапляються нечасто. Замість блокування рядків у БД, ми додаємо поле `version`. Під час оновлення використовується механізм **Compare-And-Swap (CAS)**: оновлюємо залишок та збільшуємо версію на `+1` тільки за умови, що поточна версія в базі збігається з версією, яку ми прочитали. Якщо оновлено 0 рядків — стався конфлікт версій (`409 Conflict`).

### 1. Зміна схеми БД ([server/prisma/schema.prisma](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/prisma/schema.prisma))
```prisma
model Product {
  id            String      @id @default(uuid())
  sku           String      @unique
  title         String
  price         Decimal     @default(0)
  stockQuantity Int         @default(0)
  version       Int         @default(1) // 👈 Контроль версії
  categories    Category[]
  orderItems    OrderItem[]
}
```
Міграція застосована: `20260907102747_add_product_version`.

### 2. Реалізація в `InventoryService`:
```typescript
async reserveStockOptimistic(
  productId: string,
  quantity: number,
): Promise<Product> {
  // 1. Зчитування поточного стану без блокування
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundException(`Product with ID ${productId} not found`);
  }

  if (product.stockQuantity < quantity) {
    throw new BadRequestException(
      `Insufficient stock for product ${product.title}. Available: ${product.stockQuantity}, requested: ${quantity}`,
    );
  }

  // 2. Умовний атомарний запис (CAS)
  const result = await this.prisma.product.updateMany({
    where: {
      id: productId,
      version: product.version, // перевірка версії
    },
    data: {
      stockQuantity: { decrement: quantity },
      version: { increment: 1 },
    },
  });

  // 3. Якщо оновлено 0 рядків — паралельна транзакція встигла раніше
  if (result.count === 0) {
    throw new ConflictException(
      `Concurrent update conflict for product ${product.title}. Please try again.`,
    );
  }

  return (await this.prisma.product.findUnique({
    where: { id: productId },
  }))!;
}
```

---

## 🧪 Блок 6: Стрес-тестування конкурентності (Race Condition Demo)

Було проведено навантажувальний тест на паралельне виконання **10 одночасних конкурентних запитів** списання по 1 шт товару (`test-product-day5`, початковий залишок: 10 шт):

```bash
for i in {1..10}; do
  curl -s -w "\nStatus: %{http_code}\n" -X POST http://localhost:3000/inventory/reserve-optimistic \
    -H "Content-Type: application/json" \
    -d '{"productId": "test-product-day5", "quantity": 1}' &
done
wait
```

### Фактичний розподіл відповідей сервера:
```
[Запит 1]:  HTTP 201 Created  --> stockQuantity: 3, version: 5
[Запит 2]:  HTTP 201 Created  --> stockQuantity: 2, version: 6
[Запит 3]:  HTTP 409 Conflict --> "Concurrent update conflict for product... Please try again."
[Запит 4]:  HTTP 201 Created  --> stockQuantity: 1, version: 7
[Запит 5]:  HTTP 409 Conflict --> "Concurrent update conflict for product... Please try again."
[Запит 6]:  HTTP 201 Created  --> stockQuantity: 0, version: 8
[Запит 7]:  HTTP 400 Bad Req  --> "Insufficient stock... Available: 0, requested: 1"
[Запит 8]:  HTTP 400 Bad Req  --> "Insufficient stock... Available: 0, requested: 1"
[Запит 9]:  HTTP 400 Bad Req  --> "Insufficient stock... Available: 0, requested: 1"
[Запит 10]: HTTP 400 Bad Req  --> "Insufficient stock... Available: 0, requested: 1"
```

### Висновки тестування:
1. **Ідеальна збереженість залишків:** Товар списано рівно до `0`. Залишок не пішов у мінус (-1, -2 тощо).
2. **Передбачуваність поведінки:** Усі конфліктні запити, які читали застарілу версію, були перехоплені фільтром версії й повернули `409 Conflict`.
3. **Захист від дефіциту:** Після досягнення нульового залишку спрацював валідатор `Insufficient stock (400)`.

---

## 📮 Блок 7: Повна документація Postman API Collection

Усі ендпоінти проєкту зібрано в стандартизовану колекцію Postman (v2.1.0) з повною англомовною документацією, змінними середовища та готовими прикладами payload:

📁 **Шлях до файлу:** [postman/order-inventory-service.postman_collection.json](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/postman/order-inventory-service.postman_collection.json)

### Структура колекції:
* **Колекційні змінні:**
  - `{{baseUrl}}` = `http://localhost:3000`
  - `{{productId}}` = `test-product-day5`
  - `{{userId}}` = `1babcc42-f284-4278-9caf-0f7d7b442b12`
* **Група `📦 Inventory`:**
  - `GET {{baseUrl}}/inventory` — отримання всіх товарів із актуальними залишками та версіями.
  - `POST {{baseUrl}}/inventory/reserve-pessimistic` — песимістичне резервування (`FOR UPDATE`).
  - `POST {{baseUrl}}/inventory/reserve-optimistic` — оптимістичне резервування (`version CAS`).
* **Група `🛒 Orders`:**
  - `GET {{baseUrl}}/orders` — перегляд замовлень із заголовком `x-user-role: admin`.
  - `POST {{baseUrl}}/orders` — оформлення замовлення із заголовками `x-user-role: customer`, `x-user-id: {{userId}}`.
* **Група `⚙️ System`:**
  - `GET {{baseUrl}}/` — перевірка працездатності сервісу.

---

## 📊 Порівняльна інженерна матриця стратегій контролю конкурентності

| Критерій | Pessimistic Locking (`SELECT FOR UPDATE`) | Optimistic Locking (`version CAS`) | Atomic SQL Update (`UPDATE ... WHERE stock >= qty`) |
| :--- | :--- | :--- | :--- |
| **Механізм** | Блокування рядка в БД на час транзакції | Перевірка версії запису при збереженні | Безпосереднє обчислення залишку в SQL |
| **Рівень навантаження на БД** | Вищий (тримає з'єднання та блокування) | Мінімальний (короткі транзакції) | Найнижчий (1 швидкий запит) |
| **Пропускна здатність на читання** | Блокує інші `FOR UPDATE` читання | Не блокує операції читання | Не блокує операції читання |
| **Поведінка при конфлікті** | Інші транзакції чекають у черзі | Виникає помилка `409 Conflict` (потрібен retry) | Оновлюється 0 рядків |
| **Ризик Deadlock** | Присутній при блокуванні кількох таблиць | Відсутній | Відсутній |
| **Оптимальне застосування** | Гарячі товари з високим шансом колізій (концертні квитки, flash-продажі) | Каталоги з помірним трафіком, де колізії рідкісні (e-commerce, CRM, профілі) | Просте списання лічильників без складної валідації супутніх сутностей |
