## 🛡️ Завдання 1: Валідація (Pipes) та Авторизація (Guards)

### Мета

Захистити ендпоінти створення замовлень у `server` від некоректних даних і неавторизованого доступу.

### Кроки

1. **DTO з валідацією:**
   - Встанови необхідні пакети:

     ```bash
     npm i class-validator class-transformer
     ```

   - Створи `CreateOrderDto`:
     - `items`: непорожній масив об'єктів товару (`productId: string` у форматі UUID, `quantity: number` мінімум 1).
     - `deliveryAddress`: обов'язковий непорожній рядок.
     - `paymentMethod`: enum (`'CARD' | 'CASH' | 'CRYPTO'`).
   - Підключи глобальний `ValidationPipe` у `main.ts` з прапорцями `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.

2. **Roles Guard:**
   - Створи декоратор `@Roles('ADMIN', 'CUSTOMER')` за допомогою `SetMetadata` або `Reflector.createDecorator()`.
   - Реалізуй `RolesGuard` (`implements CanActivate`), який перевіряє роль користувача із заголовка запиту (наприклад, `x-user-role`) та порівнює її з ролями, дозволеними для ендпоінта.

---

## 🔄 Завдання 2: Interceptors та Custom Param Decorator

### Мета

Уніфікувати формат відповіді API та спростити отримання даних користувача в контролерах.

### Кроки

1. **Logging & Timing Interceptor:**
   - Створи `LoggingInterceptor` (`implements NestInterceptor`).
   - Він повинен фіксувати метод, URL запиту, час виконання в мілісекундах та виводити результат у консоль (`[GET] /orders - 12ms`).

2. **Transform Response Interceptor:**
   - Створи `TransformInterceptor`, який загортає будь-яку успішну відповідь у стандартизовану структуру:

     ```json
     {
       "success": true,
       "data": { ... },
       "timestamp": "2026-09-03T17:00:00.000Z"
     }
     ```

3. **Custom Parameter Decorator `@CurrentUser()`:**
   - Створи декоратор за допомогою `createParamDecorator`, який витягує об'єкт користувача або конкретне поле (наприклад, `req.headers['x-user-id']`) безпосередньо в аргумент методу контролера:

     ```typescript
     @Post()
     createOrder(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) { ... }
     ```
