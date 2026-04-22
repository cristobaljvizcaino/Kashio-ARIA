#!/usr/bin/env bash
# Deploy Library Cloud Functions (Gen2) from back/functions/library

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

PROJECT="${PROJECT:-kashio-squad-nova}"
REGION="${REGION:-us-central1}"
RUNTIME="${RUNTIME:-nodejs20}"

cd "${REPO_ROOT}/back/functions/library"

echo "🚀 Deploying ARIA Library Cloud Functions..."
echo ""

echo "📤 1/4: getLibraryFiles..."
gcloud functions deploy getLibraryFiles \
  --gen2 \
  --runtime "${RUNTIME}" \
  --trigger-http \
  --allow-unauthenticated \
  --region "${REGION}" \
  --project "${PROJECT}" \
  --entry-point getLibraryFiles \
  --source . \
  --timeout 60s \
  --memory 256MB

echo ""
echo "📤 2/4: getLibraryUploadUrl..."
gcloud functions deploy getLibraryUploadUrl \
  --gen2 \
  --runtime "${RUNTIME}" \
  --trigger-http \
  --allow-unauthenticated \
  --region "${REGION}" \
  --project "${PROJECT}" \
  --entry-point getLibraryUploadUrl \
  --source . \
  --timeout 60s \
  --memory 256MB

echo ""
echo "📤 3/4: downloadLibraryFile..."
gcloud functions deploy downloadLibraryFile \
  --gen2 \
  --runtime "${RUNTIME}" \
  --trigger-http \
  --allow-unauthenticated \
  --region "${REGION}" \
  --project "${PROJECT}" \
  --entry-point downloadLibraryFile \
  --source . \
  --timeout 60s \
  --memory 256MB

echo ""
echo "📤 4/4: deleteLibraryFile..."
gcloud functions deploy deleteLibraryFile \
  --gen2 \
  --runtime "${RUNTIME}" \
  --trigger-http \
  --allow-unauthenticated \
  --region "${REGION}" \
  --project "${PROJECT}" \
  --entry-point deleteLibraryFile \
  --source . \
  --timeout 60s \
  --memory 256MB

echo ""
echo "✅ All Library Cloud Functions deployed."
