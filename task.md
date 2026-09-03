## 🐳 Завдання 1: Docker-середовище для бази даних

### Мета

Створити ізольоване середовище для першого мікропроєкту (Transactional Order & Inventory API).

### Вимоги

Створи у корені проєкту файл `docker-compose.yml`, який описує:

1. **Сервіс `postgres_db`:**
   - Образ: `postgres:16-alpine`.
   - Змінні середовища: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (винести в `.env`).
   - Порти: прокинути `5432:5432`.
   - Volume: підключити persistent volume для збереження даних бази.
   - Healthcheck: налаштувати перевірку готовності БД за допомогою `pg_isready`.

2. **Сервіс `pgadmin`:**
   - Образ: `dpage/pgadmin4`.
   - Порти: `8080:80`.
   - Залежність від `postgres_db` (через `depends_on`).

3. **Спільна Docker-мережа:**
   - Обидва сервіси мають бути підключені до кастомної bridge-мережі `order_network`.

---

## ⚙️ Завдання 2: Ініціалізація ядра NestJS & Dependency Injection

### Мета

Створити каркас додатку `order-service` та реалізувати базову взаємодію між модулями.

### Кроки

1. Ініціалізувати новий проєкт:

   ```bash
   npx @nestjs/cli new order-service --skip-git --package-manager npm
   ```

2. Створити доменний модуль `Inventory`:

   ```bash
   nest g module inventory
   nest g controller inventory
   nest g service inventory
   ```

3. Реалізувати базовий in-memory склад (`InventoryService`):
   - Створити типізований список товарів (id, title, quantity, price).
   - Написати метод `checkAvailability(productId: string, quantity: number): boolean`.
   - Написати метод `reserve(productId: string, quantity: number): boolean`.
4. Створити модуль `Orders`, заінжектити `InventoryService` у `OrdersService` через експорт модуля `InventoryModule` (демонстрація DI).

---

## 🎯 Питання для самоперевірки та інтерв'ю

1. Чим `Record<K, T>` відрізняється від index signature `{[key: string]: T}`?
2. Як працюють utility types `Pick`, `Omit`, `Partial`, `Required` на рівні TypeScript Generics (як би ти реалізував `MyPartial<T>`)?
3. У чому різниця між Dependency Injection (DI) та Inversion of Control (IoC)? Як це реалізовано в контейнері NestJS?
4. Навіщо у Docker Compose вказувати `healthcheck` для БД і як `condition: service_healthy` допомагає залежним сервісам?

5. Реалізувати базовий in-memory склад (`InventoryService`):
   - Створити типізований список товарів (id, title, quantity, price).
   - Написати метод `checkAvailability(productId: string, quantity: number): boolean`.
   - Написати метод `reserve(productId: string, quantity: number): boolean`.
6. Створити модуль `Orders`, заінжектити `InventoryService` у `OrdersService` через експорт модуля `InventoryModule` (демонстрація DI).

---

## 🎯 Питання для самоперевірки та інтерв'ю

1. Чим `Record<K, T>` відрізняється від index signature `{[key: string]: T}`?
2. Як працюють utility types `Pick`, `Omit`, `Partial`, `Required` на рівні TypeScript Generics (як би ти реалізував `MyPartial<T>`)?
3. У чому різниця між Dependency Injection (DI) та Inversion of Control (IoC)? Як це реалізовано в контейнері NestJS?
4. Навіщо у Docker Compose вказувати `healthcheck` для БД і як `condition: service_healthy` допомагає залежним сервісам?
