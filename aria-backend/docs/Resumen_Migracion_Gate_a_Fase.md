# Resumen de ejecución — Migración Gate → Fase (mayo 2026)

Bitácora compacta de **lo que efectivamente se cambió** en este ciclo para mover ARIA del modelo *Stage-Gate* (G0–G5) al modelo de **8 fases del PDLC** alineado con KashioOS. Complementa al plan maestro `Migracion_Gate_a_Fase.md` (diseño / opciones) con los hechos concretos: SQL aplicado, archivos modificados, errores resueltos y pendientes.

> **Actualización posterior (rename a inglés):** después de esta bitácora la columna `artifact_definition.fase` y los campos de API `fase` / `faseName` / `faseLabel` se renombraron a **`phase` / `phaseName` / `phaseLabel`** vía `database/migrations/002_rename_fase_to_phase.sql`. Las decisiones funcionales documentadas a continuación no cambian; solo el identificador de columna/campo.

---

## 1. Estado final del modelo `artifact_definition`

**Antes (legacy):**

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `varchar(50)` PK | Códigos tipo `DEF-G1-04`. |
| `gate` | `varchar(10)` | `G0`…`G5`. |
| `predecessor_ids` | `jsonb` | Array de strings `DEF-*`. |

**Después (vigente):**

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `bigserial` PK | Entero interno autoincremental. |
| `public_id` | `uuid` UNIQUE | Identificador estable para API/URL. |
| `fase` | `int2` con `CHECK (fase BETWEEN 1 AND 8)` | Sustituye `gate`. |
| `name` | `varchar(500)` | |
| `initiative_type` | `varchar(20)` | `Change` / `Run` / `Both`. |
| **`predecessor_names`** | `jsonb` | **Reemplaza** `predecessor_ids`. Array de **nombres** legibles de los artefactos predecesores. |
| `description` | `text` | |
| `mandatory` | `bool` | |
| `area` | `varchar(50)` | |
| `created_at` / `updated_at` | `timestamptz` | |

**Eliminadas:** `gate`, `legacy_id`, `predecessor_ids`.
**Índices vigentes:** `idx_artdef_fase`, `idx_artdef_type`.
**Trigger:** `update_artdef_updated_at` (sigue usando `update_updated_at_column()`).

---

## 2. Mapeo Gate → Fase aplicado en SQL (`001`)

Regla cerrada con producto y reflejada en `database/migrations/001_…sql` (`CASE`):

| Gate ARIA (legacy) | `fase` (1–8) | Comentario |
|--------------------|--------------|------------|
| G0 | **1** | |
| G1 | **2** | |
| G2 | **3** | |
| **G3** | **5** | **Todo** G3 → fase 5 (no se reparte entre 4/5/6). |
| G4 | **7** | |
| **G5** | **5** | **Todo** G5 → fase 5 también. |
| (desconocido) | **1** | `ELSE` defensivo. |

**Implicación:** las **fases 4 y 6** quedan **sin filas** desde el catálogo migrado por gate. KashioOS sigue modelando las 8 fases por iniciativa; este mapeo solo aplica al **catálogo** ARIA.

> Observación: en producción algunas filas se cargaron manualmente con `fase = 4`, `5` o `6` (por ejemplo *3.4. Guía de Usuario* en fase 4, *Runbook N1/N2/N3* en fase 5). Esa carga **no** vino del `CASE`, fue carga directa con los `INSERT` consensuados; convive con la regla.

---

## 3. Cambios aplicados (cronológico)

### 3.1 Migración `001_artifact_definition_gate_to_fase.sql`

