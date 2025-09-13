#!/bin/bash

# TransactProof Railway Deployment Script for API
set -e

echo "🚀 Deploying TransactProof API to Railway..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30
  }
}
EOF
fi

# Check for required environment variables
echo -e "${BLUE}🔍 Checking environment variables...${NC}"
if ! railway variables | grep -q "JWT_SECRET"; then
    echo -e "${YELLOW}⚠️  JWT_SECRET not found. Setting up environment variables...${NC}"
    echo -e "${BLUE}💡 Running environment setup script...${NC}"
    
    # Run the environment setup script
    ../../scripts/setup-railway-env.sh
    
    echo -e "${YELLOW}📝 Please update the API keys and domain settings before continuing${NC}"
    echo -e "${YELLOW}Press Enter when ready to continue with deployment...${NC}"
    read -r
fi

# Build the application first
echo -e "${BLUE}🔨 Building application...${NC}"
npm run build

# Deploy to Railway
echo -e "${GREEN}🚀 Deploying to Railway...${NC}"
railway up --detach

echo -e "${GREEN}✅ Deployment started successfully!${NC}"
echo -e "${GREEN}🌟 Your API is being deployed to Railway${NC}"
echo ""
echo -e "${YELLOW}📝 Don't forget to:${NC}"
echo -e "   1. Add PostgreSQL database service in Railway dashboard"
echo -e "   2. Set DATABASE_URL: railway variables set DATABASE_URL=\${{PostgreSQL.DATABASE_URL}}"
echo -e "   3. Run database migrations: railway run npx prisma migrate deploy"
echo -e "   4. Update CORS_ORIGIN with your frontend domain"
echo -e "   5. Update API keys with your actual Alchemy keys"
echo ""
echo -e "${BLUE}🔍 To check deployment status: railway status${NC}"
echo -e "${BLUE}📊 To view logs: railway logs${NC}"
