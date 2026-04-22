#!/usr/bin/env bash
# Tras permisos de Secret Manager: asocia el secret GEMINI_API_KEY al servicio Cloud Run.

set -euo pipefail

echo "🚀 Configurando Cloud Run con Secret Manager..."

gcloud run services update aria-frontend \
  --region us-central1 \
  --clear-env-vars \
  --update-secrets="GEMINI_API_KEY=gemini-api-key:latest" \
  --project kashio-squad-nova

SERVICE_URL=$(gcloud run services describe aria-frontend \
  --region us-central1 \
  --project kashio-squad-nova \
  --format="value(status.url)")

echo "✅ Service URL: ${SERVICE_URL}"

TOKEN=$(gcloud auth print-identity-token)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${TOKEN}" \
  "${SERVICE_URL}")

echo "HTTP probe: ${HTTP_CODE}"
