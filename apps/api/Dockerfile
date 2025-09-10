FROM node:18-alpine

# Install necessary packages
RUN apk add --no-cache dumb-init openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (needed for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build application
RUN npx prisma generate && \
    npm run build && \
    echo "=== Build verification ===" && \
    ls -la && \
    ls -la dist/ && \
    test -f dist/main.js && echo "✅ main.js found at $(pwd)/dist/main.js" || echo "❌ main.js missing"

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Create uploads directory with proper permissions
RUN mkdir -p uploads && \
    chown -R nestjs:nodejs /app

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application with explicit path verification
CMD ["sh", "-c", "echo 'Starting app from:' && pwd && ls -la dist/ && node dist/main.js"]