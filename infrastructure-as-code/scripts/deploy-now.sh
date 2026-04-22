#!/usr/bin/env bash
# Quick deploy to Cloud Run with Secret Manager for GEMINI_API_KEY.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${REPO_ROOT}"

echo "🚀 Desplegando a Cloud Run..."
gcloud auth application-default print-access-token >/dev/null 2>&1 || {
  echo "Ejecuta: gcloud auth login"
  exit 1
}

gcloud run deploy aria-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=10 \
  --memory=2Gi \
  --cpu=2 \
  --port=8080 \
  --timeout=300 \
  --set-secrets=GEMINI_API_KEY=gemini-api-key:latest \
  --project kashio-squad-nova

echo ""
echo "✅ Deployment completado."
