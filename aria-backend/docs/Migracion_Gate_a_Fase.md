# Migración de Gate a Fase (PDLC KashioOS)

Documento de diseño y checklist para sustituir el modelo **Stage-Gate** (G0–G5) por las **ocho fases del PDLC** definidas en KashioOS, alineado con `ARIA_2_Descripcion_de_Requerimiento.md`, el PRD ARIA 2.0 y el esquema vigente en `database/schemaV2.sql`.

> **Nota de título:** si en reuniones apareció “migración de Git a fase”, el alcance funcional descrito corresponde a **Gate → Fase** (gobierno documental por fase del PDLC), no a Git.

> **Actualización mayo 2026 — naming en inglés:** la columna `artifact_definition.fase` y los campos de API `fase` / `faseName` / `faseLabel` se renombraron a **`phase` / `phaseName` / `phaseLabel`** para alinear todo el backend en inglés. La regla operativa Gate→Fase de §2 sigue vigente; donde este documento dice `fase` léase **`phase`** en código, schema y API. Migración SQL: `database/migrations/002_rename_fase_to_phase.sql`.

---

## 1. Objetivo

1. **Deprecar por completo** el uso de *gates* como eje de organización (bucket, SQL, APIs y prompts que hablen de “gate”).
2. **Adoptar 8 fases** coherentes con KashioOS: Research, Analysis, Design, Frontend Development, Backend Development, Testing, Deployment, Monitoring.
3. **Modelar la dimensión “fase”** de forma alineada a KashioOS (**`phaseNumber` 1–8**) en configuración de artefactos y librería, **sin duplicar** el estado del PDLC que ya vive en KashioOS (ver §2.3).
4. **Normalizar identificadores:** cada entidad principal expone un **`public_id`** estable (APIs, URLs, GCS metadata) y un **`id` entero autoincremental** interno (joins, índices).

---

## 2. Mapa conceptual Gate → Fase

Hay dos niveles que no conviene mezclar:

1. **Estado del PDLC por iniciativa** en KashioOS sigue siendo **`currentPhase` 1–8** y el array **`phases[]`** con las ocho fases del producto (Research … Monitoring). Eso no se redefine aquí.

2. **Catálogo `artifact_definition` al migrar desde la columna legacy `gate` (G0–G5)** en ARIA: la regla **implementada** en `database/migrations/001_artifact_definition_gate_to_fase.sql` es la siguiente (mayo 2026, decisión de producto explícita):

| Gate ARIA (legacy `gate`) | `fase` en `artifact_definition` (1–8) | Notas |
|----------------------------|----------------------------------------|--------|
| G0 | **1** | |
| G1 | **2** | |
| G2 | **3** | |
| G3 | **5** | **Todos** los artefactos que estaban en Gate 3 van a **fase 5** únicamente. No hay reparto entre fases 4, 5 y 6 en esta migración. |
| G4 | **7** | |
| G5 | **5** | **Todos** los de Gate 5 también a **fase 5** (misma fase que G3 en el catálogo). |
| (desconocido) | **1** | `ELSE` defensivo en el `CASE` SQL. |

**Fases 4 y 6 vacías (por ahora):** al ejecutar solo el backfill desde `gate` según la tabla anterior, **no** se inserta ninguna definición en **fase 4** ni en **fase 6**. KashioOS puede seguir usando las fases 4 y 6 para el avance de iniciativas; el catálogo ARIA no las puebla desde G3/G5 con esta regla. Si en el futuro se reparten artefactos a 4 o 6, será una migración o seed nueva, no el `CASE` actual de `001`.

> **Req. 7 / PRD:** pueden describir una correspondencia “ideal” Gate 3 ↔ varias fases KashioOS (p. ej. reparto conceptual Build → Frontend / Backend / Testing). La **migración SQL vigente** prioriza simplicidad operativa: **un solo destino (fase 5) para todo G3 y todo G5** y fases 4 y 6 sin filas desde gates hasta nueva decisión.

### 2.1 Contrato real API KashioOS — payload de iniciativa

Los ejemplos siguientes son el cuerpo útil bajo `data` cuando se consulta una iniciativa en KashioOS (tanto **NEW_PRODUCT** como **CHANGE**). ARIA debe tratarlos como **fuente de verdad** para fase y tipificación, no inferir gates.

