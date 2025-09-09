#!/bin/bash

# Database Migration and Seeding Script for Production
set -e

echo "🗄️  Setting up TransactProof Database..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable is not set${NC}"
    echo "Please set DATABASE_URL to your PostgreSQL connection string"
    exit 1
fi

echo -e "${GREEN}📋 Database URL: ${DATABASE_URL}${NC}"

# Navigate to API directory
cd apps/api

# Generate Prisma client
echo -e "${GREEN}🔧 Generating Prisma client...${NC}"
npx prisma generate

# Run database migrations
echo -e "${GREEN}🔄 Running database migrations...${NC}"
npx prisma migrate deploy

# Check if we should seed the database
if [ "$SEED_DATABASE" = "true" ]; then
    echo -e "${GREEN}🌱 Seeding database...${NC}"
    npm run db:seed
else
    echo -e "${YELLOW}⚠️  Skipping database seeding (set SEED_DATABASE=true to enable)${NC}"
fi

echo -e "${GREEN}✅ Database setup completed successfully!${NC}"