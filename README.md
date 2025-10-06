# TransactProof

Легкий веб-сервис для генерации PDF-квитанций по транзакционным хешам с оплатой в USDT на сети Base.

## Архитектура

- **Frontend**: Next.js + TailwindCSS + wagmi + viem + WalletConnect
- **Backend**: NestJS (Node.js, TypeScript)
- **Auth**: SIWE (EIP-4361), JWT в HttpOnly cookie
- **Chain**: Base mainnet (chainId 8453), Alchemy RPC
- **DB**: PostgreSQL (Supabase) + Prisma
- **Storage**: Supabase Storage / Cloudflare R2
- **PDF**: Puppeteer (HTML→PDF)

## Структура проекта

```
.
├── apps/
│   ├── web/           # Next.js фронтенд
│   └── api/           # NestJS бэкенд
├── packages/
│   ├── ui/            # Общие UI компоненты
│   └── core/          # Общие типы и утилиты
└── infra/             # Docker, миграции, конфигурация
```

## Быстрый старт

### Предварительные требования

- Node.js >= 18
- PostgreSQL
- Docker (опционально)

### Установка

```bash
# Клонировать репозиторий
git clone <repository-url>
cd transactproof

# Установить зависимости
npm install

# Настроить переменные окружения
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Запустить базу данных (Docker)
npm run docker:up

# Запустить миграции
npm run db:migrate

# Запустить разработку
npm run dev
```

### Скрипты

- `npm run dev` - Запуск в режиме разработки
- `npm run build` - Сборка проекта
- `npm run start` - Запуск production сборки
- `npm run lint` - Линтинг кода
- `npm run test` - Запуск тестов
- `npm run docker:up` - Запуск Docker контейнеров
- `npm run docker:down` - Остановка Docker контейнеров

### Локальная разработка на SQLite (упрощённый режим)

Для быстрого старта без локального Postgres можно использовать отдельную SQLite-схему (не для production):

1. В папке `apps/api`: 
   ```bash
   npm run db:sqlite:push
   npm run start:dev:sqlite
   ```
2. Откроется база `prisma/dev.db` (игнорируется в git).
3. Studio для неё: 
   ```bash
   npm run db:sqlite:studio
   ```

Важно:
- Не коммить миграции из SQLite — production использует PostgreSQL и `schema.prisma`.
- Все изменения модели делай в `schema.prisma`, затем при необходимости прогоняй `db:sqlite:push` (он не создаёт миграций, просто синхронизирует).
- Перед созданием production миграций проверяй изменения на Postgres.

## Функциональность

### Основные возможности

1. **Авторизация через кошелек**
   - Sign-In with Ethereum (SIWE EIP-4361)
   - JWT токены в HttpOnly cookies

2. **Генерация чеков**
   - Оплата 0.0000001 ETH на сети Base на сервисный адрес
   - Получение деталей транзакции
   - Генерация PDF чека

3. **Управление чеками**
   - История чеков пользователя
   - Скачивание PDF файлов

4. **Бесплатная первая генерация**
   - Каждый новый пользователь получает 1 бесплатную генерацию PDF
   - Поля в модели `User`:
     - `freeGenerationsRemaining Int @default(1)`
     - `freeUntil DateTime?` (опциональное ограничение по дате промо)
   - Если у пользователя есть доступная бесплатная генерация и срок (если установлен) не истёк — проверка платежа пропускается
   - После успешной генерации счётчик уменьшается на 1
   - Фронтенд автоматически пропускает шаг оплаты и показывает подсказку

### API Endpoints

#### Авторизация
- `GET /auth/nonce` - Получение nonce для подписи
- `POST /auth/verify` - Верификация подписи
- `GET /auth/me` - Профиль пользователя
- `POST /auth/logout` - Выход

#### Чеки
- `POST /receipts/pay-and-generate` - Оплата и генерация чека
- `GET /receipts/my` - Список чеков пользователя
- `GET /receipts/:id` - Получение чека