**Campos clave comunes**

| Campo KashioOS | Tipo / ejemplo | Uso en ARIA |
|----------------|----------------|-------------|
| `id` | UUID | Identificador global de la iniciativa en KashioOS (cache local, trazabilidad, joins hacia “shadow” o lectura en caliente). |
| `code` | `INI2026-047` | Código humano; útil en nombres de archivo y UI. |
| `title`, `description`, `successMetric`, `status`, `quarter`, `product`, `team`, … | varios | Contexto de generación documental; no sustituyen el modelo de fases. |
| `initiativeType` | `NEW_PRODUCT` \| `CHANGE` | Mapea la matriz de artefactos (sustituye Run/Change legacy; alinear con Offering / Sellable / Non-Sellable en el PRD cuando exista en API). |
| `currentPhase` | entero **1–8** | **Fase activa** declarada por KashioOS (ej. NP en fase 2; Change en fase 1). Es el valor más simple para filtrar “qué documentos aplica ahora”. |
| `phases` | array de longitud **8** | Una fila por `phaseNumber` 1…8; cada elemento tiene su propio **`id` UUID** (instancia de fase **por iniciativa**), `status` (`PENDING` \| `IN_PROGRESS` \| `COMPLETED`), fechas `enteredAt` / `completedAt`, metadatos opcionales (`goal`, `inputDesc`, `outputDesc`, `tool`) y `deliverables`. |

**Diferencias observadas entre tipos**

- **NEW_PRODUCT:** suele incluir `intakeOrigin` (referencia al intake, p. ej. `code` `REQ-2026-013`); `currentPhase` puede estar adelantada respecto a Change (ejemplo: fase 2 con fase 1 ya `COMPLETED`).
- **CHANGE:** `intakeOrigin` puede ser `null`; `repoUrl` / `repoLinks` suelen venir poblados; `currentPhase` a menudo arranca en **1**.

**Qué dimensionar en ARIA sin duplicar KashioOS**

- KashioOS ya entrega **`currentPhase`** y el detalle por fase en **`phases[]`** (incluido UUID de instancia). Eso es la **verdad operativa** del avance del PDLC.
- En ARIA solo hace falta una **clave estable compartida** con KashioOS: el entero **`phaseNumber` 1–8**. Con eso basta para `artifact_definition`, prefijos en GCS y filtros, siempre que los **nombres amigables** (Research, Analysis, …) vivan en **un solo lugar** no duplicado con KashioOS: ver §2.3.
- Para **trazabilidad fina** (auditoría, futuros entregables): opcionalmente persistir **`kashio_phase_instance_id`** = `phases[].id` donde `phases[].phaseNumber === currentPhase`.

**Regla operativa sugerida:** al publicar o generar un artefacto, usar **`currentPhase`** como carpeta lógica `P{currentPhase}` y, si se requiere correlación con KashioOS, guardar también el UUID de la entrada correspondiente en `phases[]`.

### 2.3 ¿Tabla `fases` en PostgreSQL o no? (análisis)

Hay dos “cosas” distintas que no conviene mezclar:

| Concepto | Quién la posee | Qué es |
|----------|----------------|--------|
| **Estado del PDLC** (en qué fase va la iniciativa, COMPLETED / IN_PROGRESS, fechas, deliverables) | **KashioOS** | `currentPhase`, `phases[]`, UUIDs por instancia. **No replicar** en una tabla ARIA salvo caché puntual o columnas de solo lectura sincronizadas. |
| **Aplicabilidad de documentos** (qué plantillas o definiciones aplican a la “fase 3” del modelo de 8) | **ARIA** | Dimensión de configuración: basta **`phase_number` SMALLINT** con `CHECK (phase_number BETWEEN 1 AND 8)` en `artifact_definition` y `library_file`. Es el mismo eje que `phases[].phaseNumber`. |

**Recomendación principal (menos duplicación): no crear tabla `fases`**, salvo que tengas un requisito explícito de:

- editar nombres/descripciones de fase **desde BD sin desplegar**, o
- que varios entornos tengan **conjuntos de fases distintos** (poco probable si KashioOS fija 8), o
- generar **reportes solo en SQL** que necesiten `JOIN` a metadatos de fase sin tocar la app.

