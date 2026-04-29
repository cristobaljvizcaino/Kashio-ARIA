#!/bin/bash

# Script para mostrar el comando de push
# Ejecuta esto en tu terminal

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         DEPLOYMENT ARIA - Cloud Run                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "✅ TODO está listo para deployment!"
echo ""
echo "📦 Commits preparados:"
git log origin/main..HEAD --oneline 2>/dev/null || echo "   (ver git log para detalles)"
echo ""
echo "🎯 EJECUTA ESTE COMANDO:"
echo ""
echo "   git push origin main"
echo ""
echo "📊 Luego monitorea en:"
echo "   https://console.cloud.google.com/cloud-build/builds?project=kashio-squad-nova"
echo ""
echo "⏱️  Tiempo estimado: 5 minutos"
echo ""
echo "✨ URL final: https://aria-frontend-215989210525.us-central1.run.app"
echo ""

