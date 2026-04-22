#!/usr/bin/env bash
# Limpieza puntual de initiatives duplicadas (esquema antiguo portfolio_initiative / artifact).
# Requiere: export PGPASSWORD='<tu_password>' antes de ejecutar.

set -euo pipefail

: "${PGPASSWORD:?Exporta PGPASSWORD con la contraseña de postgres para esta instancia}"

echo "🧹 LIMPIEZA DE INITIATIVES DUPLICADAS"
echo "====================================="
echo ""

read -p "¿Continuar con la limpieza? (y/n) " -n 1 -r
echo ""

if [[ ! ${REPLY:-} =~ ^[Yy]$ ]]; then
  echo "Limpieza cancelada"
  exit 0
fi

gcloud sql connect aria-postgres --user=postgres --database=aria_db --project=kashio-squad-nova << 'EOF'
DELETE FROM artifact_destination 
WHERE artifact_id IN (
  SELECT id FROM artifact WHERE initiative_id LIKE 'INIT-%'
);

DELETE FROM artifact
WHERE initiative_id LIKE 'INIT-%';

DELETE FROM portfolio_initiative
WHERE id LIKE 'INIT-%';

SELECT 'Limpieza completada' as status,
       (SELECT COUNT(*) FROM portfolio_initiative) as initiatives_restantes,
       (SELECT COUNT(DISTINCT name) FROM portfolio_initiative) as nombres_unicos;

SELECT id, name, portfolio FROM portfolio_initiative ORDER BY name;

\q
EOF

echo ""
echo "✅ Script finalizado."
