#!/bin/bash

# Script Final de Setup Cloud Run con Secret Manager
# Ejecutar después de que admin otorgue permisos al secret

echo "🚀 Configurando Cloud Run con Secret Manager..."

# 1. Actualizar Cloud Run para usar el secret
echo "📝 Paso 1: Actualizando Cloud Run para usar Secret Manager..."
gcloud run services update aria-frontend \
  --region us-central1 \
  --clear-env-vars \
  --update-secrets="GEMINI_API_KEY=gemini-api-key:latest" \
  --project kashio-squad-nova

if [ $? -eq 0 ]; then
  echo "✅ Cloud Run actualizado exitosamente"
else
  echo "❌ Error actualizando Cloud Run"
  exit 1
fi

# 2. Verificar que el servicio esté corriendo
echo ""
echo "📊 Paso 2: Verificando estado del servicio..."
SERVICE_URL=$(gcloud run services describe aria-frontend \
  --region us-central1 \
  --project kashio-squad-nova \
  --format="value(status.url)")

echo "✅ Service URL: $SERVICE_URL"

# 3. Test con curl (requiere auth)
echo ""
echo "🧪 Paso 3: Testing servicio..."
echo "Generando token de identidad..."
TOKEN=$(gcloud auth print-identity-token)

echo "Haciendo request al servicio..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$SERVICE_URL")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Servicio respondió exitosamente (HTTP 200)"
else
  echo "⚠️  Servicio respondió con HTTP $HTTP_CODE"
fi

# 4. Mostrar información de acceso
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 ARIA en Cloud Run Configurado!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Service URL: $SERVICE_URL"
echo "🔒 Acceso: Solo usuarios @kashio.us"
echo "🔑 Secret Manager: gemini-api-key (latest)"
echo ""
echo "🌐 Para acceder desde navegador:"
echo "   1. Usa proxy: gcloud run services proxy aria-frontend --region us-central1 --port 8081"
echo "   2. Abre: http://localhost:8081"
echo ""
echo "📊 Para ver logs:"
echo "   gcloud run services logs read aria-frontend --region us-central1 --project kashio-squad-nova"
echo ""
echo "✅ Setup completado!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

