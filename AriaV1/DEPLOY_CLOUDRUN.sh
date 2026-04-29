#!/bin/bash

# Script de Deployment a Google Cloud Run - ARIA
# Fecha: 2026-02-13
# Plataforma: Google Cloud Run (GCP)

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     DEPLOYMENT: ARIA a Google Cloud Run                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Variables
PROJECT_ID="kashio-squad-nova"
REGION="us-central1"
SERVICE_NAME="aria-frontend"
GEMINI_API_KEY="AIzaSyDBSsjUgYdsbkje53F8LKrhbYZXxa4uGi8"

cd /Users/jules/Kashio/ARIA

echo "📋 Cambios a desplegar:"
echo ""
echo "  🔧 Gemini Fallback Strategy:"
echo "     ✓ src/services/geminiService.ts"
echo "     ✓ functions/api/index.js"
echo "     ✓ Modelos: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash"
echo ""
echo "  🎨 ARIA Generation UI Improvements:"
echo "     ✓ src/views/Generation.tsx"
echo "     ✓ Modal de configuración"
echo "     ✓ Vista de lista con columnas"
echo "     ✓ Versionado múltiple"
echo "     ✓ Historial de versiones"
echo "     ✓ Datos del Intake en G0"
echo ""
echo "  📦 Deployment Target:"
echo "     ✓ Platform: Google Cloud Run"
echo "     ✓ Project: $PROJECT_ID"
echo "     ✓ Region: $REGION"
echo "     ✓ Service: $SERVICE_NAME"
echo ""

# Confirmar
read -p "¿Continuar con el deployment a Cloud Run? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Deployment cancelado"
    exit 1
fi

echo ""
echo "🔐 Paso 1: Verificando autenticación en GCP..."
gcloud auth list

echo ""
echo "📦 Paso 2: Configurando proyecto..."
gcloud config set project $PROJECT_ID
echo "✅ Proyecto configurado: $PROJECT_ID"

echo ""
echo "🔨 Paso 3: Building imagen Docker localmente..."
echo "   (Esto puede tomar 3-5 minutos...)"

docker build \
  --build-arg GEMINI_API_KEY=$GEMINI_API_KEY \
  -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  -t gcr.io/$PROJECT_ID/$SERVICE_NAME:$(git rev-parse --short HEAD) \
  .

if [ $? -eq 0 ]; then
    echo "✅ Docker build exitoso"
else
    echo "❌ Error en Docker build"
    exit 1
fi

echo ""
echo "📤 Paso 4: Pushing imagen a Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:$(git rev-parse --short HEAD)

if [ $? -eq 0 ]; then
    echo "✅ Push exitoso a GCR"
else
    echo "❌ Error en push a GCR"
    exit 1
fi

echo ""
echo "🚀 Paso 5: Deploying a Cloud Run..."
echo "   Service: $SERVICE_NAME"
echo "   Region: $REGION"
echo "   Image: gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"
echo ""

gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 2Gi \
  --cpu 2 \
  --port 8080 \
  --timeout 300 \
  --project $PROJECT_ID

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment exitoso a Cloud Run!"
else
    echo "❌ Error en deployment a Cloud Run"
    exit 1
fi

echo ""
echo "📊 Paso 6: Obteniendo información del servicio..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --format 'value(status.url)')

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              DEPLOYMENT COMPLETADO                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Frontend desplegado en Cloud Run:"
echo "   → URL: $SERVICE_URL"
echo "   → Service: $SERVICE_NAME"
echo "   → Region: $REGION"
echo "   → Project: $PROJECT_ID"
echo ""
echo "✅ Backend (Cloud Functions):"
echo "   → generateArtifact: https://us-central1-$PROJECT_ID.cloudfunctions.net/generateArtifact"
echo "   → analyzeIntake: https://us-central1-$PROJECT_ID.cloudfunctions.net/analyzeIntake"
echo "   → ariaChat: https://us-central1-$PROJECT_ID.cloudfunctions.net/ariaChat"
echo ""
echo "📊 Verificación:"
echo "   1. Abre: $SERVICE_URL"
echo "   2. Prueba ARIA Generation:"
echo "      - Crear nueva iniciativa"
echo "      - Ir a Gate 0 → Ver datos del intake"
echo "      - Configurar y generar artefacto"
echo "      - Ver historial de versiones"
echo ""
echo "🔍 Monitoreo:"
echo "   - Cloud Run Console: https://console.cloud.google.com/run?project=$PROJECT_ID"
echo "   - Logs: https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
echo "   - Metrics: https://console.cloud.google.com/monitoring?project=$PROJECT_ID"
echo ""
echo "📝 Commit desplegado: $(git rev-parse --short HEAD)"
echo "   $(git log -1 --pretty=%B | head -n 1)"
echo ""
echo "🎉 ¡Deployment completado exitosamente!"
echo ""

# Opcional: Abrir en navegador
read -p "¿Abrir ARIA en el navegador? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    open $SERVICE_URL
fi

