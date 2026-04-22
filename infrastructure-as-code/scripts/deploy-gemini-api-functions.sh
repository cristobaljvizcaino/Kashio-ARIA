#!/usr/bin/env bash
# Deploy Gemini/API Cloud Functions (generateArtifact, analyzeIntake, ariaChat) from back/functions/api

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

PROJECT_ID="${PROJECT_ID:-kashio-squad-nova}"
REGION="${REGION:-us-central1}"

cd "${REPO_ROOT}/back/functions/api"

if [[ ! -d node_modules ]]; then
  echo "📦 npm install..."
  npm install
fi

echo "🚀 Desplegando generateArtifact..."
gcloud functions deploy generateArtifact \
  --gen2 \
  --runtime=nodejs20 \
  --region="${REGION}" \
  --source=. \
  --entry-point=generateArtifact \
  --trigger-http \
  --allow-unauthenticated \
  --project="${PROJECT_ID}"

echo ""
echo "🚀 Desplegando analyzeIntake..."
gcloud functions deploy analyzeIntake \
  --gen2 \
  --runtime=nodejs20 \
  --region="${REGION}" \
  --source=. \
  --entry-point=analyzeIntake \
  --trigger-http \
  --allow-unauthenticated \
  --project="${PROJECT_ID}"

echo ""
echo "🚀 Desplegando ariaChat..."
gcloud functions deploy ariaChat \
  --gen2 \
  --runtime=nodejs20 \
  --region="${REGION}" \
  --source=. \
  --entry-point=ariaChat \
  --trigger-http \
  --allow-unauthenticated \
  --project="${PROJECT_ID}"

echo ""
echo "✅ Cloud Functions API desplegadas."
