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

## Функциональность

### Основные возможности

1. **Авторизация через кошелек**
   - Sign-In with Ethereum (SIWE EIP-4361)
   - JWT токены в HttpOnly cookies

2. **Генерация чеков**
   - Оплата 1 USDT на Base
   - Получение деталей транзакции
   - Генерация PDF чека

3. **Управление чеками**
   - История чеков пользователя
   - Скачивание PDF файлов

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

## Переменные окружения

### Backend (.env)
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/transactproof
JWT_SECRET=your-jwt-secret
ALCHEMY_BASE_RPC=https://base-mainnet.g.alchemy.com/v2/API_KEY
SERVICE_USDT_ADDRESS=0x...
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

## Лицензия

MIT