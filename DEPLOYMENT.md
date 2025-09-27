# TransactProof Deployment Guide

## Варианты деплоймента

### 🚀 Быстрый деплоймент (Рекомендуется)

#### 1. Фронтенд на Vercel
```bash
# Установите Vercel CLI
npm install -g vercel

# Деплой фронтенда
./scripts/deploy-vercel.sh
```

#### 2. API на Railway
```bash
# Установите Railway CLI  
npm install -g @railway/cli

# Деплой API
./scripts/deploy-railway.sh
```

#### 3. База данных
- **Supabase**: Бесплатный PostgreSQL с веб-интерфейсом
- **Neon**: Serverless PostgreSQL
- **PlanetScale**: MySQL-совместимая база данных

### 🐳 Docker деплоймент (Полный контроль)

```bash
# Клонируйте репозиторий
git clone https://github.com/your-username/TransactProof.git
cd TransactProof

# Настройте environment файлы
cp apps/api/.env.production.example apps/api/.env.production
cp apps/web/.env.production.example apps/web/.env.production

# Отредактируйте .env файлы под ваши нужды
nano apps/api/.env.production
nano apps/web/.env.production

# Запустите деплоймент
./scripts/deploy-docker.sh
```

### ☁️ VPS/Облачный деплоймент

#### Требования сервера:
- **CPU**: 2+ cores
- **RAM**: 4GB+ 
- **Storage**: 20GB+ SSD
- **OS**: Ubuntu 20.04+ / Debian 11+

#### Настройка сервера:
```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установите Docker Compose
sudo apt install docker-compose-plugin

# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker
```

## 📋 Пошаговая инструкция

### Шаг 1: Подготовка environment переменных

#### API (.env.production):
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Секретный ключ для JWT (минимум 32 символа)
- `ALCHEMY_BASE_RPC`: API ключ от Alchemy для Base network
- `SERVICE_USDT_ADDRESS`: Адрес вашего service контракта
- `CORS_ORIGIN`: URL вашего фронтенда

#### Web (.env.production):
- `NEXT_PUBLIC_API_URL`: URL вашего API
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Project ID от WalletConnect
- `NEXT_PUBLIC_SERVICE_ADDRESS`: Адрес service контракта

### Шаг 2: Настройка базы данных

#### Supabase (Рекомендуется):
1. Создайте проект на [supabase.com](https://supabase.com)
2. Скопируйте Database URL из Settings > Database
3. Добавьте URL в `DATABASE_URL` в .env.production

#### Локальный PostgreSQL:
```bash
# Установите PostgreSQL
sudo apt install postgresql postgresql-contrib

# Создайте базу данных
sudo -u postgres createdb transactproof
sudo -u postgres createuser --interactive transactproof_user
```

### Шаг 3: Получение API ключей

#### Alchemy:
1. Регистрируйтесь на [alchemy.com](https://alchemy.com)
2. Создайте новое приложение для Base network
3. Скопируйте API ключ

#### WalletConnect:
1. Создайте проект на [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Скопируйте Project ID

### Шаг 4: Деплоймент

#### Вариант A: Vercel + Railway (Простой)
```bash
# Фронтенд на Vercel
cd apps/web
vercel --prod

# API на Railway
cd ../api
railway login
railway up
```

#### Вариант B: Docker на VPS (Полный контроль)
```bash
# На вашем сервере
git clone https://github.com/your-username/TransactProof.git
cd TransactProof

# Настройте .env файлы
nano apps/api/.env.production
nano apps/web/.env.production

# Запустите
./scripts/deploy-docker.sh
```

### Шаг 5: Миграция базы данных
```bash
# Для Railway
railway run npm run db:migrate

# Для Docker
docker-compose -f infra/docker-compose.yml exec api npm run db:migrate

# Для VPS с прямым доступом к БД
cd apps/api && npm run db:migrate
```

## 🔐 Безопасность

### Обязательные настройки:
- [ ] Смените все секретные ключи в production
- [ ] Настройте CORS только для ваших доменов  
- [ ] Используйте HTTPS для всех соединений
- [ ] Настройте rate limiting
- [ ] Регулярно обновляйте зависимости

### Рекомендуемые настройки:
- [ ] Настройте мониторинг (Sentry, LogRocket)
- [ ] Используйте CDN для статических файлов
- [ ] Настройте автоматические бэкапы БД
- [ ] Добавьте health checks

## 🔧 Troubleshooting

### Частые проблемы:

#### API не запускается:
```bash
# Проверьте логи
docker-compose -f infra/docker-compose.yml logs api

# Проверьте подключение к БД
docker-compose -f infra/docker-compose.yml exec api npm run db:status
```

#### Проблемы с CORS:
- Проверьте `CORS_ORIGIN` в API
- Убедитесь что `NEXT_PUBLIC_API_URL` правильный

#### Ошибки миграции БД:
```bash
# Сбросьте и пересоздайте БД (ВНИМАНИЕ: удаляет данные!)
npx prisma migrate reset
npx prisma migrate deploy
```

## 📊 Мониторинг

### Проверка статуса:
```bash
# Docker
docker-compose -f infra/docker-compose.yml ps

# Health checks
curl http://your-api-domain.com/api/health
curl http://your-frontend-domain.com/api/health
```

### Логи:
```bash
# API логи
docker-compose -f infra/docker-compose.yml logs -f api

# Web логи  
docker-compose -f infra/docker-compose.yml logs -f web
```

## 🚀 CI/CD (Опционально)

Создайте GitHub Actions для автоматического деплоймента:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи сервисов
2. Убедитесь что все environment переменные настроены
3. Проверьте подключение к базе данных
4. Создайте issue в GitHub репозитории
