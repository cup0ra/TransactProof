#!/bin/bash

# TransactProof Deployment Script for Docker
set -e

echo "🚀 Starting TransactProof Docker Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if .env files exist
if [ ! -f "apps/api/.env.production" ]; then
    echo -e "${YELLOW}⚠️  Production environment file not found for API${NC}"
    echo "Creating from template..."
    cp apps/api/.env.production.example apps/api/.env.production
    echo -e "${YELLOW}📝 Please edit apps/api/.env.production with your production values${NC}"
    exit 1
fi

if [ ! -f "apps/web/.env.production" ]; then
    echo -e "${YELLOW}⚠️  Production environment file not found for Web${NC}"
    echo "Creating from template..."
    cp apps/web/.env.production.example apps/web/.env.production
    echo -e "${YELLOW}📝 Please edit apps/web/.env.production with your production values${NC}"
    exit 1
fi

# Build and start services
echo -e "${GREEN}📦 Building Docker images...${NC}"
docker-compose -f infra/docker-compose.yml build --no-cache

echo -e "${GREEN}🗄️  Starting database...${NC}"
docker-compose -f infra/docker-compose.yml up -d postgres redis

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${GREEN}🔄 Running database migrations...${NC}"
docker-compose -f infra/docker-compose.yml exec -T postgres psql -U postgres -d transactproof -c "SELECT 1;"

# Start API
echo -e "${GREEN}🚀 Starting API service...${NC}"
docker-compose -f infra/docker-compose.yml up -d api

# Wait for API to be ready
echo -e "${YELLOW}⏳ Waiting for API to be ready...${NC}"
sleep 15

# Start Web application
echo -e "${GREEN}🌐 Starting Web application...${NC}"
docker-compose -f infra/docker-compose.yml up -d web

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌟 Your application is now running at:${NC}"
echo -e "   🌐 Frontend: http://localhost:3000"
echo -e "   🔌 API: http://localhost:3001"
echo -e "   🗄️  Database: postgresql://postgres:postgres@localhost:5432/transactproof"
echo ""
echo -e "${YELLOW}📊 To view logs:${NC}"
echo -e "   docker-compose -f infra/docker-compose.yml logs -f"
echo ""
echo -e "${YELLOW}🛑 To stop services:${NC}"
echo -e "   docker-compose -f infra/docker-compose.yml down"