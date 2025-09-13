# 🚨 Railway Deployment Fix Guide

## Проблема: JWT_SECRET не определен

Ваше приложение падает с ошибкой `JWT_SECRET is not defined in environment variables`.

## 🔧 Быстрое решение:

### 1. Откройте Railway Dashboard
- Перейдите на [railway.app](https://railway.app)
- Откройте ваш проект TransactProof API

### 2. Добавьте переменные окружения
В разделе **Variables** добавьте следующие переменные:

#### 🔑 Критически важные:
```
JWT_SECRET = your-super-secure-jwt-secret-at-least-32-chars-long
NODE_ENV = production
PORT = 3001
```

#### 📊 Для базы данных:
```
DATABASE_URL = ${PostgreSQL.DATABASE_URL}
```
*Это будет автоматически подставлено когда вы добавите PostgreSQL сервис*

#### 🌐 Для блокчейна (замените на ваши ключи):
```
BASE_CHAIN_ID = 8453
ALCHEMY_BASE_RPC = https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ETHEREUM_RPC_URL = https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
BASE_RPC_URL = https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ARBITRUM_RPC_URL = https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY
OPTIMISM_RPC_URL = https://opt-mainnet.g.alchemy.com/v2/YOUR_API_KEY
POLYGON_RPC_URL = https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

#### 🏗️ Дополнительные:
```
SERVICE_ETH_ADDRESS = 0x0Bba30e56c00eF0D787fF1555F65d7a827e62263
USDT_CONTRACT = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
SIWE_DOMAIN = your-domain.com
CORS_ORIGIN = https://your-frontend-domain.com
THROTTLE_TTL = 60
THROTTLE_LIMIT = 100
SESSION_COOKIE_NAME = tp_session
SESSION_TTL_MIN = 180
```

### 3. Генерация безопасного JWT_SECRET
Используйте один из способов:

**Онлайн генератор:**
- Перейдите на https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
- Выберите 256-bit key
- Скопируйте сгенерированный ключ

**Через терминал (если есть доступ):**
```bash
openssl rand -base64 64
```

**Через Node.js:**
```javascript
require('crypto').randomBytes(64).toString('base64')
```

### 4. Перезапуск деплоя
После добавления переменных:
1. Нажмите **Deploy** в Railway
2. Или просто пушните новый коммит

## 🔍 Проверка работы:

После деплоя проверьте:
1. Логи в Railway должны показать успешный запуск
2. Health check должен отвечать: `https://your-app.railway.app/api/api/health`

## 📋 Checklist:

- [ ] JWT_SECRET установлен (минимум 32 символа)
- [ ] NODE_ENV = production
- [ ] PORT = 3001
- [ ] DATABASE_URL настроен (добавьте PostgreSQL сервис)
- [ ] API ключи Alchemy обновлены
- [ ] CORS_ORIGIN указывает на ваш фронтенд
- [ ] Деплой перезапущен

## 🆘 Если все еще не работает:

1. Проверьте логи деплоя в Railway
2. Убедитесь что все переменные сохранены
3. Попробуйте создать новый деплой
4. Проверьте что в Dockerfile нет синтаксических ошибок

---

💡 **Совет:** Всегда используйте криптографически стойкие секреты для продакшена!