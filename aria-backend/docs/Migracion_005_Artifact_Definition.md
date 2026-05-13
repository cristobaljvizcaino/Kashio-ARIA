# Migración 005 — Reorganización canónica de `artifact_definition`

**Fecha:** 2026-05-12
**Archivo SQL:** `database/migrations/005_artifact_definition_phase_organization.sql`
**Esquema afectado:** `database/schemaV2.sql` (sección `public.artifact_definition`)

**Fuentes canónicas usadas:**

- `docs/inventario_artefactos_aria_markdown.md` (MAI — Master Artifact Inventory v2.1.0.0)
- `docs/Resumen_Documentos_ARIA_v1.0.1.0.md` (cuadro resumen oficial de ARIA por fase)

---

## 1. Propósito

Esta migración deja la tabla `public.artifact_definition` 100 % alineada con el **MAI v2.1.0.0** y con el cuadro resumen `Resumen_Documentos_ARIA_v1.0.1.0.md`.

Cinco cambios de fondo:

1. **Migración del enum `initiative_type`** — pasa del esquema antiguo al nuevo:

   | Antes (V1)         | Ahora (V2 + 005)                        |
   |--------------------|-----------------------------------------|
   | `Run`              | `New_Product` (renombrado, semántica idéntica) |
   | `Change`           | `Change` (sin cambios)                  |
   | `Both`             | `Both` (sin cambios)                    |

   El `CHECK` antiguo `('Change','Run','Both')` se reemplaza por `('Both','Change','New_Product')`.

2. **Nueva columna `product_type` (`jsonb`)** — clasifica el artefacto según el tipo de producto KashioOS al que aplica. Permite múltiples valores por artefacto. Valores admitidos:

   - `Offering`
   - `Sellable`
   - `Non_Sellable`

   Se usa `jsonb` (no `varchar`) porque el MAI permite combinaciones como `["Offering","Sellable","Non_Sellable"]`. Se añade un índice GIN para consultas de contención (`product_type @> '["Sellable"]'`).

3. **Renombre `predecessor_names` → `predecessor_public_ids` (`jsonb`)** — el contenido pasa de **nombres** a **`public_id` (UUID)**. El frontend consume estos UUIDs para resolver el detalle del artefacto predecesor. Se añade un índice GIN sobre la columna para que el `?` operator (contención de UUIDs) sea barato.

4. **Convención de naming `<phase>.<orden>. <nombre canónico>`** — todos los artefactos llevan el prefijo de fase + orden:

   - Phase 2 (5 ítems) → `2.1.`, `2.2.`, … `2.5.`
   - Phase 3 (4 ítems) → `3.1.`, `3.2.`, `3.3.`, `3.4.`
   - Phase 5 (1 ítem)  → `5.1.`
   - **Phase 7 (26 ítems) → `7.01.`, `7.02.`, … `7.26.`** (zero-pad a 2 dígitos para que ordene lexicográficamente).

   Ejemplos: `2.1. PRD (Product Requirements Document)`, `7.01. Product Marketing Strategy`, `7.26. General de Producto (Overview)`.

   Como bonus se añadió `UNIQUE ("name")` para que no entren duplicados con otro orden.

5. **Nueva columna `status` (`int2`)** — define si el artefacto está vigente en el catálogo:

   - `1` → **Activo** (default).
   - `0` → **Inactivo** (queda en BD, pero ya no se considera vigente).

   Restricciones / contratos:

   - `NOT NULL DEFAULT 1` (cualquier `INSERT` que omita el campo crea filas activas).
   - `CHECK (status IN (0, 1))` (no admite otros valores en BD).
   - Se añade índice `idx_artdef_status` (btree) para `WHERE status = …`.
   - El paso de verificación final del script valida que los 36 artefactos quedan con `status = 1` y aborta si no es así.

6. **Repoblado canónico del catálogo** — la tabla se reescribe con los **36 artefactos canónicos** del MAI v2.1.0.0.