En ese caso la tabla `fases` sería un **catálogo de presentación / migración** (etiquetas, `legacy_gate_code`), **no** una segunda copia del estado por iniciativa. Sigue siendo una sola fila por `phase_number` (8 filas), no por iniciativa.

**Dónde poner nombres y textos fijos (Research … Monitoring) sin tabla**

- Un módulo único en código, p. ej. `src/constants/pdlcPhases.ts` (o similar), exportando `getPhaseLabel(phaseNumber)`, orden para UI, y mapeo legacy `G0…G5 → phase_number` solo para migración de datos históricos.
- El frontend importa el mismo contrato vía paquete compartido o duplica solo el mapa numérico → etiqueta si no hay monorepo (idealmente **un** paquete compartido para no duplicar).

**`artifact_definition` sin tabla `fases`**

- Columna **`phase_number SMALLINT NOT NULL`** con `CHECK (phase_number BETWEEN 1 AND 8)` (y opcionalmente `NULL` o valor especial si algún artefacto es transversal: mejor fila duplicada por fase o flag `applies_all_phases` que negocio defina).
- Índice `(phase_number, initiative_type)` (o el campo de flujo que usen).
- **No** FK a `fases`: la integridad es el rango 1–8; coincide con el contrato KashioOS.

**Iniciativas**

- Si ARIA **no** persiste iniciativas y solo consume KashioOS: **no hace falta** `current_phase_number` local salvo caché; si persiste fila “shadow”, guardar **`kashio_initiative_id`** + **`current_phase_number`** copiados del API en cada sync (sigue sin exigir tabla `fases`).

**Resumen:** la mejor forma de no duplicar lógica es tratar **`phase_number` (1–8) como clave canónica** acordada con KashioOS, metadatos de catálogo en **constantes compartidas**, y reservar tabla `fases` solo si el negocio exige catálogo **mutable en BD**. La §3.1 siguiente documenta la opción con tabla para quien la necesite; la §3.2 asume el enlace directo por `phase_number` como camino por defecto.

### 2.2 Decisión de producto — catálogo desde `gate` (cerrada)

- **G3 y G5:** todas las filas del catálogo que migran desde esos gates van a **`fase = 5`**. No se duplican filas por fase 4 / 5 / 6.
- **Fases 4 y 6:** quedan **sin artefactos** asignados por esta migración desde gates (vacías en el sentido de “no hay `INSERT`…SELECT desde legacy con `fase` 4 o 6”).
- **Alineación con KashioOS:** el avance real de la iniciativa sigue viniendo de **`currentPhase`** y **`phases[]`**; el número en `artifact_definition.fase` es solo **agrupación del catálogo** tras salir del modelo gate.

---

## 3. Base de datos

### 3.1 Opción B — Tabla `fases` (catálogo en BD, **opcional**)

Usar solo si necesitas metadatos de fase **editables en SQL** o joins declarativos. No sustituye a KashioOS para el estado del PDLC.

El campo “gate” sirve como **ancla de migración** y puede quedar `NULL` cuando ya no se use o renombrarse a `legacy_gate_code` para dejar claro que es histórico.

**Alineación con KashioOS:** **`phase_number SMALLINT` UNIQUE** 1…8 (equivalente a `phaseNumber` del API). `artifact_definition` puede referenciar `fases.id` **o** (recomendación más simple) omitir esta tabla y usar solo `phase_number` en la definición (§3.2).

| Columna | Tipo sugerido | Notas |
|---------|---------------|--------|
| `id` | `BIGSERIAL` | PK interna |
| `public_id` | `UUID` o `VARCHAR(36)` único | Expuesto en API y FKs lógicas |
| `code` | `VARCHAR(32)` único | Ej. `P1` … `P8` o `PHASE_RESEARCH` (convención única en todo el sistema) |
| `phase_number` | `SMALLINT` UNIQUE, 1–8 | Mismo significado que `phases[].phaseNumber` en KashioOS. |
| `name` | `VARCHAR(200)` | Nombre corto en UI |
| `description` | `TEXT` | Descripción de la fase |
| `legacy_gate_code` | `VARCHAR(10)` nullable | `G0`…`G5` solo para trazabilidad/migración |
| `sort_order` | `SMALLINT` | 1–8 para orden fijo en listas |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | Igual que el resto del esquema |

