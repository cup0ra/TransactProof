FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install --production=false

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && npm run build

# List files to debug
RUN echo "=== DEBUG: Listing build results ===" && \
    find . -name "main.js" -type f && \
    ls -la && \
    ls -la ../ 2>/dev/null || echo "No parent directory"

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Create uploads directory
RUN mkdir -p uploads && chown -R nestjs:nodejs .

# Remove dev dependencies for smaller image
RUN npm prune --production

USER nestjs

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
# Try different paths for main.js
CMD ["sh", "-c", "node dist/main.js || node ../dist/main.js || ls -la && echo 'main.js not found'"]