> **Convención de idioma:** Sólo los **valores** de `initiative_type` y `product_type` están en inglés (es lo que pidió el negocio). Las áreas, descripciones y nombres conservan el español del MAI.

---

## 2. Estructura final de la tabla

```sql
CREATE TABLE public.artifact_definition (
    id                       bigserial    NOT NULL,
    public_id                uuid         DEFAULT gen_random_uuid() NOT NULL,
    phase                    int2         NOT NULL,           -- 1..8
    name                     varchar(500) NOT NULL,
    initiative_type          varchar(20)  DEFAULT 'Both'::varchar NULL,
    product_type             jsonb        DEFAULT '[]'::jsonb NULL,
    predecessor_public_ids   jsonb        DEFAULT '[]'::jsonb NULL,
    description              text         NULL,
    mandatory                bool         DEFAULT false NULL,
    area                     varchar(50)  DEFAULT 'Producto'::varchar NULL,
    status                   int2         NOT NULL DEFAULT 1, -- 1=Activo, 0=Inactivo
    created_at               timestamptz  DEFAULT now() NULL,
    updated_at               timestamptz  DEFAULT now() NULL,
    CONSTRAINT artifact_definition_pkey            PRIMARY KEY (id),
    CONSTRAINT artifact_definition_public_id_key   UNIQUE (public_id),
    CONSTRAINT artifact_definition_name_key        UNIQUE (name),
    CONSTRAINT artifact_definition_phase_check     CHECK (phase BETWEEN 1 AND 8),
    CONSTRAINT artifact_definition_initiative_type_check CHECK (
        initiative_type IN ('Both', 'Change', 'New_Product')
    ),
    CONSTRAINT artifact_definition_product_type_check CHECK (
        product_type IS NULL OR jsonb_typeof(product_type) = 'array'
    ),
    CONSTRAINT artifact_definition_predecessor_public_ids_check CHECK (
        predecessor_public_ids IS NULL OR jsonb_typeof(predecessor_public_ids) = 'array'
    ),
    CONSTRAINT artifact_definition_status_check CHECK (status IN (0, 1))
);
```

Índices:

- `idx_artdef_phase` (btree por fase)
- `idx_artdef_type` (btree por `initiative_type`)
- `idx_artdef_area` (btree por área)
- `idx_artdef_status` (btree por `status`)
- `idx_artdef_product_type` (**GIN** sobre `product_type` para consultas de contención)
- `idx_artdef_predecessor_public_ids` (**GIN** sobre `predecessor_public_ids` para consultas de contención de UUIDs)

Trigger compartido `update_artdef_updated_at` que mantiene `updated_at` con `update_updated_at_column()`.

---

## 3. Cómo se almacenan los predecesores

A nivel de fila la columna queda así (ejemplo real del catálogo después de la migración):

```jsonc
// Fila: 7.13. Runbook N2
{
  "name": "7.13. Runbook N2",
  "predecessor_public_ids": [
    "5b1f0b6b-2b3a-4d2c-8a4d-15a4ea9a5fbe",  // -> 2.5. Funcionalidades (catalogo)
    "0d9b8b2a-37b4-46f1-b0d1-9ad7d0c9ea11",  // -> 3.4. Flujos (secuencia / BPMN)
    "f3d4f8b7-6f1b-4c5d-aab1-2e3c0c8eb3aa",  // -> 5.1. APIs / Contratos (OpenAPI/AsyncAPI)
    "a1b2c3d4-5678-1234-9abc-deadbeef0001"   // -> 7.04. Runbook N1
  ]
}
```

(Los UUIDs varían por instancia: `gen_random_uuid()` los genera durante la migración. Lo que importa es que cada `predecessor_public_ids[i]` es exactamente el `public_id` de otra fila de `artifact_definition`.)

### Resolución durante la migración (paso 3 del SQL)

El SQL inserta primero los 36 artefactos guardando los **nombres** de los predecesores en `predecessor_public_ids` (uso temporal). Luego, en una sola sentencia, los reemplaza por sus UUIDs:

```sql
WITH resolved AS (
    SELECT
        a.id AS art_id,
        COALESCE(
            (
                SELECT jsonb_agg(p.public_id::text ORDER BY x.ord)
                  FROM jsonb_array_elements_text(a.predecessor_public_ids)
                       WITH ORDINALITY AS x(pred_name, ord)
                  JOIN public.artifact_definition p ON p.name = x.pred_name
            ),
            '[]'::jsonb
        ) AS resolved_ids,
        ...  -- valida que cada referencia exista
    FROM public.artifact_definition a
)
UPDATE public.artifact_definition a
   SET predecessor_public_ids = r.resolved_ids
  FROM resolved r
 WHERE a.id = r.art_id
   AND r.unresolved_count = 0;
```

Si alguna referencia no se puede resolver (typo en un nombre canónico, etc.), el bloque `DO $$ … $$` posterior lanza `RAISE EXCEPTION` y la transacción hace `ROLLBACK`.

### Cómo el frontend usa estos UUIDs

```http
GET /karia-svc/v2/artifact-definitions
```

Devuelve algo como:

```jsonc
{
  "id": 13,
  "publicId": "<UUID de 7.13. Runbook N2>",
  "phase": 7,
  "phaseLabel": "Deployment",
  "name": "7.13. Runbook N2",
  "initiativeType": "Both",
  "productType": ["Offering", "Sellable", "Non_Sellable"],
  "predecessorPublicIds": [
    "<UUID de 2.5>",
    "<UUID de 3.4>",
    "<UUID de 5.1>",
    "<UUID de 7.04>"
  ],
  "...": "..."
}
```

El front, para cada `predecessorPublicIds[i]`, hace `GET /karia-svc/v2/artifact-definitions/:publicId` (o lo resuelve contra el listado completo que ya cacheó) y muestra el detalle del predecesor.

---

## 4. Distribución del catálogo después de la migración

| Fase KashioOS                | Cantidad | Naming                                 |
|------------------------------|:--------:|----------------------------------------|
| Phase 2 — Analysis           |   5      | `2.1.` … `2.5.`                        |
| Phase 3 — Design             |   4      | `3.1.` … `3.4.`                        |
| Phase 5 — Backend Dev        |   1      | `5.1.`                                 |
| Phase 7 — Deployment         |  26      | `7.01.` … `7.26.` (zero-pad 2 dígitos) |
| **Total**                    | **36**   |                                        |

Conteos por `initiative_type`:

| `initiative_type` | Cantidad | Notas |
|-------------------|:--------:|-------|
| `Both`            | 17       | Subconjunto núcleo que se regenera para `New_Product` y `Change` (PRD, USM, SRS, Capacidades, Funcionalidades, SAD, SDD, Arquitectura, Flujos, APIs, COGS, Runbook N1/N2/N3, Quick-start Guide, Casos de Uso, Killswitch & Rollback). |
| `New_Product`     | 19       | Aplican únicamente a iniciativas `New_Product` (comerciales, marketing, training, fichas, etc.). |
| `Change`          | 0        | Hoy ningún artefacto del MAI aplica *sólo* a Change; el valor existe en el `CHECK` para flexibilidad futura. |

Conteos por `product_type` (un artefacto cuenta en cada tipo al que aplique):

| `product_type` | Cantidad |
|----------------|:--------:|
| `Sellable`     | 36       |
| `Offering`     | 22       |
| `Non_Sellable` | 22       |

Estos números coinciden con la sección 4 del `Resumen_Documentos_ARIA_v1.0.1.0.md`.

---

## 5. Mapping `gate` (V1) → `phase` (V2)

Los datos antiguos vivían bajo gates `G0..G5`. Tras esta migración se descartan; el catálogo se reconstruye desde el MAI. Para referencia, así se reasigna cada artefacto del INSERT viejo al MAI canónico:

| ID viejo                              | Nombre antiguo                                  | Nombre nuevo                                                        |
|---------------------------------------|-------------------------------------------------|---------------------------------------------------------------------|
| `DEF-G1-04`                           | 1.1. PRD                                        | `2.1. PRD (Product Requirements Document)`                          |
| `DEF-G2-01`                           | 2.1. (USM) Epics & Release Stories Map          | `2.2. (USM) Epics & Release Stories Map`                            |
| `DEF-G2-02` / `DEF-G2-1771279066404`  | 2.2. SRS / Spec Funcional + NFR                 | `2.3. SRS / Spec Funcional + NFR`                                   |
| `DEF-G2-1771279605061`                | 2.5. Capacidades                                | `2.4. Mapa de Capacidades`                                          |
| `DEF-G2-06` / `DEF-G2-1771279632039`  | 2.6. Funcionalidades                            | `2.5. Funcionalidades (catalogo)`                                   |
| `DEF-G2-03` / `DEF-G2-1771279508222`  | 2.3. SAD                                        | `3.1. SAD`                                                          |
| `DEF-G2-04` / `DEF-G2-1771279569720`  | 2.4. SDD                                        | `3.2. SDD`                                                          |
| `DEF-G2-1771279716602`                | 2.9. Arquitectura                               | `3.3. Arquitectura (C4 + ADRs)`                                     |
| `DEF-G2-08` / `DEF-G2-1771279688069`  | 2.8. Flujos                                     | `3.4. Flujos (secuencia / BPMN)`                                    |
| `DEF-G2-07` / `DEF-G2-1771279663282`  | 2.7. APIs / Contratos                           | `5.1. APIs / Contratos (OpenAPI/AsyncAPI)`                          |
| `DEF-G4-01`                           | 4.1. Product Marketing Strategy                 | `7.01. Product Marketing Strategy`                                  |
| `DEF-G3-02`                           | 3.2. Impacto COGS                               | `7.02. Impacto COGS`                                                |
| *(nuevo, no existía)*                 | —                                               | `7.03. Reportes financieros requeridos`                             |
| `DEF-G3-01`                           | 3.1. Runbook N1                                 | `7.04. Runbook N1`                                                  |
| `DEF-G4-09`                           | 4.9. Manejo de Objeciones                       | `7.05. Manejo de Objeciones`                                        |
| `DEF-G3-04`                           | 3.4. Guía de Usuario                            | `7.06. Guia de Usuario`                                             |
| `DEF-G4-05`                           | 4.5. One-pager                                  | `7.07. One-pager`                                                   |
| `DEF-G4-06`                           | 4.6. Presentación de producto                   | `7.08. Pitch Deck (Presentacion de Producto)`                       |
| `DEF-G4-07`                           | 4.7. Brochure Comercial                         | `7.09. Brochure Producto`                                           |
| `DEF-G4-04`                           | 4.4. Manual de Producto                         | `7.10. Manual de Producto (operacion + reglas)`                     |
| `DEF-G4-02`                           | 4.2. ICP & Segmentos objetivo                   | `7.11. ICP & Segmentos objetivo`                                    |
| `DEF-G4-10`                           | 4.10. Playbook de Ventas                        | `7.12. Playbook de Ventas`                                          |
| `DEF-G3-05`                           | 3.5. Runbook N2                                 | `7.13. Runbook N2`                                                  |
| `DEF-G3-09`                           | 3.9. Exposición de riesgo                       | `7.14. Exposicion de riesgo (financiero/fraude)`                    |
| `DEF-G4-12`                           | 4.12. Quick-start Guide                         | `7.15. Quick-start Guide`                                           |
| `DEF-G4-13`                           | 4.13. How-tos                                   | `7.16. How-tos`                                                     |
| `DEF-G4-11`                           | 4.11. Training                                  | `7.17. Training: Onboarding / Success`                              |
| `DEF-G3-10`                           | 3.10. Documentación Técnica Cliente             | `7.18. Documentacion Tecnica Cliente (Readme/Portal)`               |
| `DEF-G4-08`                           | 4.8. Casos de Uso                               | `7.19. Casos de Uso`                                                |
| *(nuevo, no existía)*                 | —                                               | `7.20. Ficha Funcional`                                             |
| `DEF-G3-06`                           | 3.6. Runbook N3                                 | `7.21. Runbook N3`                                                  |
| `DEF-G3-07`                           | 3.7. Contingencias por rail/territorio          | `7.22. Contingencias por rail/territorio`                           |
| `DEF-G3-08`                           | 3.8. Killswitch & Rollback                      | `7.23. Killswitch & Rollback`                                       |
| `DEF-G3-11`                           | 3.11. Criterios de operación estable            | `7.24. Criterios de operacion estable`                              |
| `DEF-G4-14`                           | 4.14. Checklist de adopción por área            | `7.25. Checklist de adopcion por area`                              |
| `DEF-G4-03`                           | 4.3. General de Producto (Overview)             | `7.26. General de Producto (Overview)`                              |

