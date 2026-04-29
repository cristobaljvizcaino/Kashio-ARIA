#!/bin/bash

echo "🚀 Deploying ARIA Library Cloud Functions..."
echo ""

PROJECT="kashio-squad-nova"
REGION="us-central1"
RUNTIME="nodejs20"

cd functions/library

echo "📤 1/4: Deploying getLibraryFiles..."
gcloud functions deploy getLibraryFiles \
  --gen2 \
  --runtime $RUNTIME \
  --trigger-http \
  --allow-unauthenticated \
  --region $REGION \
  --project $PROJECT \
  --entry-point getLibraryFiles \
  --source . \
  --timeout 60s \
  --memory 256MB

echo ""
echo "📤 2/4: Deploying getLibraryUploadUrl..."
gcloud functions deploy getLibraryUploadUrl \
  --gen2 \
  --runtime $RUNTIME \
  --trigger-http \
  --allow-unauthenticated \
  --region $REGION \
  --project $PROJECT \
  --entry-point getLibraryUploadUrl \
  --source . \
  --timeout 60s \
  --memory 256MB

echo ""
echo "📤 3/4: Deploying downloadLibraryFile..."
gcloud functions deploy downloadLibraryFile \
  --gen2 \
  --runtime $RUNTIME \
  --trigger-http \
  --allow-unauthenticated \
  --region $REGION \
  --project $PROJECT \
  --entry-point downloadLibraryFile \
  --source . \
  --timeout 60s \
  --memory 256MB

echo ""
echo "📤 4/4: Deploying deleteLibraryFile..."
gcloud functions deploy deleteLibraryFile \
  --gen2 \
  --runtime $RUNTIME \
  --trigger-http \
  --allow-unauthenticated \
  --region $REGION \
  --project $PROJECT \
  --entry-point deleteLibraryFile \
  --source . \
  --timeout 60s \
  --memory 256MB

echo ""
echo "✅ All Cloud Functions deployed successfully!"
echo ""
echo "🔗 Function URLs:"
echo "  - https://us-central1-$PROJECT.cloudfunctions.net/getLibraryFiles"
echo "  - https://us-central1-$PROJECT.cloudfunctions.net/getLibraryUploadUrl"
echo "  - https://us-central1-$PROJECT.cloudfunctions.net/downloadLibraryFile"
echo "  - https://us-central1-$PROJECT.cloudfunctions.net/deleteLibraryFile"

