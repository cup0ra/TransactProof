#!/bin/bash

# TransactProof Railway Deployment Script for Web
set -e

echo "🚀 Deploying TransactProof Web to Railway..."

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

# Navigate to web directory
cd apps/web

# Check for required environment variables
echo -e "${BLUE}🔍 Checking environment variables...${NC}"
if ! railway variables | grep -q "NEXT_PUBLIC_API_URL"; then
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_API_URL not found. Setting up environment variables...${NC}"
    
    # Set basic environment variables for web
    railway variables set NODE_ENV=production
    railway variables set PORT=3000
    railway variables set NEXT_PUBLIC_API_URL="https://your-api-domain.railway.app"
    
    echo -e "${YELLOW}📝 Please update NEXT_PUBLIC_API_URL with your actual API domain${NC}"
    echo -e "${YELLOW}Press Enter when ready to continue with deployment...${NC}"
    read -r
fi

# Build the application first
echo -e "${BLUE}🔨 Building application...${NC}"
npm run build

# Deploy to Railway
echo -e "${GREEN}🚀 Deploying to Railway...${NC}"
railway up --detach

echo -e "${GREEN}✅ Web deployment started successfully!${NC}"
echo -e "${GREEN}🌟 Your Web App is being deployed to Railway${NC}"
echo ""
echo -e "${YELLOW}📝 Don't forget to:${NC}"
echo -e "   1. Update NEXT_PUBLIC_API_URL with your actual API domain"
echo -e "   2. Configure any other environment variables needed"
echo -e "   3. Set up custom domain if needed"
echo ""
echo -e "${BLUE}🔍 To check deployment status: railway status${NC}"
echo -e "${BLUE}📊 To view logs: railway logs${NC}"