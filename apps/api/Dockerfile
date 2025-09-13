FROM node:18-alpine

# Install necessary packages (Chromium for Puppeteer) and tools
RUN apk add --no-cache \
    dumb-init \
    openssl \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

WORKDIR /app

# Environment for Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production \
    PORT=3001

# Copy root package files first for better caching (monorepo)
COPY package*.json ./

# Install dependencies (root)
RUN npm ci

# Copy Prisma schema into the API workspace and generate client
COPY apps/api/prisma ./apps/api/prisma/
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma

# Copy repository (monorepo)
COPY . .

# Build only the API package
WORKDIR /app/apps/api
RUN npm run build

# Verify build
RUN echo "=== Build Verification ===" && \
    pwd && \
    echo "Current directory contents:" && \
    ls -la && \
    echo "Dist directory contents:" && \
    ls -la dist/ && \
    echo "Main.js check:" && \
    test -f dist/main.js && echo "✅ Found dist/main.js" || (echo "❌ Missing dist/main.js" && exit 1)

# Create uploads directory
RUN mkdir -p /app/apps/api/uploads && chown -R 1001:1001 /app/apps/api/uploads

# Clean up dev dependencies (run from repo root)
WORKDIR /app
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]

# Start API
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