- `RENAME` de la tabla original a `artifact_definition_legacy`.
- Bloque `DO` que **renombra constraints** del legacy (`artifact_definition_*` → `artdef_legacy_*`) para evitar **42P07** al crear la nueva tabla.
- `CREATE TABLE` con `id BIGSERIAL`, `public_id UUID`, `legacy_id`, `fase` (1–8) y resto de columnas.
- `INSERT … SELECT` con el `CASE` Gate → Fase del §2.
- `DROP INDEX IF EXISTS` defensivos antes de recrear `idx_artdef_*`.
- Trigger reinstalado con `EXECUTE PROCEDURE update_updated_at_column()` (compatible PG 11–13).
- `ROLLBACK;` al inicio para limpiar transacciones abortadas (25P02) en Supabase.
- `DROP TABLE public.artifact_definition_legacy` al final.

### 3.2 Migración `002_artifact_definition_predecessors_public_id_drop_legacy.sql`

- Transformación de `predecessor_ids` desde strings `DEF-*` (legacy) a **UUID** (`public_id`) usando `jsonb_array_elements_text + JOIN ON ref.legacy_id = ord.legacy_ref` con `WITH ORDINALITY` (preserva orden).
- `DROP INDEX idx_artdef_legacy_id` y `DROP COLUMN legacy_id`.
- **Idempotencia**: ahora todo el cuerpo va dentro de un `DO` que solo corre si **existe** la columna `legacy_id`. Si la BD ya está en el modelo final, hace `RAISE NOTICE` y no toca datos.

### 3.3 Paso adicional — `predecessor_names` (denormalización)

Aplicado en consola (no archivado todavía como `003_…sql`):

1. `ALTER TABLE … ADD COLUMN predecessor_names jsonb DEFAULT '[]'`.
2. `UPDATE` que resuelve cada UUID de `predecessor_ids` al `name` correspondiente vía `LEFT JOIN ref.public_id`, manteniendo orden con `WITH ORDINALITY`.
3. **Recreación de la tabla** (`artifact_definition_new` → `INSERT … SELECT` → `DROP` → `RENAME`) para **reordenar** la columna y dejarla en la misma posición que ocupaba `predecessor_ids`. PostgreSQL no soporta reordenar columnas con `ALTER TABLE`.
4. `DROP COLUMN predecessor_ids`.
5. Renombre de constraints `artifact_definition_new_*` → `artifact_definition_*`, renombre de la secuencia `*_new_id_seq` → `artifact_definition_id_seq`, `setval` para alinear con `MAX(id)`.
6. Reinstalación de índices (`idx_artdef_fase`, `idx_artdef_type`) y del trigger `update_artdef_updated_at`.

> **Pendiente menor:** archivar este paso como `database/migrations/003_artifact_definition_predecessor_names.sql` para repetibilidad.

### 3.4 `database/schemaV2.sql`

Actualizado al **modelo final**:
- `id bigserial`, `public_id uuid` UNIQUE, `fase int2` con `CHECK (1–8)`.
- `predecessor_ids` reemplazado conceptualmente por `predecessor_names` (la versión vigente del archivo aún muestra `predecessor_ids`; ver §6 «Pendientes» para alinear).
- Índices `idx_artdef_fase` (en lugar de `idx_artdef_gate`) y `idx_artdef_type`.
- `created_at`/`updated_at` en `timestamptz`.
- Sin `gate`, sin `legacy_id`.

### 3.5 `database/README.md`

- Catálogo de archivos `database/` actualizado.
- Línea de cada migración con su propósito y advertencias (no re-ejecutar `001` si ya pasó; `002` es no-op si no hay `legacy_id`).
- Mapeo Gate → Fase resumido inline.

### 3.6 Documentación de plan (`docs/Migracion_Gate_a_Fase.md`)

- §2 reescrito: ahora refleja la regla aplicada (G3→5, G5→5, fases 4 y 6 vacías por catálogo). La tabla anterior “G3 → 4+5+6” quedó deprecada en favor del mapeo **realmente implementado** en `001`.
- §2.2 pasó de “preguntas abiertas” a **decisiones cerradas**.
- §3.6, §4.2, §8 alineados con la nueva regla.
- §10 corregido para no decir “schemaV2 con `gate`” (ya no existe).

