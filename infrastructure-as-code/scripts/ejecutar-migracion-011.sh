#!/usr/bin/env bash
# Migración puntual G2 (esquema antiguo con tablas artifact / portfolio_initiative).
# Solo ejecutar si tu instancia sigue usando ese modelo de datos.

set -euo pipefail

echo "======================================"
echo "🔢 MIGRACIÓN 011: NUMERACIÓN G2"
echo "======================================"
echo ""

gcloud sql connect aria-postgres \
  --user=postgres \
  --database=aria_db \
  --project=kashio-squad-nova << 'EOF'

UPDATE artifact
SET name = '1. User Story Map (USM)'
WHERE gate = 'G2' AND (name = 'User Story Map (USM)' OR name LIKE '%User Story Map%');

UPDATE artifact
SET name = '2. SRS'
WHERE gate = 'G2' AND name = 'SRS';

UPDATE artifact
SET name = '3. SAD'
WHERE gate = 'G2' AND name = 'SAD';

UPDATE artifact
SET name = '4. SDD'
WHERE gate = 'G2' AND name = 'SDD';

SELECT 
  pi.name AS initiative_name,
  a.name AS artifact_name,
  a.category,
  a.status
FROM artifact a
JOIN portfolio_initiative pi ON a.initiative_id = pi.id
WHERE a.gate = 'G2'
ORDER BY pi.name, a.name;

\q
EOF

echo ""
echo "✅ MIGRACIÓN 011 finalizada (si la conexión y el esquema coinciden)."
