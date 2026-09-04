# 📋 Підсумки роботи: Day 2 — Pipes, Guards, Interceptors & Decorators

Цей документ містить повний звіт про виконану роботу в рамках **Day 2**, детальний аналіз архітектурних рішень, пояснення технологій («що, як, для чого і чому») та правила життєвого циклу запиту в **NestJS**.

---

## 📑 Зміст
1. [Огляд завдань](#-огляд-завдань)
2. [Блок 1: Валідація та DTO (ValidationPipe & class-validator)](#-блок-1-валідація-та-dto)
3. [Блок 2: Авторизація за ролями (RolesGuard & Reflector)](#-блок-2-авторизація-за-ролями)
4. [Блок 3: Кастомний декоратор параметра (@CurrentUser)](#-блок-3-кастомний-декоратор-параметра-currentuser)
5. [Блок 4: Інтерцептори (LoggingInterceptor & TransformInterceptor)](#-блок-4-інтерцептори-лог-та-трансформація)
6. [Блок 5: Атомарність бізнес-логіки (OrdersService)](#-блок-5-атомарність-бізнес-логіки)
7. [Архітектура: Життєвий цикл запиту (Request Lifecycle)](#-архітектура-життєвий-цикл-запиту)

---

## 🎯 Огляд завдань

Головна мета Day 2 — перетворити прототип API на захищений, стабільний та стандартизований бекенд-сервіс за допомогою інструментів екосистеми NestJS:
* **Захист вхідних даних:** валідація складних вкладених структур та відсікання некоректних запитів.
* **Контроль доступу (RBAC):** перевірка ролей користувачів до виклику обробників маршрутів.
* **Чистота контролерів:** вилучення даних користувача через кастомний декоратор без прямого доступу до Express Request.
* **Наскрізна функціональність (AOP):** централізоване логування часу виконання та уніфікація формату відповідей.

---

## 🛡️ Блок 1: Валідація та DTO

### Що було зроблено:
1. Встановлено бібліотеки `class-validator` та `class-transformer`.
2. Створено класи [OrderItemDto](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/orders/dto/create-order.dto.ts) та [CreateOrderDto](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/orders/dto/create-order.dto.ts):
   - `items`: непорожній масив із вкладеними об'єктами (`productId` у форматі UUID, `quantity` як ціле число $\ge 1$).
   - `deliveryAddress`: обов'язковий рядок з обмеженням довжини до 200 символів (`@MaxLength(200)`).
   - `paymentMethod`: перевірка на допустимі значення за допомогою `@IsEnum(PAYMENT_METHOD)`.
3. У [main.ts](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/main.ts) підключено глобальний `ValidationPipe`.

### Як це працює:
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### Для чого і чому:
* **Чому класи, а не інтерфейси?** TypeScript-типи та інтерфейси існують тільки під час компіляції (*Type Erasure*). У рантаймі (в Node.js) вони зникають. Класи JavaScript залишаються в рантаймі, що дозволяє бібліотеці `class-validator` зчитувати метадані декораторів.
* **Вкладена валідація (`@ValidateNested` + `@Type`):** оскільки інформація про тип елементів масиву втрачається, декоратор `@Type(() => OrderItemDto)` з `class-transformer` явно вказує бібліотеці перетворити кожен елемент масиву на екземпляр класу `OrderItemDto`, а `@ValidateNested({ each: true })` запускає валідацію для кожного елемента.
* **Захист від Mass Assignment (`whitelist` + `forbidNonWhitelisted`):** гарантує, що клієнт не зможе передати приховані поля (наприклад, `isAdmin: true` або `price: 0`), повертаючи помилку `400 Bad Request`.
* **Автоматичне перетворення (`transform: true`):** створює реальні інстанси DTO-класів із прототипами та методами.

---

## 🔐 Блок 2: Авторизація за ролями

### Що було зроблено:
1. Створено типізовану структуру ролей `ROLE` (`ADMIN`, `CUSTOMER`, `MANAGER`) та декоратор [Roles](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/auth/decorators/roles.decorator.ts).
2. Реалізовано [RolesGuard](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/auth/guards/roles.guard.ts), що імплементує інтерфейс `CanActivate`.
3. Підключено гард на рівні класу [OrdersController](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/orders/orders.controller.ts) за допомогою `@UseGuards(RolesGuard)`.

### Як це працює:
```typescript
// roles.decorator.ts
export const Roles = Reflector.createDecorator<Role[]>();

// roles.guard.ts
const requiredRoles = this.reflector.getAllAndOverride<Role[]>(Roles, [
  context.getHandler(),
  context.getClass(),
]);
```

### Для чого і чому:
* **Принцип найменших привілеїв:** захищає ресурс від неавторизованого доступу.
* **`getAllAndOverride`:** дозволяє задавати ролі як для окремого методу контролера (`handler`), так і для всього контролера (`class`), причому налаштування методу можуть перевизначати налаштування класу.
* **Відсікання до виконання логіки:** Guard викликається **до** Interceptors (pre-handler), Pipes та Controller, що зберігає ресурси сервера (немає сенсу парсити важкий JSON чи звертатися до бази, якщо у користувача немає прав).

---

## 👤 Блок 3: Кастомний декоратор параметра (`@CurrentUser`)

### Що було зроблено:
Створено декоратор [CurrentUser](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/auth/decorators/current-user.decorator.ts) за допомогою функції `createParamDecorator`.

### Як це працює:
```typescript
export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: UserPayload = {
      id: request.headers['x-user-id'] as string | undefined,
      role: request.headers['x-user-role'] as string | undefined,
    };
    return data ? user[data] : user;
  },
);
```

### Для чого і чому:
* **Інкапсуляція:** контролер більше не залежить від низькорівневого об'єкта Express `Request`.
* **Зручність тестування:** контролер, який приймає `createOrder(@CurrentUser('id') userId: string, ...)`, у unit-тестах можна протестувати, просто передавши рядок `'usr_123'`, без необхідності мокати складний об'єкт `Request`.

---

## 🔄 Блок 4: Інтерцептори (Лог та Трансформація)

### Що було зроблено:
1. **[LoggingInterceptor](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/common/interceptors/logging.interceptor.ts):** вимірює тривалість обробки запиту та виводить результат через нативний `Logger('HTTP')`.
2. **[TransformInterceptor](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/common/interceptors/transform.interceptor.ts):** огортає всі успішні відповіді у стандартизований формат:
   ```json
   {
     "success": true,
     "data": { ... },
     "timestamp": "2026-09-04T14:24:44.000Z"
   }
   ```
3. Обидва інтерцептори підключено глобально у [main.ts](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/main.ts).

### Як це працює (Різниця між `tap` та `map`):
* **`tap()` (Logging):** оператор побічної дії в RxJS. Він «підглядає» у потік після завершення виконання контролера, рахує `Date.now() - now` і пише лог, **не змінюючи** самі дані.
* **`map()` (Transform):** оператор модифікації даних. Він бере вихідне значення від контролера (`data`) і повертає новий об'єкт нової форми (`ResponseFormat<T>`).
* **Обробка помилок:** якщо виникає `HttpException` (наприклад, 400 або 403), оператор `map` **не виконується**, тому помилки не отримують хибного статусу `success: true`.

---

## ⚡ Блок 5: Атомарність бізнес-логіки

### Що було виправлено:
У [orders.service.ts](file:///home/bohdan/MyProjects/test_projects/order-inventory-service/server/src/orders/orders.service.ts) усунуто критичну вразливість **"часткового резервування"**.

### Проблема:
Раніше резервування відбувалося одразу в циклі: якщо товар №1 резервувався, а на товарі №2 виникала нестача — викидався `BadRequestException`, але товар №1 уже залишався безповоротно списаним зі складу!

### Рішення (Двофазний підхід):
```typescript
// Фаза 1: Перевірка наявності ВСІХ позицій замовлення
for (const item of dto.items) {
  if (!this.inventoryService.checkAvailability(item.productId, item.quantity)) {
    throw new BadRequestException(`Product with ID ${item.productId} is out of stock...`);
  }
}

// Фаза 2: Списання лише за умови 100% готовності кошика
for (const item of dto.items) {
  this.inventoryService.reserve(item.productId, item.quantity);
}
```

---

## 🏗️ Архітектура: Життєвий цикл запиту (Request Lifecycle)

Підсумкова схема проходження HTTP-запиту крізь створені нами компоненти:

```
[ Клієнт: POST /orders ]
       │
       ▼
1. RolesGuard (CanActivate)
   └── Перевіряє x-user-role на відповідність @Roles. Якщо ні -> 403 Forbidden.
       │
       ▼
2. LoggingInterceptor (Pre-controller)
   └── Засікає час старту: now = Date.now().
       │
       ▼
3. TransformInterceptor (Pre-controller)
   └── Передає запит далі через next.handle().
       │
       ▼
4. ValidationPipe
   └── Перетворює тіло на CreateOrderDto, валідує поля, видаляє зайве. Якщо помилка -> 400 Bad Request.
       │
       ▼
5. OrdersController (@CurrentUser + @Body)
   └── Витягує userId та передає DTO у OrdersService.
       │
       ▼
6. OrdersService & InventoryService
   └── Двофазна перевірка та резервування товару, повернення сутності Order.
       │
       ▼
7. TransformInterceptor (Post-controller / map)
   └── Загортає Order у { success: true, data: Order, timestamp: ISO }.
       │
       ▼
8. LoggingInterceptor (Post-controller / tap)
   └── Рахує різницю часу (Date.now() - now) і виводить: [POST] /orders - 12ms.
       │
       ▼
[ Клієнт отримує результат ]
```

---

## 🏆 Підсумок
Усі вимоги **Day 2** успішно реалізовані відповідно до стандартів чистого коду, типізації TypeScript та рекомендацій NestJS!