Filas que **se descartan** porque no aparecen en el MAI v2.1.0.0:

- `DEF-G0-1778274211199` (`Prueba`) — registro de prueba, no canónico.
- `DEF-G0-1772071382199` (`0.1. Benchmark Competitivo`) — insumo externo de Phase 1 (no lo genera ARIA).
- `DEF-G1-01` (`0.2 Intake & Triage Record`) — insumo externo de Phase 1.
- `DEF-G1-02`, `DEF-G1-03` (`Informe de Diseño`, `Visión de Producto`) — insumos externos de Phase 1.
- `DEF-G2-1771278875718` (`USM`) — duplicado del USM canónico (P2.2).
- `DEF-G5-1772071962671` (`PIR`) — Phase 8 (Monitoring), aún no incluido en el MAI canónico para ARIA.
- `DEF-G4-1772215952270`, `DEF-G4-1772667204120`, `DEF-G4-1772670785841`, `DEF-G4-1772670816487`, `DEF-G4-1772670869998`, `DEF-G4-1772670900927` — *Brochures Verticales* y *Offering Collections* (artefactos de habilitación comercial por vertical, fuera del MAI canónico v2.1.0.0).

> Si más adelante se decide reincorporar Brochures Verticales / Offering Collections / PIR, se hace en una migración posterior alineando el MAI primero.

---

## 6. Aplicación

```bash
# 1) (Recomendado) backup previo del catálogo, por si se quiere reinyectar luego.
psql "$ConnectionString_Karia" -c \
  "COPY public.artifact_definition TO STDOUT WITH CSV HEADER" \
  > backup_artifact_definition_pre_005.csv

# 2) Aplicar la migración (DESTRUCTIVA: reemplaza el catálogo).
psql "$ConnectionString_Karia" \
  -f database/migrations/005_artifact_definition_phase_organization.sql

# 3) Verificación rápida.
psql "$ConnectionString_Karia" -c "
  SELECT phase,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE initiative_type = 'Both')        AS both,
         COUNT(*) FILTER (WHERE initiative_type = 'New_Product') AS new_product,
         COUNT(*) FILTER (WHERE initiative_type = 'Change')      AS change
    FROM public.artifact_definition
   GROUP BY phase
   ORDER BY phase;
"

# 4) Spot-check: ver predecessor_public_ids resueltos a UUIDs reales.
psql "$ConnectionString_Karia" -c "
  SELECT name, jsonb_array_length(predecessor_public_ids) AS preds
    FROM public.artifact_definition
   ORDER BY phase, name;
"
```

Resultado esperado del paso 3:

```
 phase | total | both | new_product | change
-------+-------+------+-------------+--------
     2 |     5 |    5 |           0 |      0
     3 |     4 |    4 |           0 |      0
     5 |     1 |    1 |           0 |      0
     7 |    26 |    7 |          19 |      0
```

El propio script lanza `RAISE EXCEPTION` si la cuenta no es exacta (36 totales y la distribución por fase 5 / 4 / 1 / 26) **o si alguna referencia a predecesor no se pudo resolver a un `public_id`**.

---

## 7. Impacto en código backend

