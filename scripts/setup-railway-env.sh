#!/bin/bash

# TransactProof Railway Environment Variables Setup Script
set -e

echo "🔧 Setting up environment variables for Railway deployment..."

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

# Generate a secure JWT secret if not provided
JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 64 | tr -d '\n')}

echo -e "${BLUE}📝 Setting up environment variables...${NC}"

# Required environment variables for production
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set SESSION_COOKIE_NAME=tp_session
railway variables set SESSION_TTL_MIN=180

# Blockchain Configuration
railway variables set BASE_CHAIN_ID=8453

# You'll need to replace these with your actual API keys
echo -e "${YELLOW}⚠️  Please update these with your actual API keys:${NC}"
railway variables set ALCHEMY_BASE_RPC="https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"
railway variables set ETHEREUM_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"
railway variables set BASE_RPC_URL="https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"
railway variables set ARBITRUM_RPC_URL="https://arb-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"
railway variables set OPTIMISM_RPC_URL="https://opt-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"
railway variables set POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"

# Smart Contracts (update with your actual addresses)
railway variables set SERVICE_ETH_ADDRESS="0x0Bba30e56c00eF0D787fF1555F65d7a827e62263"
railway variables set USDT_CONTRACT="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"

# SIWE Configuration
railway variables set SIWE_DOMAIN="your-domain.com"

# Rate Limiting
railway variables set THROTTLE_TTL=60
railway variables set THROTTLE_LIMIT=100

# CORS (update with your actual frontend domain)
railway variables set CORS_ORIGIN="https://your-frontend-domain.com"

echo -e "${GREEN}✅ Basic environment variables set successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "   1. Add PostgreSQL database in Railway dashboard"
echo -e "   2. Update DATABASE_URL with the PostgreSQL connection string"
echo -e "   3. Update API keys with your actual Alchemy keys"
echo -e "   4. Update SIWE_DOMAIN with your actual domain"
echo -e "   5. Update CORS_ORIGIN with your frontend domain"
echo ""
echo -e "${BLUE}🔧 To set DATABASE_URL after adding PostgreSQL:${NC}"
echo -e "   railway variables set DATABASE_URL=\${{PostgreSQL.DATABASE_URL}}"
echo ""
echo -e "${GREEN}🚀 Ready to deploy with: railway up${NC}"