**Semilla:** 8 filas fijas (`INSERT` idempotente en migración) con nombres del requerimiento (Research … Monitoring).

### 3.2 `artifact_definition` — enfoque recomendado (**Opción A**, sin tabla `fases`)

| Cambio | Detalle |
|--------|---------|
| PK numérica | `id BIGSERIAL` PK; el `id` `varchar(50)` actual pasa a ser **dato legado** o se sustituye por `public_id`. |
| `public_id` | Nuevo; UUID o prefijo tipo `artdef-…` generado en aplicación. |
| Sustituir `gate` | **`phase_number SMALLINT NOT NULL`** con `CHECK (phase_number BETWEEN 1 AND 8)` — misma semántica que KashioOS `phaseNumber`. Sin FK a tabla `fases` salvo que elijas Opción B (§3.1). |
| `predecessor_ids` | Hoy JSON de ids string; migrar a referencias a **`public_id`** o a **`id` bigint** según la misma convención que elijas para toda la app (recomendación: **public_id en JSON** si el API es público). |
| `initiative_type` | Alinear con `NEW_PRODUCT` / `CHANGE` (y después Offering / Sellable / Non-Sellable si el API lo expone). |
| Índices | Sustituir `idx_artdef_gate` por índice en **`phase_number`** (y tipo de iniciativa / flujo). |

Si en el futuro se adopta la tabla `fases`, se puede añadir `phase_id` FK **además** de `phase_number` con un trigger de consistencia; no es necesario el día uno.

### 3.3 `initiative`

| Cambio | Detalle |
|--------|---------|
| `id` → `BIGSERIAL` + `public_id` | Igual patrón que arriba; el identificador que hoy usa el front/API como `id` varchar debería pasar a ser `public_id` para no romper integraciones si ya está en uso. |
| Referencia KashioOS | Columna **`kashio_initiative_id` UUID** (o `public_id` = mismo UUID de KashioOS) para no duplicar la verdad del portafolio. |
| `current_gate_id` | Sustituir por **`current_phase_number` SMALLINT** (1–8), copiado de `data.currentPhase` en cada sync o lectura. Opcional: **`current_kashio_phase_instance_id` UUID** = `phases[].id` donde `phaseNumber === currentPhase`. |
| Catálogo local | **No obligatorio:** `current_phase_number` debe igualar `data.currentPhase` de KashioOS (no el UUID de instancia del array `phases`). |

### 3.4 `intake_request`

| Cambio | Detalle |
|--------|---------|
| `id` + `public_id` | Mismo patrón. |
| `status` valores tipo `G0_Intake` | Planificar sustitución por estados alineados a fase/flujo KashioOS (puede ser una **segunda** migración para no mezclar “carpetas GCS” con “workflow intake”). |

### 3.5 `library_file`

| Cambio | Detalle |
|--------|---------|
| `id` + `public_id` | Mismo patrón. |
| Sustituir `gate` | **`phase_number` SMALLINT** nullable con mismo `CHECK` 1–8, o `NULL` / sentinela para “todas las fases” si aplica; reemplazar `library_file_gate_check` por check sobre rango + `ALL` si se mantiene categoría global. |

### 3.6 Estrategia de migración SQL (orden sugerido)

1. (Solo Opción B) Crear `fases` y poblar las 8 filas. Con Opción A, omitir este paso.
2. Añadir columnas nuevas (`public_id`, `phase_number`, etc.) **sin borrar** las viejas.
3. Script de **backfill**: mapeo Gn → `fase` según §2 y `001_artifact_definition_gate_to_fase.sql` (G3 y G5 → 5; sin poblar fases 4 ni 6 desde gates).
4. Desplegar código que **lea** fase con fallback a gate (período de convivencia opcional).
5. Desplegar código que **escriba** solo fases; congelar escrituras en gate.
6. Eliminar columnas `gate` / `current_gate_id` y checks asociados en DDL limpio (`schemaV3.sql` o migraciones formales).

---

## 4. Bucket Google Cloud Storage (`karia-library-files`)

**Convención vigente en consola (mayo 2026):** bajo **`Output/`** existen exactamente ocho carpetas **`Phase-1/`** … **`Phase-8/`** (misma capitalización que en GCS). **Objetivo de producto:** que las escrituras de ARIA usen ese segmento; el **código del Express en este repo aún** construye `Output/{gate o G0}/…` con default **`G0`** (ver `src/services/artifactService.ts`, `src/const/storage.ts`).