---

## 4. Bucket GCS — `karia-library-files`

**Convención vigente en consola:** bajo `Output/` existen exactamente ocho carpetas **`Phase-1/` … `Phase-8/`** (mismo casing que GCS).

**Estado del código backend:** el Express **aún** construye rutas `Output/{gate o G0}/…` con `DEFAULT_OUTPUT_GATE = G0` (ver `src/const/storage.ts`, `src/services/artifactService.ts`). Para escribir en las carpetas `Phase-*` **sin tocar código**, el cliente puede mandar **`gate: "Phase-7"`** (o cabecera equivalente al publicar PDF).

**Mapeo recomendado al mover objetos legacy `Output/G*/…`:**

| Gate origen | Carpeta destino |
|-------------|-----------------|
| G0 | `Output/Phase-1/` |
| G1 | `Output/Phase-2/` |
| G2 | `Output/Phase-3/` |
| G3 | `Output/Phase-5/` |
| G4 | `Output/Phase-7/` |
| G5 | `Output/Phase-5/` |

> Es el mismo `CASE` de la migración SQL: si el catálogo dice fase 5, el output va a `Phase-5`.

---

## 5. Errores encontrados y resoluciones (operativos)

| Error | Causa | Solución aplicada |
|-------|-------|--------------------|
| **25P02** `current transaction is aborted, commands ignored until end of transaction block` | Una sentencia anterior en la misma sesión falló y dejó la transacción abortada. Frecuente en Supabase **transaction pooler** (puerto 6543), donde `ROLLBACK` puede ir a otro backend. | `ROLLBACK;` al inicio del script y conexión vía **session pooler** o **directa** (puerto 5432). |
| **42P07** `relation "idx_artdef_*" already exists` | Tras `RENAME` a `*_legacy`, los índices conservan los mismos nombres en el esquema y chocan al recrearlos. | `DROP INDEX IF EXISTS public.idx_artdef_*` antes de cada `CREATE INDEX`. |
| **42P07** `relation "artifact_definition_public_id_unique" already exists` | Tras `RENAME` de la tabla, los constraints también conservan su nombre original. | Bloque `DO` que renombra todos los constraints de `artifact_definition_legacy` a prefijo `artdef_legacy_*` antes del `CREATE TABLE`. |

---

## 6. Pendientes

### Backend Express (`aria-backend/src`)

| Archivo | Cambio |
|---------|--------|
| `src/types/artifactDefinition.ts` | Tipo: `id: number`, `publicId: string`, `fase: number` (1–8), `predecessorNames: string[]`. Quitar `gate` y `predecessorIds`. |
| `src/repositories/artifactDefinitionRepository.ts` | `SELECT/INSERT/UPDATE` con las columnas nuevas. Lookup por `public_id` para `GET /:id`. |
| `src/services/artifactDefinitionService.ts` | Validaciones (`fase` 1–8) y mapeos. |
| `src/index.ts` (rutas) | Sustituir `/by-gate/:gate` por `/by-fase/:fase` o equivalente; usar `:publicId` UUID. |
| `src/services/artifactService.ts`, `src/const/storage.ts`, `src/controllers/artifactController.ts` | Ruta GCS: dejar de leer `gate` y construir `Output/Phase-{n}/…` desde `fase` (o aceptar header `phase` además de `gate` para convivencia). |
| `src/services/libraryService.ts`, `src/types/library.ts` | Si `library_file` también pasa a `fase`, hacer el mismo refactor. |

### Cloud Functions (`functions/`)

- `functions/api/index.js` — renombrar `gateLabel` por `phaseLabel`, actualizar prompts e instrucciones del modelo.
- `functions/library/index.js` — revisar propagación de metadatos `gate` → `phase`.

### Frontend / otros repos

