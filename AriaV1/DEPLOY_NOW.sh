#!/bin/bash

echo "🚀 Deploying ARIA - UX/UI Improvements..."
echo ""

# Re-autenticar si es necesario
echo "📝 Verificando autenticación..."
gcloud auth application-default print-access-token > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "⚠️  Necesitas re-autenticar"
  echo "Ejecuta: gcloud auth login"
  exit 1
fi

echo "✅ Autenticación OK"
echo ""

# Deploy
echo "🚀 Desplegando a Cloud Run..."
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
echo "✅ Deployment completado!"
echo ""
echo "🌐 URL: https://aria-frontend-215989210525.us-central1.run.app"
echo ""
echo "📋 Cambios deployados:"
echo "  ✅ Modal de confirmación personalizado (ConfirmModal)"
echo "  ✅ Select con búsqueda (SearchableSelect)"
echo "  ✅ Análisis de ARIA en español"
echo "  ✅ App abierta (sin login)"
echo "  ✅ Sistema limpio (sin datos mock)"
echo "  ✅ Priorización con roadmap 2026-2027"
echo ""