### 4.1 Objetivo de layout

- Prefijos de primer nivel sin cambio: **`Contexto/`**, **`Prompt/`**, **`Template/`**, **`Output/`**.
- Bajo **`Output/`**: carpetas **`Phase-1` … `Phase-8`** en el bucket real. Evitar nombres distintos (`P1`, `phase-1`) en nuevos objetos si la consola y el equipo ya fijaron `Phase-n`.

### 4.2 Migración de objetos existentes (histórico Gate)

1. Inventario: prefijos legacy `Output/G*/` si aún existen.
2. Mover a `Output/Phase-{n}/` según el mapeo Gate → fase del §2 (para objetos ligados al mismo criterio que el catálogo: G3/G5 → carpeta **Phase-5**; G4 → **Phase-7**; etc.).
3. Metadatos GCS: hasta evolucionar el código, se puede seguir usando la clave **`gate`** en metadata con el valor **`Phase-n`** si se quiere reflejar la carpeta en listados.
4. Actualizar filas futuras de `library_file.storage_url` para apuntar a las nuevas claves.

**Archivos backend donde hoy se arma la ruta (sin migración de código a fases aún):**

- `src/const/storage.ts` — `OUTPUT_PREFIX`, **`DEFAULT_OUTPUT_GATE`** (`G0`).
- `src/services/artifactService.ts` — `Output/{gate o G0}/{fileId}.md|.pdf`.
- `src/services/libraryService.ts` — listado y dedupe de outputs (por nombre de archivo; ver `BACKEND_REFERENCE.md` §3.1).
- `src/controllers/artifactController.ts` — cabecera **`gate`** en publish PDF.

**Sin tocar código:** el cliente puede enviar **`gate: "Phase-7"`** (o la cabecera equivalente en PDF) para que la ruta generada coincida con el bucket `Phase-*`.

---

## 5. Código backend (`aria-backend`) — archivos a tocar

| Área | Archivos |
|------|-----------|
| Constantes / rutas GCS | `src/const/storage.ts` |
| Publicación MD/PDF | `src/services/artifactService.ts` |
| Librería (metadata, listados) | `src/services/libraryService.ts` |
| Headers HTTP artefactos | `src/controllers/artifactController.ts` |
| Tipos TS | `src/types/artifactDefinition.ts`, `src/types/library.ts`, `src/types/initiative.ts` |
| Repositorios / SQL | `src/repositories/artifactDefinitionRepository.ts`, `src/repositories/initiativeRepository.ts` (+ `phaseRepository` **solo** si se adopta tabla `fases`, Opción B) |
| Validación negocio | `src/services/artifactDefinitionService.ts` |
| Contrato API | `src/index.ts` (rutas), cualquier DTO compartido |

**Cloud Functions (IA / biblioteca):**

- `functions/api/index.js` — hoy `gateLabel` en cuerpos y copy de prompts; renombrar a **fase** y actualizar instrucciones del modelo.
- Revisar `functions/library/index.js` si propaga metadatos de gate.

---

## 6. Frontend y otros repos en el workspace

- **`aria-frontend`:** `src/services/artifactDefinitionService.ts` (`getArtifactDefinitionsByGate` → por fase), `src/services/libraryService.ts` (tipo `gate` numérico → fase).
- **`AriaV1`:** si aún se despliega, mismo patrón en `server/index.js`, datos estáticos `artifactsFromOrder.ts`, UI por gate en `App.tsx` — decidir si se congela o se migra en paralelo.

---

## 7. Contratos API (impacto)

