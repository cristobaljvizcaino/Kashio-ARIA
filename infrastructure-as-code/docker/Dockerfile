# Canonical definition; repository root /Dockerfile duplicates this for `gcloud run deploy --source .`
#
# ARIA Cloud Run: Vite build + Express (library/GCS + /api/db/*)
# Build context: repository root (Kashio-ARIA)
#
#   docker build -f infrastructure-as-code/docker/Dockerfile -t aria-frontend .
#
# ========================================
# Stage 1: Build Frontend
# ========================================
FROM node:18-alpine AS builder

WORKDIR /app

COPY front/mfe-aria-portal/package*.json ./
RUN npm ci

COPY front/mfe-aria-portal/ ./

ENV NODE_ENV=production
RUN npm run build

# ========================================
# Stage 2: Production Server
# ========================================
FROM node:18-alpine

WORKDIR /app

COPY back/aria-svc/package*.json ./
RUN npm install

COPY back/aria-svc/index.js ./index.js
COPY back/aria-svc/db.js ./db.js

COPY --from=builder /app/dist ./dist

HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["node", "index.js"]
