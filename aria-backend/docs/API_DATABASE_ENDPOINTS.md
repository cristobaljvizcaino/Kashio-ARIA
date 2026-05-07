# API Express — endpoints con PostgreSQL (sin GCS)

Referencia de contrato HTTP para rutas que leen o escriben en **PostgreSQL** vía `pg`. Prefijo de ingress: **`/karia-svc/v2/`** (excepto `GET /health` en la raíz del servicio).

Convenciones:

- **JSON:** cuerpos y respuestas en **camelCase** (el servidor mapea a `snake_case` en SQL).
- **Errores previstos:** `{ "error": "mensaje" }`; opcionalmente `{ "error": "...", "details": ... }` para `HttpError` con detalles.
- **Códigos:** `400` validación de negocio (`HttpError`), `404` recurso no encontrado en PUT, `500` fallo de base de datos u otros errores no controlados.

Colección Postman: **`postman/Karia-ARIA-Backend.postman_collection.json`** (carpetas *2. Health*, *3. Initiatives*, *4. Intakes*, *5. Artifact definitions*).

---

## 1. Salud y prueba de base de datos

### `GET /health`

| | |
|--|--|
| **Base de datos** | No |
| **Query / body** | Ninguno |
| **Respuesta** | `200` — cuerpo **texto plano** `OK` |

### `GET /karia-svc/v2/health`

| | |
|--|--|
| **Base de datos** | No |
| **Query / body** | Ninguno |
| **Respuesta** | `200` — texto plano `healthy` |

### `GET /karia-svc/v2/health/db`

| | |
|--|--|
| **Base de datos** | Ejecuta `SELECT 1` en el pool configurado (`testConnection()`) |
| **Query / body** | Ninguno |
| **Respuesta `200`** | JSON: `{ "success": true }` |
| **Respuesta `200` con fallo lógico** | JSON: `{ "success": false, "error": "<mensaje de pg>" }` *(sigue siendo 200; el handler no cambia el status según `success`)* |

Si **`ConnectionString_Karia`** no está definida, el pool no se crea y la respuesta será `{ "success": false, "error": "Database not configured" }`.

---

## 2. Iniciativas — tabla `initiative`

### `GET /karia-svc/v2/initiatives`

| | |
|--|--|
| **Operación SQL** | `SELECT * FROM initiative ORDER BY created_at DESC` |
| **Query / body** | Ninguno |
| **Respuesta `200`** | Array JSON de objetos **Initiative** (ver abajo). Lista vacía `[]` si no hay filas. |

**Objeto en cada elemento (respuesta):**

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | string | |
| `name` | string | |
| `product` | string \| null | |
| `currentGateId` | string | Default en alta en código: `G0`; en DDL la columna admite NULL. |
| `type` | `"Run"` \| `"Change"` \| null | Nullable en DDL; el tipo TS del servidor pide union sin null, pero Postgres puede devolver NULL si se insertó sin `type`. |
| `startDate` | string \| null | |
| `endDate` | string \| null | |
| `quarter` | string \| null | |
| `status` | string \| null | |
| `intakeRequestId` | string \| null | |
| `pipelineActivated` | boolean | |
| `artifacts` | array | JSON almacenado en BD; por defecto `[]` |

*No se devuelven `created_at` / `updated_at` en el JSON (no están en el mapeo de salida).*

---

### `POST /karia-svc/v2/initiatives`

| | |
|--|--|
| **Operación SQL** | `INSERT … RETURNING *` |
| **Content-Type** | `application/json` |

**Validación en servicio:** obligatorios **`id`** y **`name`**. Si faltan → `400` `{ "error": "id and name are required" }`.

**Cuerpo (InitiativeInput):**

| Campo | Obligatorio | Tipo | Default / notas |
|-------|-------------|------|-----------------|
| `id` | Sí | string | Cliente debe generar el id (ej. UUID). |
| `name` | Sí | string | |
| `type` | No (DDL) / **sí a nivel producto** | `"Run"` \| `"Change"` | En **`database/schemaV2.sql`** la columna `type` es **NULL** permitido; el **CHECK** `initiative_type_check` solo restringe valores **no nulos** a `Run` o `Change`. Si omitís `type`, el INSERT guarda **NULL** (válido). Si enviás otro string, Postgres responde error (`500` vía handler). Para datos coherentes con el modelo PDLC, enviad siempre `Run` o `Change`. |
| `product` | No | string \| null | |
| `currentGateId` | No | string | Si se omite, se guarda **`G0`**. |
| `startDate`, `endDate`, `quarter`, `status` | No | string \| null | |
| `intakeRequestId` | No | string \| null | |
| `pipelineActivated` | No | boolean | Default **`false`**. |
| `artifacts` | No | array (JSON) | Default **`[]`** (se persiste como JSON en columna `artifacts`). |

