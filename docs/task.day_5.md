# День 5: Транзакції в SQL, рівні ізоляції та блокування (Pessimistic vs Optimistic)

Сьогодні ми завершуємо перший мікропроєкт — **Transactional Order & Inventory API**. Головний фокус дня — надійність фінансових та складських операцій: розбираємо властивості ACID, рівні ізоляції транзакцій у PostgreSQL та захищаємося від race conditions (стан гонитви) при одночасному списанні залишків.

---

## ⏱️ Розклад Дня 5 (6 годин)

| Блок | Тривалість | Тема | Опис |
| :--- | :--- | :--- | :--- |
| **Блок 1** | 1 год | Алгоритмічний розігрів (TS/JS) | Симуляція черги та примітиву блокування (Mutex/Semaphore) для асинхронних операцій у пам'яті |
| **Блок 2** | 2.5 год | Транзакції та рівні ізоляції в SQL | ACID, Dirty Read, Non-repeatable Read, Phantom Read, рівні ізоляції в PostgreSQL |
| **Блок 3** | 1.5 год | Боротьба з Race Conditions у NestJS | Списання залишків товару: Pessimistic Locking (`SELECT FOR UPDATE`) vs Optimistic Locking (`version`) |
| **Блок 4** | 1 год | Рев'ю першого проєкту та інтерв'ю | Підбиття підсумків Проєкту 1, розбір типових запитань про транзакції та блокування |

---

## 🧩 Завдання 1: Алгоритмічний розігрів (Mutex для асинхронних операцій)

### Мета:
Зрозуміти проблему одночасного доступу до спільного ресурсу (race condition) у Node.js Event Loop та реалізувати примітив синхронізації.

### Проблема:
Хоча Node.js є однопотоковим у виконанні JS-коду, асинхронні паузи (`await`) між читанням та записом стану дозволяють іншим подіям втручатися в послідовність операцій:

```typescript
let balance = 100;

async function withdraw(amount: number): Promise<boolean> {
  if (balance >= amount) {
    // Симуляція затримки (наприклад, I/O або запит до зовнішнього сервісу)
    await new Promise((resolve) => setTimeout(resolve, 50));
    balance -= amount;
    return true;
  }
  return false;
}
```
Якщо запустити `Promise.all([withdraw(80), withdraw(80)])`, обидва знімуть кошти, і баланс піде в мінус (-60).

### Вимоги:
1. **Реалізація Mutex:**
   Створи клас `Mutex`, що забезпечує взаємне виключення критичної секції:
   ```typescript
   export class Mutex {
     private locked = false;
     private queue: (() => void)[] = [];

     async acquire(): Promise<() => void> {
       // Повертає функцію release(), яка звільняє блокування для наступного в черзі
     }

     async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
       // Зручний wrapper для автоматичного виклику release після завершення
     }
   }
   ```
2. **Перевірка:**
   Захисти функцію `withdraw` за допомогою `Mutex` та продемонструй, що з двох паралельних запитів на 80 успішно виконується лише один, а баланс залишається коректним (20).

---

## 🛡️ Завдання 2: Транзакції та рівні ізоляції в PostgreSQL

### Мета:
Побачити на практиці аномалії паралельного виконання транзакцій та як база даних захищає від них на різних рівнях ізоляції.

### Кроки:
1. **Аномалії транзакцій:**
   У pgAdmin відкрий два незалежних Query Tool (Сесія A та Сесія B).
2. **Експеримент 1: Втрачене оновлення (Lost Update):**
   - У обох сесіях розпочни транзакцію: `BEGIN;`.
   - Обидві сесії зчитують кількість товару: `SELECT quantity FROM "Product" WHERE id = '...';` (наприклад, 10 шт).
   - Сесія A віднімає 3 шт: `UPDATE "Product" SET quantity = 7 WHERE id = '...';`.
   - Сесія B віднімає 4 шт: `UPDATE "Product" SET quantity = 6 WHERE id = '...';`.
   - Обидві сесії роблять `COMMIT;`.
   - Зафіксуй фактичне значення поля `quantity` та поясни результат.
3. **Експеримент 2: Рівні ізоляції:**
   - Перевір поведінку за замовчуванням у PostgreSQL (`READ COMMITTED`).
   - Спробуй підвищити рівень ізоляції до `REPEATABLE READ` або `SERIALIZABLE`:
     ```sql
     BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
     ```
   - Повтори конкурентне оновлення та проаналізуй помилку серіалізації: `ERROR: could not serialize access due to concurrent update`.

---

## 🔒 Завдання 3: Pessimistic vs Optimistic Locking у NestJS

### Мета:
Реалізувати надійне оформлення замовлення у `order-service` зі зменшенням залишків на складі без втрати даних під навантаженням.

### Кроки:
1. **Песимістичне блокування (Pessimistic Locking):**
   - У `InventoryService` створи метод `reserveStockPessimistic(productId: string, quantity: number)` всередині SQL-транзакції ORM.
   - Використай блокування рядка:
     - У Prisma: `$queryRaw` з `SELECT * FROM "Product" WHERE id = $1 FOR UPDATE`.
     - У TypeORM: `.setLock('pessimistic_write')` або `find({ where: { id }, lock: { mode: 'pessimistic_write' } })`.
   - Якщо `stockQuantity >= quantity`, зменшуємо залишок та зберігаємо. Якщо ні — викидаємо `BadRequestException` і відкочуємо транзакцію.
2. **Оптимістичне блокування (Optimistic Locking):**
   - Додай поле `version Int @default(1)` у таблицю `Product`.
   - Реалізуй `reserveStockOptimistic(productId: string, quantity: number)`:
     - Зчитуємо товар разом із поточним `version`.
     - Виконуємо умовне оновлення:
       ```sql
       UPDATE "Product" 
       SET "stockQuantity" = "stockQuantity" - $quantity, "version" = "version" + 1 
       WHERE "id" = $productId AND "version" = $currentVersion;
       ```
     - Якщо оновлено 0 рядків — хтось змінив запис раніше. Оброби цей випадок (повторна спроба / retry або повідомлення про помилку клієнту).

---

## 🎯 Питання для самоперевірки та інтерв'ю

1. **ACID:** Розкрий значення кожної літери (Atomicity, Consistency, Isolation, Durability) простими словами на прикладі банківського переказу.
2. **Рівні ізоляції SQL стандарту:** Назви 4 рівні ізоляції від найслабшого до найсуворішого. Які аномалії допускає кожен із них?
3. **Pessimistic vs Optimistic:** За якими критеріями ти обереш песимістичне блокування (`FOR UPDATE`) замість оптимістичного (`version`), і навпаки?
4. **Deadlock:** Що таке взаємне блокування транзакцій (deadlock) у базі даних, чому воно виникає і як його попередити на рівні проєктування коду?