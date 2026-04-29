#!/bin/bash

echo "======================================"
echo "🔢 MIGRACIÓN 011: NUMERACIÓN G2"
echo "======================================"
echo ""
echo "Esta migración agregará numeración a los artefactos"
echo "del Gate 2 para indicar el orden de ejecución:"
echo ""
echo "  1. User Story Map (USM)"
echo "  2. SRS"
echo "  3. SAD"
echo "  4. SDD"
echo ""
echo "📋 Conectando a Cloud SQL..."
echo ""

# Ejecutar migración directamente via Cloud SQL Proxy
gcloud sql connect aria-postgres \
  --user=postgres \
  --database=aria_db \
  --project=kashio-squad-nova << 'EOF'

-- Actualizar nombres de artefactos G2 con numeración
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

-- Mostrar resultado
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

if [ $? -eq 0 ]; then
  echo ""
  echo "======================================"
  echo "✅ MIGRACIÓN 011 COMPLETADA"
  echo "======================================"
  echo ""
  echo "Los artefactos de G2 ahora tienen numeración:"
  echo "  ✓ 1. User Story Map (USM)"
  echo "  ✓ 2. SRS"
  echo "  ✓ 3. SAD"
  echo "  ✓ 4. SDD"
  echo ""
else
  echo ""
  echo "======================================"
  echo "❌ ERROR EN MIGRACIÓN"
  echo "======================================"
  echo ""
  echo "Por favor verifica:"
  echo "  1. Conexión a Cloud SQL"
  echo "  2. Permisos del usuario postgres"
  echo ""
  exit 1
fi

