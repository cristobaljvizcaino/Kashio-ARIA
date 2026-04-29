# ============================================
# Stage 1: build de la aplicación (Vite + React)
# (Misma forma que kbatch: node alpine + npm ci)
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================
# Stage 2: servir con Nginx
# (mismo patrón que kbatch: nginx:alpine, 8080, /health)
# ============================================
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

# kbatch: define nginx con RUN printf. Aquí ARIA mantiene nginx.conf (CSP, /api/, caché estáticos, etc.)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ============================================
# Runtime: MSAL (Cloud Run inyecta IT-ARIA_*; mismo criterio que kbatch/IT-KBATCH_*)
# ============================================
ENV IT-ARIA_MSAL_CLIENT_ID=""
ENV IT-ARIA_MSAL_AUTHORITY=""

# Script de arranque: genera config.js desde printenv (mismo patrón que kbatch).
# Las comillas simples del printf protegen el `$`; NO usar `$$` (eso queda como PID y rompe el script).
RUN printf '#!/bin/sh\n\
set -eu\n\
CLIENT_ID=$(printenv "IT-ARIA_MSAL_CLIENT_ID" 2>/dev/null || echo "")\n\
AUTHORITY=$(printenv "IT-ARIA_MSAL_AUTHORITY" 2>/dev/null || echo "")\n\
cat > /usr/share/nginx/html/config.js <<EOF\n\
// Generado al arranque del contenedor (IT-ARIA_* en Cloud Run)\n\
window.aria_msal_config = {"clientId":"$CLIENT_ID","authority":"$AUTHORITY"};\n\
EOF\n' > /docker-entrypoint.d/99-generate-config.sh \
    && chmod +x /docker-entrypoint.d/99-generate-config.sh

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
