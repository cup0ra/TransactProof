#!/bin/bash

# TransactProof Railway Deployment Script for API
set -e

echo "🚀 Deploying TransactProof API to Railway..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Check if logged in to Railway
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}🔐 Please log in to Railway...${NC}"
    railway login
fi

# Navigate to API directory
cd apps/api

# Check if railway.json exists
if [ ! -f "railway.json" ]; then
    echo -e "${YELLOW}📝 Creating Railway configuration...${NC}"
    cat > railway.json << EOF
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node dist/main.js",
    "healthcheckPath": "/health"
  }
}
EOF
fi

# Deploy to Railway
echo -e "${GREEN}🚀 Deploying to Railway...${NC}"
railway up

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌟 Your API has been deployed to Railway${NC}"
echo ""
echo -e "${YELLOW}📝 Don't forget to:${NC}"
echo -e "   1. Add PostgreSQL database service in Railway dashboard"
echo -e "   2. Configure environment variables in Railway dashboard"
echo -e "   3. Run database migrations: railway run npm run db:migrate"
echo -e "   4. Update CORS_ORIGIN with your frontend domain"