Tras esta migración, los servicios que consultan `artifact_definition` deben asumir:

- La columna `gate` ya **no existe** — usar `phase` (int 1..8).
- La columna `predecessor_ids` (V1) y `predecessor_names` (V2 anterior) ya **no existen** — usar `predecessor_public_ids` (jsonb de **UUIDs** = `public_id` de cada predecesor).
- Aparece la columna `product_type` (jsonb array). Tipa como `('Offering' | 'Sellable' | 'Non_Sellable')[]`.
- Aparece la columna `status` (int2). Tipa como `0 | 1` — `1` = activo, `0` = inactivo. Default en BD: `1`.
- Los valores válidos de `initiative_type` ahora son `'Both' | 'Change' | 'New_Product'`. Cualquier consulta o seed que aún use `'Run'` debe actualizarse a `'New_Product'`.

### Cambios aplicados en este repo

Sincronizados en el mismo PR para no romper la API:

| Archivo | Cambio |
|---|---|
| `src/types/artifactDefinition.ts` | `ArtifactInitiativeType = 'Both' \| 'Change' \| 'New_Product'`; nuevo `ArtifactProductType`; rename `predecessorNames` → `predecessorPublicIds`; nuevo campo `productType: ArtifactProductType[]`; nuevo campo `status: ArtifactStatus` (`0 \| 1`); filtros `productType` y `status` en query string. |
| `src/repositories/artifactDefinitionRepository.ts` | `COLUMNS` incluye `product_type`, `predecessor_public_ids` y `status`; `mapRow` los expone (status normalizado a `0 \| 1`); `insert`/`update` aceptan los tres campos (default de `status` = `1` en INSERT); `findPublicIdByRef` reemplaza `findNameByRef` (devuelve UUID); `remove` hace soft-delete (`status = 0`) sin borrar filas ni tocar predecesores; filtros por `productType` (`@>`) y `status` (`=`). |
| `src/services/artifactDefinitionService.ts` | `INITIATIVE_MAP` actualizado; nuevo `PRODUCT_TYPE_MAP`; `resolvePredecessorPublicIds` resuelve UUIDs (acepta `publicId` o `name` exacto y devuelve siempre `publicId`); `parseProductTypeBody`/`parseProductTypeFilter`; `normalizeStatusValue` que admite `1`/`0`, `true`/`false`, `'active'`/`'inactive'`, `'activo'`/`'inactivo'` y normaliza a `0`/`1`. |

Endpoint principal afectado (sólo lectura): `GET /karia-svc/v2/initiatives/:publicId` (devuelve `phases[].artifacts[]` leyendo `artifact_definition` por `phase`). Sigue funcionando sin cambios; los campos nuevos (`productType`, `predecessorPublicIds`, `status`) viajan al front automáticamente vía el `mapRow` actualizado.

### Comportamiento del filtro `status`

`GET /karia-svc/v2/artifact-definitions` admite `?status=1` o `?status=0`. **Si se omite**, el servicio aplica `status = 1` por defecto y lista solo artefactos activos. `GET /karia-svc/v2/artifact-definitions/:publicId` no filtra por estado, por lo que permite consultar artefactos activos o inactivos por su UUID.

Equivalencias aceptadas en `?status=…` y en el body (`POST` / `PATCH`):

| Valor entrante | Persistido en BD |
|---|:---:|
| `1`, `true`, `"true"`, `"active"`, `"activo"` | `1` |
| `0`, `false`, `"false"`, `"inactive"`, `"inactivo"` | `0` |
| Cualquier otro | `400` |

---

## 8. Rollback

La migración es **destructiva** sobre los datos del catálogo. Para volver al estado V1 sería necesario:

1. Restaurar el dump CSV `backup_artifact_definition_pre_005.csv` (o un dump previo del esquema V1).
2. Re-aplicar `database/schemaV1.sql` (sección `artifact_definition`).
3. Reinsertar los datos antiguos.

Como el catálogo ARIA es **regenerable** desde el MAI, el rollback no se considera ruta soportada salvo emergencia.
