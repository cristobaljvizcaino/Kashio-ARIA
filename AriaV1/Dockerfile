# ========================================
# Stage 1: Build Frontend
# ========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
ENV NODE_ENV=production
RUN npm run build

# ========================================
# Stage 2: Production Server
# ========================================
FROM node:18-alpine

WORKDIR /app

# Copy server code and install dependencies
COPY server/package*.json ./
RUN npm install

COPY server/index.js ./index.js
COPY server/db.js ./db.js

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["node", "index.js"]
