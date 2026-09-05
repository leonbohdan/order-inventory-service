import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Початок наповнення бази даних (seeding)...');

  // 0. Очищення бази перед запуском (у правильному реляційному порядку)
  console.log('🧹 Очищення існуючих даних...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // 1. Створення Категорій
  console.log('📁 Створення категорій...');
  const categoryDefs = [
    { name: 'Електроніка', slug: 'electronics' },
    { name: 'Комп’ютери та комплектуючі', slug: 'computers' },
    { name: 'Смартфони та гаджети', slug: 'gadgets' },
    { name: 'Побутова техніка', slug: 'appliances' },
    { name: 'Одяг та аксесуари', slug: 'clothing' },
    { name: 'Книги та література', slug: 'books' },
  ];

  const categoriesMap = new Map<string, string>();
  for (const cat of categoryDefs) {
    const created = await prisma.category.create({ data: cat });
    categoriesMap.set(cat.slug, created.id);
  }

  // 2. Створення 10 Користувачів із Профілями (зв'язок 1:1)
  console.log('👥 Створення 10 користувачів із профілями...');
  const usersData = [
    {
      name: 'Олександр Коваль',
      email: 'oleksandr.koval@example.com',
      phone: '+380501112233',
      city: 'Київ',
      address: 'вул. Хрещатик, 15, кв. 42',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=oleksandr',
    },
    {
      name: 'Марія Мельник',
      email: 'maria.melnyk@example.com',
      phone: '+380672223344',
      city: 'Львів',
      address: 'просп. Свободи, 8, кв. 12',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
    },
    {
      name: 'Дмитро Шевченко',
      email: 'dmytro.shevchenko@example.com',
      phone: '+380633334455',
      city: 'Одеса',
      address: 'вул. Дерибасівська, 22, кв. 5',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dmytro',
    },
    {
      name: 'Олена Бойко',
      email: 'olena.boyko@example.com',
      phone: '+380994445566',
      city: 'Харків',
      address: 'вул. Сумська, 45, кв. 19',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=olena',
    },
    {
      name: 'Богдан Леон',
      email: 'bohdan.leon@example.com',
      phone: '+380505556677',
      city: 'Дніпро',
      address: 'просп. Дмитра Яворницького, 10, кв. 31',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bohdan',
    },
    {
      name: 'Андрій Ткаченко',
      email: 'andriy.tkachenko@example.com',
      phone: '+380676667788',
      city: 'Вінниця',
      address: 'вул. Соборна, 3, кв. 8',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andriy',
    },
    {
      name: 'Юлія Кравчук',
      email: 'yulia.kravchuk@example.com',
      phone: '+380637778899',
      city: 'Запоріжжя',
      address: 'просп. Соборний, 114, кв. 55',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yulia',
    },
    {
      name: 'Сергій Мороз',
      email: 'serhiy.moroz@example.com',
      phone: '+380958889900',
      city: 'Івано-Франківськ',
      address: 'вул. Незалежності, 7, кв. 14',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=serhiy',
    },
    {
      name: 'Наталія Поліщук',
      email: 'nataliia.polishchuk@example.com',
      phone: '+380989990011',
      city: 'Полтава',
      address: 'вул. Європейська, 60, кв. 27',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nataliia',
    },
    {
      name: 'Тарас Григоренко',
      email: 'taras.hryhorenko@example.com',
      phone: '+380500001122',
      city: 'Чернігів',
      address: 'просп. Миру, 20, кв. 3',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taras',
    },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        profile: {
          create: {
            phone: u.phone,
            city: u.city,
            address: u.address,
            avatar: u.avatar,
          },
        },
      },
    });
    createdUsers.push(user);
  }

  // 3. Створення 50 Товарів із категоріями (зв'язок N:M)
  console.log('📦 Створення 50 товарів...');
  const productsRaw = [
    // 1-10: Комп'ютери та електроніка
    {
      sku: 'NB-APL-M3-16',
      title: 'Ноутбук Apple MacBook Pro 16 M3 Max',
      price: 3499.99,
      stock: 12,
      cats: ['computers', 'electronics'],
    },
    {
      sku: 'NB-LEN-LEG-5',
      title: 'Ігровий ноутбук Lenovo Legion Pro 5',
      price: 1799.0,
      stock: 20,
      cats: ['computers', 'electronics'],
    },
    {
      sku: 'NB-ASU-ZEN-14',
      title: 'Ультрабук ASUS Zenbook 14 OLED',
      price: 1299.5,
      stock: 25,
      cats: ['computers', 'electronics'],
    },
    {
      sku: 'NB-DEL-XPS-13',
      title: 'Ноутбук Dell XPS 13 Plus',
      price: 1599.0,
      stock: 15,
      cats: ['computers', 'electronics'],
    },
    {
      sku: 'PC-MNT-LG-27',
      title: 'Монітор 27" LG UltraGear 4K 144Hz',
      price: 549.99,
      stock: 30,
      cats: ['computers', 'electronics'],
    },
    {
      sku: 'PC-MNT-DEL-34',
      title: 'Вигнутий монітор 34" Dell UltraSharp',
      price: 899.0,
      stock: 18,
      cats: ['computers', 'electronics'],
    },
    {
      sku: 'PC-KEY-LOG-MX',
      title: 'Бездротова клавіатура Logitech MX Keys S',
      price: 129.99,
      stock: 45,
      cats: ['computers'],
    },
    {
      sku: 'PC-MOU-LOG-MX',
      title: 'Бездротова миша Logitech MX Master 3S',
      price: 109.99,
      stock: 60,
      cats: ['computers'],
    },
    {
      sku: 'PC-SSD-SAM-2TB',
      title: 'Накопичувач SSD Samsung 990 Pro 2TB M.2',
      price: 199.99,
      stock: 50,
      cats: ['computers'],
    },
    {
      sku: 'PC-RAM-COR-32',
      title: 'Оперативна пам’ять Corsair Vengeance DDR5 32GB',
      price: 145.0,
      stock: 40,
      cats: ['computers'],
    },

    // 11-20: Смартфони та гаджети
    {
      sku: 'PH-APL-16PRO-256',
      title: 'Смартфон Apple iPhone 16 Pro 256GB',
      price: 1299.0,
      stock: 35,
      cats: ['gadgets', 'electronics'],
    },
    {
      sku: 'PH-SAM-S24U-512',
      title: 'Смартфон Samsung Galaxy S24 Ultra 512GB',
      price: 1399.0,
      stock: 25,
      cats: ['gadgets', 'electronics'],
    },
    {
      sku: 'PH-GOO-PX9-128',
      title: 'Смартфон Google Pixel 9 128GB',
      price: 799.0,
      stock: 30,
      cats: ['gadgets', 'electronics'],
    },
    {
      sku: 'PH-XIA-14-256',
      title: 'Смартфон Xiaomi 14 256GB Leica',
      price: 699.5,
      stock: 40,
      cats: ['gadgets', 'electronics'],
    },
    {
      sku: 'TB-APL-PAD-AIR',
      title: 'Планшет Apple iPad Air 11" M2',
      price: 699.0,
      stock: 22,
      cats: ['gadgets', 'computers'],
    },
    {
      sku: 'TB-SAM-TAB-S9',
      title: 'Планшет Samsung Galaxy Tab S9 128GB',
      price: 649.0,
      stock: 18,
      cats: ['gadgets', 'computers'],
    },
    {
      sku: 'WT-APL-W10-46',
      title: 'Смарт-годинник Apple Watch Series 10 46mm',
      price: 449.0,
      stock: 30,
      cats: ['gadgets', 'clothing'],
    },
    {
      sku: 'WT-GAR-FEN-7',
      title: 'Спортивний годинник Garmin Fenix 7 Pro Solar',
      price: 799.99,
      stock: 15,
      cats: ['gadgets'],
    },
    {
      sku: 'AU-APL-PRO-2',
      title: 'Навушники Apple AirPods Pro 2 USB-C',
      price: 249.0,
      stock: 65,
      cats: ['gadgets', 'electronics'],
    },
    {
      sku: 'AU-SON-WH1000',
      title: 'Бездротові навушники Sony WH-1000XM5',
      price: 379.0,
      stock: 28,
      cats: ['electronics', 'gadgets'],
    },

    // 21-30: Аудіо, фото, розваги
    {
      sku: 'AU-JBL-CHG-5',
      title: 'Портативна колонка JBL Charge 5 Black',
      price: 169.0,
      stock: 55,
      cats: ['electronics', 'gadgets'],
    },
    {
      sku: 'AU-MAR-STAN-3',
      title: 'Акустична система Marshall Stanmore III',
      price: 399.0,
      stock: 14,
      cats: ['electronics'],
    },
    {
      sku: 'GM-SON-PS5-SLM',
      title: 'Ігрова консоль Sony PlayStation 5 Slim',
      price: 549.99,
      stock: 20,
      cats: ['electronics'],
    },
    {
      sku: 'GM-MS-XBX-X',
      title: 'Ігрова консоль Microsoft Xbox Series X',
      price: 499.99,
      stock: 16,
      cats: ['electronics'],
    },
    {
      sku: 'GM-NIN-SWT-OLD',
      title: 'Портативна консоль Nintendo Switch OLED',
      price: 349.0,
      stock: 25,
      cats: ['electronics', 'gadgets'],
    },
    {
      sku: 'VR-MET-QST-3',
      title: 'Шолом віртуальної реальності Meta Quest 3 128GB',
      price: 529.0,
      stock: 12,
      cats: ['electronics', 'gadgets'],
    },
    {
      sku: 'CM-DJI-OSM-3',
      title: 'Екшн-камера DJI Osmo Action 4 Standard',
      price: 329.0,
      stock: 20,
      cats: ['electronics', 'gadgets'],
    },
    {
      sku: 'DR-DJI-MINI-4',
      title: 'Квадрокоптер DJI Mini 4 Pro Fly More Combo',
      price: 1099.0,
      stock: 8,
      cats: ['electronics', 'gadgets'],
    },
    {
      sku: 'AU-HYP-CLD-3',
      title: 'Ігрова гарнітура HyperX Cloud III Wireless',
      price: 159.99,
      stock: 35,
      cats: ['computers', 'electronics'],
    },
    {
      sku: 'PC-MIC-ROD-NT',
      title: 'USB-мікрофон Rode NT-USB Mini',
      price: 119.0,
      stock: 24,
      cats: ['electronics', 'computers'],
    },

    // 31-40: Побутова техніка та дім
    {
      sku: 'AP-ROB-DRE-L10',
      title: 'Робот-пилосос Dreame L10s Ultra Gen 2',
      price: 749.0,
      stock: 15,
      cats: ['appliances'],
    },
    {
      sku: 'AP-VAC-DYS-V15',
      title: 'Акумуляторний пилосос Dyson V15 Detect',
      price: 799.99,
      stock: 10,
      cats: ['appliances'],
    },
    {
      sku: 'AP-COF-DEL-MAG',
      title: 'Кавомашина DeLonghi Magnifica S Smart',
      price: 449.0,
      stock: 22,
      cats: ['appliances'],
    },
    {
      sku: 'AP-KTL-XIA-PRO',
      title: 'Електрочайник Xiaomi Smart Kettle Pro 2',
      price: 59.99,
      stock: 45,
      cats: ['appliances'],
    },
    {
      sku: 'AP-GRL-TEF-OPT',
      title: 'Електрогриль Tefal OptiGrill Elite XL',
      price: 289.0,
      stock: 18,
      cats: ['appliances'],
    },
    {
      sku: 'AP-AIR-PHI-XXL',
      title: 'Мультипіч Philips Airfryer XXL Smart',
      price: 239.0,
      stock: 16,
      cats: ['appliances'],
    },
    {
      sku: 'AP-PUR-LEV-400',
      title: 'Очищувач повітря Levoit Core 400S Smart',
      price: 199.0,
      stock: 20,
      cats: ['appliances'],
    },
    {
      sku: 'AP-HUM-BON-700',
      title: 'Зволожувач повітря Boneco W200',
      price: 179.0,
      stock: 25,
      cats: ['appliances'],
    },
    {
      sku: 'AP-MW-PAN-INV',
      title: 'Мікрохвильова піч Panasonic Inverter 27L',
      price: 219.0,
      stock: 14,
      cats: ['appliances'],
    },
    {
      sku: 'AP-BLN-NUT-900',
      title: 'Блендер Nutribullet Pro 900W Matte Black',
      price: 99.9,
      stock: 35,
      cats: ['appliances'],
    },

    // 41-45: Одяг та аксесуари
    {
      sku: 'CL-HOD-NEST-BK',
      title: 'Фірмове худі NestJS Developer Hoodie (Black, L)',
      price: 65.0,
      stock: 50,
      cats: ['clothing'],
    },
    {
      sku: 'CL-TSH-PRIS-WT',
      title: 'Футболка бавовняна Prisma ORM Edition (White, M)',
      price: 29.5,
      stock: 80,
      cats: ['clothing'],
    },
    {
      sku: 'CL-BPK-THU-30L',
      title: 'Міський рюкзак для ноутбука Thule Subterra 30L',
      price: 149.0,
      stock: 30,
      cats: ['clothing', 'computers'],
    },
    {
      sku: 'CL-CAP-VIM-NV',
      title: 'Бейсболка Vim Power User Navy',
      price: 22.0,
      stock: 60,
      cats: ['clothing'],
    },
    {
      sku: 'CL-GLS-GUN-BL',
      title: 'Комп’ютерні захисні окуляри Gunnar Vertex Onyx',
      price: 59.9,
      stock: 40,
      cats: ['clothing', 'computers'],
    },

    // 46-50: Книги та література
    {
      sku: 'BK-CLEAN-CODE',
      title: 'Книга: "Чистий код" — Роберт Мартін',
      price: 35.0,
      stock: 100,
      cats: ['books'],
    },
    {
      sku: 'BK-CLEAN-ARCH',
      title: 'Книга: "Чиста архітектура" — Роберт Мартін',
      price: 38.5,
      stock: 90,
      cats: ['books'],
    },
    {
      sku: 'BK-DD-DESIGN',
      title: 'Книга: "Domain-Driven Design" — Ерік Еванс',
      price: 49.99,
      stock: 65,
      cats: ['books'],
    },
    {
      sku: 'BK-DES-PATTERNS',
      title: 'Книга: "Патерни проєктування GoF"',
      price: 42.0,
      stock: 75,
      cats: ['books'],
    },
    {
      sku: 'BK-TS-ACTION',
      title: 'Книга: "TypeScript у дії" — Борис Черний',
      price: 39.0,
      stock: 85,
      cats: ['books'],
    },
  ];

  const createdProducts = [];
  for (const p of productsRaw) {
    const categoryConnects = p.cats
      .map((slug) => categoriesMap.get(slug))
      .filter((id): id is string => Boolean(id))
      .map((id) => ({ id }));

    const prod = await prisma.product.create({
      data: {
        sku: p.sku,
        title: p.title,
        price: p.price,
        stockQuantity: p.stock,
        categories: {
          connect: categoryConnects,
        },
      },
    });
    createdProducts.push(prod);
  }

  // 4. Створення тестових замовлень (зв'язок 1:N та OrderItem)
  console.log('🛒 Створення тестових замовлень...');
  const ordersData = [
    {
      userIndex: 0,
      status: 'COMPLETED',
      items: [
        { productIndex: 0, quantity: 1 }, // MacBook Pro
        { productIndex: 6, quantity: 1 }, // Клавіатура MX Keys
        { productIndex: 7, quantity: 1 }, // Миша MX Master
      ],
    },
    {
      userIndex: 1,
      status: 'PAID',
      items: [
        { productIndex: 10, quantity: 1 }, // iPhone 16 Pro
        { productIndex: 18, quantity: 1 }, // AirPods Pro
      ],
    },
    {
      userIndex: 2,
      status: 'SHIPPED',
      items: [
        { productIndex: 22, quantity: 1 }, // PS5 Slim
        { productIndex: 28, quantity: 2 }, // HyperX Cloud III x2
      ],
    },
    {
      userIndex: 3,
      status: 'PENDING',
      items: [
        { productIndex: 30, quantity: 1 }, // Робот-пилосос Dreame
        { productIndex: 32, quantity: 1 }, // Кавомашина DeLonghi
      ],
    },
    {
      userIndex: 4,
      status: 'COMPLETED',
      items: [
        { productIndex: 45, quantity: 2 }, // Чистий код x2
        { productIndex: 46, quantity: 1 }, // Чиста архітектура
        { productIndex: 47, quantity: 1 }, // DDD
        { productIndex: 40, quantity: 1 }, // Худі NestJS
      ],
    },
    {
      userIndex: 5,
      status: 'CANCELLED',
      items: [
        { productIndex: 11, quantity: 1 }, // Samsung S24 Ultra
      ],
    },
  ];

  for (const o of ordersData) {
    const user = createdUsers[o.userIndex];
    let total = 0;

    const orderItemsCreate = o.items.map((item) => {
      const prod = createdProducts[item.productIndex];
      const unitPrice = Number(prod.price);
      total += unitPrice * item.quantity;
      return {
        productId: prod.id,
        quantity: item.quantity,
        unitPrice: unitPrice,
      };
    });

    await prisma.order.create({
      data: {
        userId: user.id,
        status: o.status,
        totalAmount: Number(total.toFixed(2)),
        items: {
          create: orderItemsCreate,
        },
      },
    });
  }

  console.log('----------------------------------------------------');
  console.log('🎉 Seeding успішно завершено!');
  console.log(`✅ Створено категорій: ${categoriesMap.size}`);
  console.log(`✅ Створено користувачів: ${createdUsers.length}`);
  console.log(`✅ Створено товарів: ${createdProducts.length}`);
  console.log(`✅ Створено замовлень: ${ordersData.length}`);
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Помилка під час виконання seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
