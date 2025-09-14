# Исправление ошибки Puppeteer/Chrome для Railway (Nixpacks)

## Проблема
Ошибка `Could not find Chrome (ver. 131.0.6778.204)` в Railway при использовании Nixpacks.

## Решение для Nixpacks

### 1. Обновленные файлы:

#### `nixpacks.toml` 
- ✅ Правильно настроен Chromium через Nix packages
- ✅ Переменные окружения для Puppeteer
- ✅ Упрощенный start command

#### `railway-start.sh`
- ✅ Новый скрипт запуска для Railway
- ✅ Автоматическое определение пути к Chromium
- ✅ Пошаговый запуск с логированием

#### `apps/api/scripts/check-browser.js`
- ✅ Обновлен для Nixpacks
- ✅ Поиск Chromium в Nix store
- ✅ Улучшенная диагностика

### 2. Railway Settings:

#### Build:
- **Custom Build Command**: `npm run build:api`

#### Deploy:
- **Custom Start Command**: оставьте пустым (использует nixpacks.toml)

### 3. Nixpacks конфигурация:

```toml
[phases.setup]
nixPkgs = ["chromium", "nodejs_18", ...]

[variables]
PUPPETEER_SKIP_DOWNLOAD = "true"

[phases.start]
cmd = "sh ./railway-start.sh"
```

### 4. Как деплоить:

```bash
git add .
git commit -m "fix: configure Puppeteer for Railway Nixpacks"
git push origin dev
```

### 5. Диагностика:

После деплоя проверьте логи Railway:
- ✅ `🔍 Chromium path: /nix/store/.../chromium`
- ✅ `🧪 Testing browser launch...`
- ✅ `✅ Browser test successful`
- ✅ `▶️  Starting application...`

## Отличия от Docker

**Nixpacks** автоматически управляет зависимостями через Nix:
- Chromium устанавливается в `/nix/store/...`
- Путь определяется динамически через `which chromium`
- Не нужно устанавливать системные пакеты вручную

**Преимущества Nixpacks:**
- Быстрее Docker (меньше слоев)
- Автоматическое кэширование
- Детерминистичные сборки