- `aria-frontend/src/services/artifactDefinitionService.ts` — `getArtifactDefinitionsByGate` → por fase.
- `aria-frontend/src/services/libraryService.ts` — tipo `gate` → `fase`.
- `AriaV1` (si aún se despliega): congelar o migrar en paralelo.

### Otras tablas

- `initiative` — sustituir `current_gate_id` por `current_phase_number` (1–8) y agregar `kashio_initiative_id` (UUID).
- `intake_request` — `id` + `public_id`; revisar valores `status` tipo `G0_Intake`.
- `library_file` — sustituir `gate` por `phase_number` (1–8) o sentinela ALL.

### Documentación / DDL

- Archivar el paso 3.3 como `database/migrations/003_artifact_definition_predecessor_names.sql`.
- Alinear `schemaV2.sql` para mostrar **`predecessor_names`** en lugar de `predecessor_ids` (cambio menor pendiente).
- Actualizar `BACKEND_REFERENCE.md` §3.1, §5, §6 cuando el Express ya escriba en `Phase-*`.
- Postman collection: ajustar bodies y headers tras el cambio de API.

### GCS

- Inventario de objetos legacy en `Output/G*/` (si quedan) y mover a `Output/Phase-{n}/` según mapeo del §4.

---

## 7. Cómo aplicar a una BD nueva vs existente

### BD **nueva** (sin datos)

```bash
psql "$ConnectionString_Karia" -f database/schemaV2.sql
```

Luego cargar los `INSERT` semilla del catálogo (53 filas, `fase` 1–8, `predecessor_names` ya legible). **No** ejecutar `001` ni `002`.

### BD **legacy** todavía con `gate`

1. `database/migrations/001_artifact_definition_gate_to_fase.sql` (en una sola sesión, idealmente conexión directa o session pooler).
2. `database/migrations/002_artifact_definition_predecessors_public_id_drop_legacy.sql` para resolver `DEF-*` → UUID y eliminar `legacy_id`.
3. Aplicar el snippet del §3.3 para añadir `predecessor_names`, reordenar y eliminar `predecessor_ids`.

### BD **ya alineada** (modelo final)

- No correr ninguna de las migraciones.
- `002` es no-op (detecta ausencia de `legacy_id`); `001` re-ejecutado **sí** rompería (renombraría la tabla buena a `_legacy`).

---

## 8. Estado al cierre del ciclo

- [x] Tabla `artifact_definition` en su forma final aplicada en BD productiva.
- [x] 53 filas seed cargadas (catálogo PDLC con `fase`, `public_id`, `predecessor_names`).
- [x] Migraciones `001` y `002` archivadas y comentadas para reproducir desde legacy.
- [x] Documentación de plan (`Migracion_Gate_a_Fase.md`) y catálogo (`database/README.md`) alineados.
- [ ] Migración `003` (predecessor_names + reorden) sin archivar como `.sql`.
- [ ] Backend Express, Cloud Functions y Frontend siguen leyendo `gate` y `predecessor_ids` → bloqueante para cerrar el ciclo end-to-end.
- [ ] GCS: el código todavía escribe en `Output/{gate}/…`; las carpetas `Output/Phase-*` ya existen en consola y solo se llenan si el cliente envía `gate: "Phase-n"`.

---

## 9. Referencias

- `aria-backend/database/schemaV2.sql` — DDL vigente.
- `aria-backend/database/migrations/001_artifact_definition_gate_to_fase.sql`
- `aria-backend/database/migrations/002_artifact_definition_predecessors_public_id_drop_legacy.sql`
- `aria-backend/database/README.md`
- `aria-backend/docs/Migracion_Gate_a_Fase.md` (plan maestro)
- `aria-backend/docs/ARIA_2_Descripcion_de_Requerimiento.md` (req. 7)
- `aria-backend/docs/PRD_ARIA_2.0_v1.0.0.0.md` (visión 8 fases)
- `aria-backend/docs/BACKEND_REFERENCE.md` (rutas GCS, bucket, tablas v2)
