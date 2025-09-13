# Railway Deployment Guide for TransactProof API

## Quick Start

1. **Setup Environment Variables**
   ```bash
   ./scripts/setup-railway-env.sh
   ```

2. **Deploy to Railway**
   ```bash
   ./scripts/deploy-railway.sh
   ```

## Manual Environment Variables Setup

If you prefer to set variables manually, use Railway CLI:

### Required Variables

```bash
# Application
railway variables set NODE_ENV=production
railway variables set PORT=3001

# JWT Authentication (CRITICAL - generate a secure secret)
railway variables set JWT_SECRET="$(openssl rand -base64 64 | tr -d '\n')"
railway variables set SESSION_COOKIE_NAME=tp_session
railway variables set SESSION_TTL_MIN=180

# Database (set after adding PostgreSQL service)
railway variables set DATABASE_URL='${{PostgreSQL.DATABASE_URL}}'

# Blockchain Configuration
railway variables set BASE_CHAIN_ID=8453

# Network RPC URLs (replace with your actual Alchemy API keys)
railway variables set ALCHEMY_BASE_RPC="https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
railway variables set ETHEREUM_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
railway variables set BASE_RPC_URL="https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
railway variables set ARBITRUM_RPC_URL="https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
railway variables set OPTIMISM_RPC_URL="https://opt-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
railway variables set POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY"

# Smart Contracts (update with your mainnet addresses)
railway variables set SERVICE_ETH_ADDRESS="0x0Bba30e56c00eF0D787fF1555F65d7a827e62263"
railway variables set USDT_CONTRACT="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"

# Domain Configuration
railway variables set SIWE_DOMAIN="your-domain.com"
railway variables set CORS_ORIGIN="https://your-frontend-domain.com"

# Rate Limiting
railway variables set THROTTLE_TTL=60
railway variables set THROTTLE_LIMIT=100
```

## Post-Deployment Steps

1. **Add PostgreSQL Database**
   - Go to Railway dashboard
   - Add PostgreSQL service
   - The DATABASE_URL will be automatically available as `${{PostgreSQL.DATABASE_URL}}`

2. **Run Database Migrations**
   ```bash
   railway run npx prisma migrate deploy
   ```

3. **Verify Deployment**
   ```bash
   railway logs
  curl https://your-app.railway.app/api/health
   ```

## Troubleshooting

### JWT_SECRET Error
If you see "JWT_SECRET is not defined", ensure you've set it:
```bash
railway variables set JWT_SECRET="$(openssl rand -base64 64 | tr -d '\n')"
```

### Database Connection Issues
Ensure DATABASE_URL is set correctly:
```bash
railway variables set DATABASE_URL='${{PostgreSQL.DATABASE_URL}}'
```

### Check Environment Variables
```bash
railway variables
```

### View Logs
```bash
railway logs
```

## Security Notes

- Always use a strong, randomly generated JWT_SECRET for production
- Never commit real API keys to version control
- Use environment variables for all sensitive configuration
- Regularly rotate API keys and secrets

## Railway CLI Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Check status
railway status

# View variables
railway variables

# Set variable
railway variables set KEY=value

# Deploy
railway up

# View logs
railway logs

# Connect to database
railway connect
```

### Puppeteer / Chromium issues
If PDF generation fails on Railway, ensure your Docker image (or Nixpacks config) installs system Chromium and that env var `PUPPETEER_EXECUTABLE_PATH` points to it (Dockerfile in `apps/api` already does this). Also verify `NODE_ENV=production` and that server has permission to write `/app/apps/api/uploads`.
