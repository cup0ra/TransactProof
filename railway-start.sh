#!/usr/bin/env sh
set -eu

echo "🚀 Starting TransactProof API..."

# Set working directory
cd apps/api

# Find and set Chromium path
export PUPPETEER_EXECUTABLE_PATH="$(which chromium)"
echo "🔍 Chromium path: $PUPPETEER_EXECUTABLE_PATH"

# Run pre-start checks
echo "🔧 Running pre-start checks..."
sh ./scripts/prestart.sh

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy || npx prisma db push --accept-data-loss

# Start the application
echo "▶️  Starting application..."
node dist/main.js