**Campos que el cuerpo no debe usar para semántica distinta:** no hay otros endpoints; `id` no se puede sustituir después salvo borrar y crear de nuevo.

**Respuesta `200`:** un objeto **Initiative** (misma forma que en GET).

---

### `PUT /karia-svc/v2/initiatives/:id`

| | |
|--|--|
| **Operación SQL** | `UPDATE initiative SET … WHERE id = $n RETURNING *` |
| **Path** | `id` — identificador de la fila |
| **Content-Type** | `application/json` |

**Cuerpo:** objeto parcial (**InitiativeUpdate** = cualquier subconjunto de campos de **Initiative**). Solo se actualizan claves **presentes** en el JSON (patch real).

**Mapeados a columnas SQL** (camelCase → BD):

`name`, `product`, `currentGateId`, `type`, `startDate`, `endDate`, `quarter`, `status`, `intakeRequestId`, `pipelineActivated`, **`artifacts`** (se serializa a JSON).

- **`id`:** no se puede cambiar por este endpoint (el `id` va en la URL; si enviás `id` en el body, **se ignora** para el UPDATE).
- Cualquier otra clave no listada arriba **se ignora** silenciosamente.

**Respuestas:**

| Código | Situación |
|--------|-----------|
| `200` | Fila actualizada; cuerpo = **Initiative** actualizado. |
| `400` | Cuerpo vacío (ningún campo reconocido) → `"No fields to update"`. |
| `404` | No existe fila con ese `id` (o ningún campo aplicable y 0 filas afectadas según lógica del repo). |

---

### `DELETE /karia-svc/v2/initiatives/:id`

| | |
|--|--|
| **Operación SQL** | `DELETE FROM initiative WHERE id = $1` |
| **Body** | Ignorado |
| **Respuesta `200`** | Siempre `{ "success": true }` **aunque** el `id` no existiera (DELETE de 0 filas no genera error en el código actual). |

---

## 3. Intakes — tabla `intake_request` (solo lectura)

### `GET /karia-svc/v2/intakes`

| | |
|--|--|
| **Operación SQL** | `SELECT * FROM intake_request ORDER BY created_at DESC` |
| **Query / body** | Ninguno |
| **Respuesta `200`** | Array de **IntakeRequest**. No existen `POST` / `PUT` / `DELETE` en Express para esta tabla. |

**Objeto en cada elemento:**

| Campo | Tipo | Origen columna |
|-------|------|----------------|
| `id` | string | |
| `title` | string \| null | |
| `requester` | string \| null | En DDL (`schemaV2.sql`) **NOT NULL**; el tipo TS permite `null` por defensa. Filas mal migradas podrían no cumplirlo. |
| `area`, `type`, `product`, `domain`, `region` | string \| null | |
| `impactType` | string \| null | `impact_type` |
| `severity`, `urgency` | string \| null | |
| `problem` | string \| null | En DDL **NOT NULL** (misma salvedad que `requester`). |
| `outcome` | string \| null | |
| `scope` | string[] | Default `[]` |
| `constraints`, `alternatives`, `kpi` | string \| null | |
| `status` | string \| null | |
| `ariaAnalysis` | string \| null | `aria_analysis` |
| `createdAt` | string | Solo **fecha** `YYYY-MM-DD` (derivada de `created_at` en UTC). |

---

## 4. Definiciones de artefactos — tabla `artifact_definition`

### `GET /karia-svc/v2/artifact-definitions`

| | |
|--|--|
| **Operación SQL** | `SELECT * FROM artifact_definition ORDER BY gate, name` |
| **Query / body** | Ninguno |
| **Respuesta `200`** | Array de **ArtifactDefinition**. |

**Objeto en cada elemento:**

| Campo | Tipo |
|-------|------|
| `id` | string |
| `gate` | string (ej. `G0`…`G5`) |
| `name` | string |
| `initiativeType` | `"Run"` \| `"Change"` \| `"Both"` |
| `predecessorIds` | string[] |
| `description` | string \| null |
| `mandatory` | boolean |
| `area` | string |
| `createdAt`, `updatedAt` | string (ISO 8601) |

---

### `POST /karia-svc/v2/artifact-definitions`

