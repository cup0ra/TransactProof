FROM node:18-alpine

# Install necessary packages
RUN apk add --no-cache dumb-init openssl

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy all source code
COPY . .

# Build the application
RUN npm run build

# Verify build
RUN echo "=== Build Verification ===" && \
    pwd && \
    echo "Current directory contents:" && \
    ls -la && \
    echo "Dist directory contents:" && \
    ls -la dist/ && \
    echo "Main.js check:" && \
    test -f dist/main.js && echo "✅ Found dist/main.js" || echo "❌ Missing dist/main.js"

# Create uploads directory
RUN mkdir -p uploads

# Clean up dev dependencies
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=3001

ENTRYPOINT ["dumb-init", "--"]

# Simple startup with debugging
CMD ["sh", "-c", "echo 'Starting container...' && pwd && ls -la dist/ && node dist/main.js"]