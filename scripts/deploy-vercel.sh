#!/bin/bash

# TransactProof Vercel Deployment Script
set -e

echo "🚀 Deploying TransactProof Web App to Vercel..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Navigate to web app directory
cd apps/web

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  Production environment file not found${NC}"
    echo "Please create .env.production with your production environment variables"
    exit 1
fi

# Build the application
echo -e "${GREEN}📦 Building application...${NC}"
npm run build

# Deploy to Vercel
echo -e "${GREEN}🌐 Deploying to Vercel...${NC}"
vercel --prod

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌟 Your web application has been deployed to Vercel${NC}"
echo ""
echo -e "${YELLOW}📝 Don't forget to:${NC}"
echo -e "   1. Configure environment variables in Vercel dashboard"
echo -e "   2. Set up custom domain if needed"
echo -e "   3. Configure API endpoint in NEXT_PUBLIC_API_URL"