- **Hoy (solo documentación / convivencia):** en publicación GCS se puede seguir usando el campo/cabecera **`gate`** enviando el **nombre de carpeta** `Phase-1`…`Phase-8` para alinear con el bucket sin cambiar el backend.
- **Objetivo al cerrar la migración de código:** identificación de fase alineada a KashioOS (**`phaseNumber`** 1–8 o equivalente), más **`kashioInitiativeId`** cuando el cliente consume el API de iniciativas (ver §2.1).
- Si existe tabla `fases` (Opción B), `fases.public_id` sirve para joins SQL; no confundir con `phases[].id` del API KashioOS (instancia por iniciativa). Con Opción A, ordenar por **`fase`** (1–8) y nombre en SQL.
- **Express `aria-backend` — `artifact-definitions` (estado implementado):** tabla **`artifact_definition`** con columna **`fase`** (1–8, CHECK), **`public_id`** (UUID estable). **`GET /karia-svc/v2/artifact-definitions`** devuelve **`ArtifactDefinitionsListResponse`** (objeto con `phases` fijas 1…8, `artifacts` por fase, filtros y orden global vía query `sortBy` / `sortOrder`, default `fase` asc). **`GET|PUT|DELETE …/artifact-definitions/:publicId`** usan ese UUID. **POST/PUT** aceptan **`fase`** y/o **`faseName`** (etiquetas en `src/const/phases.ts`, mismas que **`faseLabel`** en JSON de salida), **`predecessorNames`** resueltos contra filas existentes (UUID o `name`), **`initiativeType`** `Run` \| `Change` \| `Both`. Contrato detallado: **`docs/API_DATABASE_ENDPOINTS.md`** §4; ejemplos: **`postman/Karia-ARIA-Backend.postman_collection.json`** (carpeta 5).

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Confusión PRD (G3 ↔ varias fases) vs SQL (G3→5 único) | Documentar §2 como fuente de verdad; si negocio cambia el reparto, nueva migración explícita |
| URLs firmadas y enlaces antiguos a `Output/G2/...` | Mantener redirección o job de sinónimos; documentar ventana de convivencia |
| Cambio de PK a bigint | Plan de migración en dos pasos con columnas paralelas y FKs actualizadas |
| Desalineación `currentPhase` vs estado en `phases[]` | Regla: confiar en `currentPhase` para UI/carpetas; validar en logs si el elemento con ese `phaseNumber` no está `IN_PROGRESS` (KashioOS es dueño del arreglo). |
| UUID de instancia vs configuración | No usar `phases[].id` como FK de `artifact_definition`. Usar **`phase_number` 1–8**; opcional FK a tabla `fases` solo en Opción B. Reservar UUID de instancia para auditoría o integración futura con `deliverables`. |

---

## 9. Checklist resumido

- [ ] Bucket GCS con **`Phase-1` … `Phase-8`**; clientes de publicación envían **`gate: "Phase-n"`** hasta que el API evolucione a `phaseNumber` / cabecera dedicada en código.
- [ ] DDL: alteraciones en `artifact_definition`, `initiative`, `intake_request`, `library_file` (**`phase_number`**); tabla `fases` **solo** si aplica Opción B (§3.1).
- [ ] Constantes compartidas `PDLC_PHASES` (o equivalente) para etiquetas 1–8 y rutas GCS, un solo módulo en backend (y shared en front si aplica).
- [ ] Scripts: (Opción B) seed 8 filas en `fases`; **siempre** migración datos gate → `phase_number` + migración GCS (o script operativo documentado).
- [ ] Backend Express: rutas, repos, tipos, storage.
- [ ] Cloud Functions: prompts y parámetros.
- [ ] Frontend: filtros UI y servicios.
- [x] Actualizar documentación viva: `BACKEND_REFERENCE.md` §5–6; `API_DATABASE_ENDPOINTS.md` §4; Postman carpeta **Artifact definitions** (`postman/Karia-ARIA-Backend.postman_collection.json`).
- [ ] Retirar código y columnas **gate** tras ventana de deprecación.

---

## 10. Referencias en repo

- `aria-backend/docs/ARIA_2_Descripcion_de_Requerimiento.md` — req. 7 (sustitución gates por fases y tabla de correspondencia).
- `aria-backend/docs/PRD_ARIA_2.0_v1.0.0.0.md` — visión 8 fases / 36 artefactos / fuera de alcance por fase.
- `aria-backend/docs/BACKEND_REFERENCE.md` — bucket, rutas `Output/{gate}`, tablas v2.
- `aria-backend/database/schemaV2.sql` — `artifact_definition` con **`fase`**, `public_id`, `id` bigserial; otras tablas pueden seguir con `gate` / `current_gate_id` hasta su migración.

Este documento es el **plan maestro**; la implementación conviene trocearla en migraciones SQL versionadas y PRs por capa (DDL → datos → GCS → API → front).
