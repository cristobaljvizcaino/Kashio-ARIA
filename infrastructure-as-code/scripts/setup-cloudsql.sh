#!/usr/bin/env bash
# Instrucciones y rutas para aplicar el schema en Cloud SQL.
# Los SQL canónicos viven en database/migrations/

PROJECT_ID="${PROJECT_ID:-kashio-squad-nova}"
INSTANCE_NAME="${INSTANCE_NAME:-aria-db}"
DB_NAME="${DB_NAME:-aria}"
DB_USER="${DB_USER:-aria-user}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

MIG_001="${REPO_ROOT}/database/migrations/001_initial_schema.sql"
MIG_002="${REPO_ROOT}/database/migrations/002_aria_current_schema.sql"

echo "🚀 Setup Cloud SQL — referencia de migraciones"
echo "================================================================"
echo ""
echo "Proyecto: ${PROJECT_ID}"
echo "Instancia: ${INSTANCE_NAME}"
echo "Base: ${DB_NAME}"
echo ""
echo "📄 Archivos SQL en el repo:"
echo "   ${MIG_001}"
echo "   ${MIG_002}"
echo ""
echo "⚠️  Aplicar en orden según el estado de tu base (v1 → v2)."
echo ""
echo "🔹 Cloud Shell / psql:"
echo "   gcloud sql connect ${INSTANCE_NAME} --user=${DB_USER} --database=${DB_NAME} --project=${PROJECT_ID}"
echo "   # Luego pega el contenido de los .sql o:"
echo "   # gcloud sql connect ... < \"${MIG_001}\""
echo ""
echo "📍 Connection name (Cloud Run + Unix socket):"
echo "   ${PROJECT_ID}:us-central1:${INSTANCE_NAME}"
echo ""
