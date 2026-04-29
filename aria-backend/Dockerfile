# ARIA Backend - API Express (Cloud Run)
# Build context: this repository root
#
#   docker build -t aria-backend .
#
FROM node:18-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY index.js ./index.js
COPY db.js ./db.js

# Healthcheck against /health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["node", "index.js"]
