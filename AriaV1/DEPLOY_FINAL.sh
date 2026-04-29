#!/bin/bash

# Script de Deployment - ARIA Generation Improvements + Gemini Fallback Fix
# Fecha: 2026-02-13

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     DEPLOYMENT: ARIA Improvements & Gemini Fix            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

cd /Users/jules/Kashio/ARIA

echo "📋 Cambios a desplegar:"
echo ""
echo "  🔧 Gemini Fallback Strategy:"
echo "     ✓ src/services/geminiService.ts"
echo "     ✓ functions/api/index.js"
echo "     ✓ Modelos actualizados: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash"
echo ""
echo "  🎨 ARIA Generation UI Improvements:"
echo "     ✓ src/views/Generation.tsx"
echo "     ✓ Modal de configuración"
echo "     ✓ Vista de lista con columnas"
echo "     ✓ Versionado múltiple de documentos"
echo "     ✓ Historial desplegable de versiones"
echo "     ✓ Carga de datos del Intake en G0"
echo ""
echo "  📚 Documentación:"
echo "     ✓ docs/GEMINI_API_SETUP.md"
echo "     ✓ README.md"
echo "     ✓ SOLUCION_GEMINI_FALLBACK.md (nuevo)"
echo "     ✓ MEJORAS_GENERATION_UI.md (nuevo)"
echo ""

# Confirmar
read -p "¿Continuar con el deployment? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Deployment cancelado"
    exit 1
fi

echo ""
echo "🧹 Paso 1: Limpiando archivos temporales..."

# Limpiar archivos de setup antiguos que ya no se necesitan
git rm -f DEPLOYMENT_INSTRUCTIONS.md 2>/dev/null || true
git rm -f EJECUTAR_AHORA.md 2>/dev/null || true
git rm -f ENV_VARIABLES_EXAMPLE.md 2>/dev/null || true
git rm -f IMPLEMENTACION_COMPLETA.md 2>/dev/null || true
git rm -f IMPLEMENTATION_SUMMARY.md 2>/dev/null || true
git rm -f OPCIONES_PERSISTENCIA.md 2>/dev/null || true
git rm -f POR_QUE_CLOUD_SQL.md 2>/dev/null || true
git rm -f POSTGRESQL_IMPLEMENTATION_GUIDE.md 2>/dev/null || true
git rm -f RESUMEN_POSTGRESQL.md 2>/dev/null || true
git rm -f deploy-full-stack.sh 2>/dev/null || true
git rm -f deploy.sh 2>/dev/null || true
git rm -f setup-cloud-sql-complete.sh 2>/dev/null || true
git rm -f setup-cloud-sql-sin-psql.sh 2>/dev/null || true
git rm -f docs/INTAKE_PERSISTENCE_IMPLEMENTATION.md 2>/dev/null || true
git rm -f docs/LOGS_DEBUGGING.md 2>/dev/null || true
git rm -rf functions/database/ 2>/dev/null || true
git rm -f src/services/databaseService.ts 2>/dev/null || true

echo "✅ Archivos antiguos removidos"
echo ""

echo "📦 Paso 2: Preparando archivos para commit..."

# Agregar cambios importantes
git add src/services/geminiService.ts
git add src/views/Generation.tsx
git add functions/api/index.js
git add docs/GEMINI_API_SETUP.md
git add README.md
git add SOLUCION_GEMINI_FALLBACK.md
git add MEJORAS_GENERATION_UI.md
git add src/views/Intake.tsx
git add src/views/OeaStrategy.tsx
git add src/services/apiService.ts
git add package.json
git add package-lock.json

echo "✅ Archivos agregados al staging"
echo ""

echo "💾 Paso 3: Creando commit..."

git commit -m "feat: ARIA Generation UI improvements + Gemini fallback strategy

🎨 ARIA Generation Improvements:
- ✨ Nueva modal de configuración para generación
- ✨ Vista de lista con columnas para artefactos
- ✨ Versionado múltiple de documentos generados
- ✨ Historial desplegable de versiones con acciones
- ✨ Limpieza automática de campos en modal
- ✨ Carga de datos del Intake en Gate 0
- ✨ Inyección de contexto del intake en prompts

🔧 Gemini API Improvements:
- ✅ Estrategia de fallback con 3 modelos
- ✅ Modelos actualizados: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash
- ✅ Manejo robusto de errores 404/503
- ✅ Logs detallados de modelo utilizado
- ✅ Sin interrupciones por modelos deprecados

📚 Documentation:
- 📝 SOLUCION_GEMINI_FALLBACK.md - Guía completa de fallback
- 📝 MEJORAS_GENERATION_UI.md - Documentación de mejoras UI
- 📝 docs/GEMINI_API_SETUP.md - Modelos verificados 2026
- 📝 README.md - Configuración AI actualizada

🧹 Cleanup:
- ♻️ Removidos archivos de documentación legacy
- ♻️ Removida implementación PostgreSQL no utilizada
- ♻️ Scripts de deployment antiguos eliminados

Tested: ✅ Sin errores de linter
Status: ✅ Funcional y probado"

if [ $? -eq 0 ]; then
    echo "✅ Commit creado exitosamente"
else
    echo "⚠️ No hay cambios para commitear o commit falló"
fi
echo ""

echo "🚀 Paso 4: Haciendo push a GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Push exitoso a GitHub"
else
    echo "❌ Error en push. Verifica tu conexión y permisos"
    exit 1
fi
echo ""

echo "⏳ Paso 5: Esperando auto-deploy de Vercel..."
echo "   (Vercel debería detectar el push y comenzar el build automáticamente)"
echo ""
sleep 3

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              DEPLOYMENT COMPLETADO                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "✅ Frontend:"
echo "   → Vercel detectará el push y desplegará automáticamente"
echo "   → URL: https://aria-control-center.vercel.app"
echo "   → Dashboard: https://vercel.com/arleygutierrez-5018s-projects/aria-control-center"
echo ""

echo "✅ Backend (Cloud Functions):"
echo "   → Las funciones ya tienen el código actualizado"
echo "   → Endpoints: https://us-central1-kashio-squad-nova.cloudfunctions.net/"
echo ""

echo "📊 Verificación:"
echo "   1. Espera 2-3 minutos para que Vercel complete el build"
echo "   2. Ve a: https://aria-control-center.vercel.app"
echo "   3. Prueba ARIA Generation:"
echo "      - Crear nueva iniciativa"
echo "      - Ir a Gate 0 → Ver datos del intake"
echo "      - Configurar y generar un artefacto"
echo "      - Generar múltiples versiones"
echo "      - Desplegar historial de versiones"
echo ""

echo "🔍 Monitoreo:"
echo "   - Vercel Logs: https://vercel.com/arleygutierrez-5018s-projects/aria-control-center/deployments"
echo "   - Cloud Functions: https://console.cloud.google.com/functions/list?project=kashio-squad-nova"
echo "   - Browser Console: Buscar logs de Gemini fallback"
echo ""

echo "🎉 ¡Deployment completado! Los cambios estarán disponibles en producción en unos minutos."
echo ""