#### Брендинг PDF
- `GET /receipts/my/branding` — получить сохранённые настройки бренда (companyName, website, logoDataUrl)
- `POST /receipts/my/branding` — сохранить / апдейтить настройки бренда
   - Тело: `{ "companyName?": string (<=80), "website?": string (домен или https URL, <=120), "logoDataUrl?": data:image/(png|jpg|jpeg|svg+xml);base64,... (<=500KB) }`
- `POST /receipts/pay-and-generate` — теперь принимает опционально эти же поля (перекрывают сохранённые на один запрос)

#### Логика при генерации
1. Если в запросе переданы branding-поля → использовать их (и не изменять сохранённые).
2. Иначе если сохранённые есть в таблице `user_branding` → они применяются.
3. Иначе PDF будет без блока кастомного бренда.

#### Ограничения и валидация
| Поле | Ограничение | Примечания |
|------|-------------|------------|
| companyName | ≤ 80 символов | Очищается trim() |
| website | ≤ 120, regex на домен/URL | `https://` префикс не обязателен |
| logoDataUrl | data URL png/jpeg/svg+xml, ≤500KB | Проверяется MIME и размер (base64 длина) |

#### Рекомендации по логотипу
- Используйте PNG с прозрачным фоном ≤ 300x300.
- SVG допустим, но сложные инлайны увеличивают вес.

#### Пример сохранения брендинга
```bash
curl -X POST \
   -H 'Content-Type: application/json' \
   -b 'tp_session=...' \
   -d '{
      "companyName": "TransactProof LLC",
      "website": "https://transactproof.com",
      "logoDataUrl": "data:image/png;base64,iVBORw0KGgoAAA..."
   }' \
   http://localhost:3001/api/receipts/my/branding
```

#### Пример временного override при генерации
```bash
curl -X POST \
   -H 'Content-Type: application/json' \
   -b 'tp_session=...' \
   -d '{
      "txHash": "0xabc...",
      "companyName": "Temp Brand"
   }' \
   http://localhost:3001/api/receipts/pay-and-generate
```

### Frontend брендинг флоу
Хук `usePdfBranding` теперь:
1. Загружает localStorage мгновенно (оптимистично)
2. Пробует подтянуть `/api/receipts/my/branding` и обновляет состояние если там есть данные
3. Любое изменение (update/save/reset) дебаунсится (600мс) и отправляется POST `/api/receipts/my/branding`
4. Поле `loaded` возвращает `true` только после завершения локальной и серверной загрузки, поле `syncing` отражает активную отправку

### Схема хранения брендинга
Модель `UserBranding`:
```prisma
model UserBranding {
   id          String   @id @default(uuid())
   userId      String   @unique @map("user_id")
   companyName String?  @map("company_name") @db.VarChar(80)
   website     String?  @db.VarChar(120)
   logoDataUrl String?  @map("logo_data_url") @db.Text
   createdAt   DateTime @default(now()) @map("created_at")
   updatedAt   DateTime @updatedAt @map("updated_at")
   user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
   @@map("user_branding")
}
```


## Переменные окружения

### Backend (.env)
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/transactproof
JWT_SECRET=your-jwt-secret
ALCHEMY_BASE_RPC=https://base-mainnet.g.alchemy.com/v2/API_KEY
SERVICE_ETH_ADDRESS=0x...
USDT_CONTRACT=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Frontend (.env.local)
```
NEXT_PUBLIC_BASE_CHAIN_ID=8453
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ALCHEMY_ID=your-alchemy-id
```

## Безопасность

- SIWE проверка domain, chainId, временных окон
- JWT с HttpOnly + Secure + SameSite cookies
- Rate limiting на критичных endpoints
- Валидация всех входных данных через zod

## Примечания по оплате

- Бэкенд проверяет входящий перевод ETH (0.0000001 ETH) на ваш сервисный адрес в сети Base.
- Настройте переменные окружения:
  - `SERVICE_ETH_ADDRESS` — адрес получения платежей ETH.
- Для тестовой сети используйте Base Sepolia и соответствующий chainId (`NEXT_PUBLIC_BASE_CHAIN_ID`, `BASE_CHAIN_ID`).

## Лицензия

MIT
