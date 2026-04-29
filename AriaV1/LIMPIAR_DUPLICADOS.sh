#!/bin/bash

# Script para limpiar initiatives duplicadas en PostgreSQL
# Ejecutar cuando estés listo

echo "🧹 LIMPIEZA DE INITIATIVES DUPLICADAS"
echo "====================================="
echo ""
echo "Problema encontrado:"
echo "  • 'Reconciliación Inteligente': 4 copias"
echo "  • 3 generadas por ARIA (INIT-XXX) - DUPLICADOS"
echo "  • 1 original del portafolio (IDPRD-004) - MANTENER"
echo ""
echo "Esta limpieza eliminará:"
echo "  ❌ INIT-1770816660565"
echo "  ❌ INIT-1770763762962"
echo "  ❌ INIT-1770763706110"
echo "  ✅ IDPRD-004 (se mantiene)"
echo ""

read -p "¿Continuar con la limpieza? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Limpieza cancelada"
    exit 0
fi

echo ""
echo "🗑️ Eliminando duplicados..."
echo ""

export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
export PGPASSWORD="AriaKashio2026SecureDB"

gcloud sql connect aria-postgres --user=postgres --database=aria_db --project=kashio-squad-nova << 'EOF'
-- Limpiar artifacts y destinations de initiatives duplicadas
DELETE FROM artifact_destination 
WHERE artifact_id IN (
  SELECT id FROM artifact WHERE initiative_id LIKE 'INIT-%'
);

DELETE FROM artifact
WHERE initiative_id LIKE 'INIT-%';

-- Eliminar initiatives generadas por ARIA
DELETE FROM portfolio_initiative
WHERE id LIKE 'INIT-%';

-- Verificar
SELECT 'Limpieza completada' as status,
       (SELECT COUNT(*) FROM portfolio_initiative) as initiatives_restantes,
       (SELECT COUNT(DISTINCT name) FROM portfolio_initiative) as nombres_unicos;

-- Mostrar lo que queda
SELECT id, name, portfolio FROM portfolio_initiative ORDER BY name;

\q
EOF

echo ""
echo "✅ Limpieza completada"
echo ""
echo "Ahora debes:"
echo "  1. Recargar /generation"
echo "  2. Verificar que no hay duplicados"
echo ""

