#!/bin/bash

# Script para desplegar la corrección de modelos Gemini
# Fecha: 2026-02-12
# Descripción: Actualiza modelos deprecados a modelos funcionales con fallback

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     DEPLOYMENT: Gemini Fallback Strategy Fix             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Variables
PROJECT_ID="kashio-squad-nova"
REGION="us-central1"

echo "📋 Resumen de cambios:"
echo "  ✓ Modelos actualizados:"
echo "    - gemini-2.5-flash (primario)"
echo "    - gemini-2.5-pro (fallback #1)"
echo "    - gemini-2.0-flash (fallback #2)"
echo ""
echo "  ✓ Archivos modificados:"
echo "    - src/services/geminiService.ts (frontend)"
echo "    - functions/api/index.js (backend)"
echo "    - docs/GEMINI_API_SETUP.md"
echo "    - README.md"
echo ""

# Confirmar
read -p "¿Deseas continuar con el deployment? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Deployment cancelado"
    exit 1
fi

echo ""
echo "🚀 Paso 1: Verificando Cloud Functions..."
cd functions/api

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

echo ""
echo "🚀 Paso 2: Desplegando Cloud Functions..."

# Deploy generateArtifact
echo ""
echo "  → Desplegando generateArtifact..."
gcloud functions deploy generateArtifact \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=generateArtifact \
  --trigger-http \
  --allow-unauthenticated \
  --project=$PROJECT_ID

# Deploy analyzeIntake
echo ""
echo "  → Desplegando analyzeIntake..."
gcloud functions deploy analyzeIntake \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=analyzeIntake \
  --trigger-http \
  --allow-unauthenticated \
  --project=$PROJECT_ID

# Deploy ariaChat
echo ""
echo "  → Desplegando ariaChat..."
gcloud functions deploy ariaChat \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=ariaChat \
  --trigger-http \
  --allow-unauthenticated \
  --project=$PROJECT_ID

cd ../..

echo ""
echo "🚀 Paso 3: Desplegando Frontend a Vercel..."
git add .
git commit -m "fix: Actualizar modelos Gemini con estrategia de fallback (gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash)"
git push origin main

echo ""
echo "✅ DEPLOYMENT COMPLETADO"
echo ""
echo "📍 Endpoints actualizados:"
echo "  - https://us-central1-$PROJECT_ID.cloudfunctions.net/generateArtifact"
echo "  - https://us-central1-$PROJECT_ID.cloudfunctions.net/analyzeIntake"
echo "  - https://us-central1-$PROJECT_ID.cloudfunctions.net/ariaChat"
echo ""
echo "🧪 Para probar:"
echo "  1. Ve a la aplicación ARIA"
echo "  2. Intenta generar un artefacto"
echo "  3. Verifica los logs en consola para ver qué modelo responde"
echo ""
echo "📊 Monitoreo:"
echo "  Cloud Functions Logs: https://console.cloud.google.com/functions/list?project=$PROJECT_ID"
echo "  Vercel Dashboard: https://vercel.com/arleygutierrez-5018s-projects/aria-control-center"
echo ""