| | |
|--|--|
| **Operación SQL** | `INSERT … RETURNING *` |
| **Content-Type** | `application/json` |

**Validación:** **`id`**, **`gate`** y **`name`** obligatorios → si faltan `400` `{ "error": "id, gate and name are required" }`.

**Cuerpo (ArtifactDefinitionInput):**

| Campo | Obligatorio | Tipo | Default |
|-------|-------------|------|---------|
| `id` | Sí | string | |
| `gate` | Sí | string | |
| `name` | Sí | string | |
| `initiativeType` | No | `"Run"` \| `"Change"` \| `"Both"` | **`Both`** |
| `predecessorIds` | No | string[] | **`[]`** |
| `description` | No | string \| null | |
| `mandatory` | No | boolean | **`false`** |
| `area` | No | string | **`"Producto"`** |

**Respuesta `200`:** un objeto **ArtifactDefinition** (incluye `createdAt` / `updatedAt` generados por la BD).

---

### `PUT /karia-svc/v2/artifact-definitions/:id`

| | |
|--|--|
| **Operación SQL** | `UPDATE … RETURNING *` |
| **Path** | `id` de la definición |
| **Content-Type** | `application/json` |

**Cuerpo:** parcial (**ArtifactDefinitionUpdate**). Claves reconocidas para columnas:

`gate`, `name`, `initiativeType`, `description`, `mandatory`, `area`, **`predecessorIds`** (se guarda como JSON en `predecessor_ids`).

- **`id`:** no se actualiza desde el body (va en la URL; el body `id` se ignora para el SET).
- Otras claves (p. ej. `createdAt`) **no** forman parte del `UPDATE` y se ignoran.

**Respuestas:** mismo patrón que iniciativas — `200` objeto actualizado, `400` sin campos, `404` si no existe la fila.

---

### `DELETE /karia-svc/v2/artifact-definitions/:id`

| | |
|--|--|
| **Operación SQL** | `DELETE FROM artifact_definition WHERE id = $1` |
| **Body** | Ignorado |
| **Respuesta `200`** | `{ "success": true }` (misma consideración de idempotencia que en iniciativas). |

---

## 5. Resumen rápido

| Método | Ruta | Body |
|--------|------|------|
| GET | `/health` | — |
| GET | `/karia-svc/v2/health` | — |
| GET | `/karia-svc/v2/health/db` | — |
| GET | `/karia-svc/v2/initiatives` | — |
| POST | `/karia-svc/v2/initiatives` | JSON InitiativeInput |
| PUT | `/karia-svc/v2/initiatives/:id` | JSON parcial Initiative |
| DELETE | `/karia-svc/v2/initiatives/:id` | — |
| GET | `/karia-svc/v2/intakes` | — |
| GET | `/karia-svc/v2/artifact-definitions` | — |
| POST | `/karia-svc/v2/artifact-definitions` | JSON ArtifactDefinitionInput |
| PUT | `/karia-svc/v2/artifact-definitions/:id` | JSON parcial ArtifactDefinition |
| DELETE | `/karia-svc/v2/artifact-definitions/:id` | — |

---

## 6. Verificación frente a `database/schemaV2.sql`

| Tabla | Coincidencia con esta doc |
|-------|---------------------------|
| **`initiative`** | Columnas usadas por el repo coinciden con el DDL (`id`, `name`, `product`, `current_gate_id` default `G0`, `type` nullable + CHECK, fechas como `varchar`, `artifacts` jsonb default `[]`, `pipeline_activated` default false). Los triggers llaman a `update_updated_at_column()` (la función debe existir en la BD; ver `database/README.md`). |
| **`intake_request`** | El GET refleja las columnas del `SELECT *`; `requester` y `problem` son **NOT NULL** en DDL; el JSON del API sigue los tipos en `src/types/intake.ts`. |
| **`artifact_definition`** | `initiative_type` con CHECK `Change`/`Run`/`Both`, defaults `Both` y `Producto`, `predecessor_ids` jsonb — alineado con `artifactDefinitionRepository` y esta guía. |
| **`library_file`** | Existe en `schemaV2.sql` pero **no** hay rutas Express documentadas aquí que lean/escriban esa tabla (solo GCS en otras rutas). |

Fuente de verdad del esquema físico: **`database/schemaV2.sql`**. Fuente de verdad del contrato HTTP: **`src/`** + este documento; si divergen, primero revisar migraciones o ramas distintas.

---

*Alineado con `database/schemaV2.sql`, el código en `src/controllers`, `src/services`, `src/repositories` y tipos en `src/types/`.*
