#!/usr/bin/env bash
# Build image locally and deploy to Cloud Run (Docker on your machine).
# Run from anywhere; uses repository root for build context.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${REPO_ROOT}"

PROJECT_ID="${PROJECT_ID:-kashio-squad-nova}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-aria-frontend}"
DOCKERFILE="${DOCKERFILE:-infrastructure-as-code/docker/Dockerfile}"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     DEPLOYMENT: ARIA a Google Cloud Run                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Repo: ${REPO_ROOT}"
echo "Dockerfile: ${DOCKERFILE}"
echo ""

read -p "¿Continuar con el deployment a Cloud Run? (y/n): " -n 1 -r
echo ""
if [[ ! ${REPLY:-} =~ ^[Yy]$ ]]; then
  echo "❌ Deployment cancelado"
  exit 1
fi

echo ""
echo "🔐 Verificando autenticación en GCP..."
gcloud auth list

echo ""
echo "📦 Configurando proyecto..."
gcloud config set project "${PROJECT_ID}"

echo ""
echo "🔨 Building imagen Docker..."
docker build \
  -f "${DOCKERFILE}" \
  -t "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest" \
  -t "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:$(git rev-parse --short HEAD 2>/dev/null || echo local)" \
  .

echo ""
echo "📤 Pushing imagen a GCR..."
docker push "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"
docker push "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:$(git rev-parse --short HEAD 2>/dev/null || echo local)"

echo ""
echo "🚀 Deploying a Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest" \
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
