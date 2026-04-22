#!/usr/bin/env bash
# Deploy using Cloud Build / source build on GCP (sin Docker local).
# Requires Dockerfile at repository root (same image as infrastructure-as-code/docker/Dockerfile).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${REPO_ROOT}"

PROJECT_ID="${PROJECT_ID:-kashio-squad-nova}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-aria-frontend}"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     DEPLOYMENT: ARIA a Google Cloud Run                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Repo: ${REPO_ROOT}"
echo ""

read -p "¿Continuar con el deployment a Cloud Run? (y/n): " -n 1 -r
echo ""
if [[ ! ${REPLY:-} =~ ^[Yy]$ ]]; then
  echo "❌ Deployment cancelado"
  exit 1
fi

echo ""
gcloud auth list
echo ""
gcloud config set project "${PROJECT_ID}"

echo ""
echo "🚀 gcloud run deploy --source . (Cloud Build en GCP)..."
gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 2Gi \
  --cpu 2 \
  --port 8080 \
  --timeout 300 \
  --project "${PROJECT_ID}"

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --format 'value(status.url)')

echo ""
echo "✅ URL: ${SERVICE_URL}"
