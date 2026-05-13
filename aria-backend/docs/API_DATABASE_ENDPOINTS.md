# API Express — endpoints con PostgreSQL (sin GCS)

Referencia de contrato HTTP para rutas que leen o escriben en **PostgreSQL** vía `pg`. Prefijo de ingress: **`/karia-svc/v2/`** (excepto `GET /health` en la raíz del servicio).

Convenciones:

- **JSON:** cuerpos y respuestas en **camelCase** (el servidor mapea a `snake_case` en SQL).
- **Errores previstos:** `{ "error": "mensaje" }`; opcionalmente `{ "error": "...", "details": ... }` para `HttpError` con detalles.
- **Códigos:** `400` validación de negocio (`HttpError`), `404` recurso no encontrado en PUT, `500` fallo de base de datos u otros errores no controlados.

Colección Postman: **`postman/Karia-ARIA-Backend.postman_collection.json`** (carpetas *2. Health*, *3. Initiatives (KashioOS sync)*, *4. Intakes*, *5. Artifact definitions*)..

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

## 2. Iniciativas — tabla `initiative` (KashioOS → ARIA)

Las iniciativas **no** se crean con `POST /initiatives` en ARIA. Solo existen filas locales tras **`POST /initiatives/sync`** (body `{ publicId, productType }`), que consume KashioOS y hace **UPSERT** por **`public_id`** (UUID = `id` upstream). Contrato completo, variables de entorno y DDL: **`docs/Integracion_Iniciativas_KashioOS.md`** y **`docs/Migracion_006_Initiative_Product_Type.md`**.

### `GET /karia-svc/v2/initiatives`

| | |
|--|--|
| **Operación SQL** | `SELECT` columnas del snapshot (sin `phases` jsonb en el SELECT del listado); orden `synced_at DESC` |
| **Query / body** | Ninguno |
| **Respuesta `200`** | Array de **InitiativeSummary** (listado liviano). |

Campos típicos en cada elemento: `publicId`, `code`, `title`, `status`, `currentPhase`, `currentPhaseLabel`, `initiativeType` (`CHANGE` \| `NEW_PRODUCT`), `productName`, `productType` (`Offering` \| `Sellable` \| `Non_Sellable` \| `null`), `quarterName`, `quarterYear`, `estimatedStartDate`, `estimatedEndDate`, `syncedAt`.

---

### `POST /karia-svc/v2/initiatives/sync`

| | |
|--|--|
| **Body** | `{ "publicId": UUID, "productType"?: "Offering" \| "Sellable" \| "Non_Sellable" }` — `publicId` obligatorio, `productType` **opcional**. |
| **Upstream** | `GET {KASHIOS_API_BASE_URL}/api/v1/initiatives/:publicId` con `Authorization: Bearer` |
| **Operación SQL** | `INSERT … ON CONFLICT (public_id) DO UPDATE …`. La columna `product_type` solo se sobrescribe si el body trae un valor válido; si se omite, se preserva el valor previo (o queda `NULL` en el primer insert). |
| **Respuesta `201`** | Primera vez que la iniciativa existe en ARIA; cuerpo = objeto **Initiative** (snapshot KashioOS + `productType` si se envió, o `null` si no). |
| **Respuesta `200`** | Ya existía; se actualizó el snapshot. Si vino `productType` en el body, se reescribe; si no, conserva el anterior. |
| **Errores** | `400` body inválido / `publicId` no UUID / `productType` con valor no permitido; `404` KashioOS no encontró la iniciativa; `500` faltan env vars; `502`/`504` error o timeout upstream. |

**Reglas de `productType`:**

- Es **controlado por ARIA** (no viene de KashioOS) y es **opcional**.
- Si se envía un valor válido (`Offering` / `Sellable` / `Non_Sellable`, case-insensitive) se persiste en `initiative.product_type`.
- Si se omite (no aparece en el body, o llega `null`, string vacío o array vacío) la iniciativa queda con `product_type = NULL` (primera vez) o conserva el valor anterior (re-sync).
- Si llega un string distinto a los tres permitidos → `400`.
- En `GET /:publicId`, el filtro de artefactos por `product_type` solo se aplica cuando `initiative.product_type` no es `NULL`. De lo contrario, `artifacts[]` lista todos los artefactos activos del catálogo y `artifactsFilterApplied = false`.

> **Cambio respecto al contrato anterior:** la ruta `POST /initiatives/sync/:publicId` (path-based, sin body) fue **reemplazada** por esta. Postman: `3. Initiatives (KashioOS sync) → Sync initiative from KashioOS (sin productType / Sellable / Offering / Non_Sellable)`.

---

### `GET /karia-svc/v2/initiatives/:publicId`

| | |
|--|--|
| **Path** | **`publicId`** — UUID |
| **Operación SQL** | `SELECT` fila `initiative` + lectura filtrada de **`artifact_definition`** (`status = 1` + `product_type @> [productType]` + `initiative_type IN ('Both', equivalente)`) cuando la iniciativa tiene `productType`. |
| **Respuesta `200`** | **InitiativeDetail**: datos de la iniciativa + `productType` + `totalArtifacts` + `artifactsFilterApplied` + `phases` (siempre **8** entradas). Cada fase incluye `phaseNumber`, `phaseLabel`, estado del snapshot KashioOS, `artifactsCount` y `artifacts[]` (filas de `artifact_definition` ya filtradas para esa iniciativa). |
| **Respuesta `404`** | No hay copia local (hacer sync primero). |

**Reglas de filtrado de `artifacts[]`:**

- `status = 1` (siempre, los artefactos inactivos / soft-deleted no aparecen).
- Si `initiative.product_type` no es `null` → `product_type @> [initiative.product_type]`.
- Si `initiative.initiative_type` no es `null` → `artifact_definition.initiative_type IN ('Both', equivalente)`. Equivalencia: `CHANGE → Change`, `NEW_PRODUCT → New_Product`.
- Si `initiative.product_type` es `null` (iniciativas viejas que aún no se han re-sincronizado con el body nuevo) → no se aplica filtro y `artifactsFilterApplied = false`. Hacer un `POST /sync` con body habilita el filtro.

---

### `PUT /karia-svc/v2/initiatives/:publicId` *(ruta deshabilitada en router)*

El handler y el servicio existen; la línea **`router.put('/:publicId', …)`** está **comentada** en `src/routes/initiativeRoutes.ts` hasta habilitarla.

| | |
|--|--|
| **Body** | JSON parcial; hoy solo **`status`** (string, se normaliza a mayúsculas). |
| **Operación SQL** | `UPDATE initiative SET status = $1 WHERE public_id = $2` |
| **Respuesta `200`** | Objeto **Initiative** actualizado. |
| **Respuesta `404`** | No existe la fila. |

---

### `DELETE /karia-svc/v2/initiatives/:publicId`

| | |
|--|--|
| **Operación SQL** | **`UPDATE`** — soft-delete: `status = 'DELETED'` (no se ejecuta `DELETE`). |
| **Body** | Ignorado |
| **Respuesta `200`** | `{ "success": true, "softDeleted": true, "initiative": { … } }` |
| **Respuesta `404`** | No existe iniciativa con ese `publicId`. |

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

Modelo vigente en BD (tras migración 005): PK numérica **`id`** (`bigserial`), **`public_id`** (UUID estable para API), **`phase`** (1–8 PDLC KashioOS), **`product_type`** (`jsonb`, array de `Offering` / `Sellable` / `Non_Sellable`), **`predecessor_public_ids`** (`jsonb`, array de UUIDs `public_id` de artefactos predecesores) y **`status`** (`1` activo, `0` inactivo/soft-delete). Ya no se usa `gate`, `predecessor_ids` ni `predecessor_names` para el contrato HTTP vigente.

Etiquetas de fase (`phaseLabel`) en respuestas: 1 Research, 2 Analysis, 3 Design, 4 Frontend Development, 5 Backend Development, 6 Testing, 7 Deployment, 8 Monitoring (ver `src/const/phases.ts`).

---

### `GET /karia-svc/v2/artifact-definitions`

| | |
|--|--|
| **Operación SQL** | `SELECT` con `WHERE` dinámico según query params; orden configurable; **sin paginación** (siempre el conjunto completo que cumple el filtro). |
| **Query** | Opcional — ver tabla abajo. |
| **Body** | Ninguno |
| **Respuesta `200`** | Objeto **ArtifactDefinitionsListResponse** (no es un array plano). |

**Regla de estado por defecto:** si **no** envías `status`, el backend aplica `status = 1` y lista sólo artefactos activos. Si quieres ver inactivos, envía `?status=0`. Si quieres ver activos explícitamente, envía `?status=1`.

**Query params (todos opcionales):**

| Param | Descripción |
|-------|-------------|
| `name` | Subcadena insensible a mayúsculas sobre la columna `name` del artefacto (parametrizada). |
| `publicId` | UUID — filtro exacto por `public_id`. |
| `initiativeType` | `Both` \| `Change` \| `New_Product` (también acepta `NEW_PRODUCT`, `new product`, `new-product`). |
| `productType` | `Offering` \| `Sellable` \| `Non_Sellable` (también acepta `non sellable`, `non-sellable`). Filtra por contención en `product_type`. |
| `status` | `1` activos o `0` inactivos. También acepta `true`/`false`, `active`/`inactive`, `activo`/`inactivo`. Si se omite, default `1`. |
| `area` | Coincidencia **exacta** con la columna `area`. |
| `sortBy` | `phase` (default), `name`, `updatedAt`, `createdAt`, `id`. También se acepta `updated_at` / `created_at`. |
| `sortOrder` | `asc` (default) o `desc`. |

**Forma de la respuesta (`200`):**

| Campo | Tipo | Notas |
|-------|------|--------|
| `totalArtifacts` | number | Cantidad de filas que cumplen el filtro (suma de todos los `count` por fase). |
| `totalPhases` | number | Siempre **8** — ranuras fijas del PDLC (`phases.length`). |
| `phases` | array | **Siempre 8 elementos**, ordenados por `phase` 1…8. |
| `filters` | object | Eco de filtros de negocio aplicados + `sortBy` y `sortOrder`. |

**Cada elemento de `phases`:**

| Campo | Tipo | Notas |
|-------|------|--------|
| `phase` | number | 1–8 |
| `phaseLabel` | string | Etiqueta KashioOS (ej. `Design`). |
| `count` | number | Artefactos de esa fase que cumplen el filtro (0 si la fase queda vacía para ese resultado). |
| `artifacts` | **ArtifactDefinition[]** | Lista de artefactos de esa fase; `[]` si `count === 0`. |

Las fases sin artefactos en el catálogo (p. ej. 4 y 6 si aún no hay filas) aparecen con `count: 0` y `artifacts: []` para que el front pueda mostrar el carril vacío.

**Objeto ArtifactDefinition (cada ítem en `artifacts`):**

| Campo | Tipo |
|-------|------|
| `id` | number (PK interna) |
| `publicId` | string (UUID) |
| `phase` | number (1–8) |
| `phaseLabel` | string |
| `name` | string |
| `initiativeType` | `"Both"` \| `"Change"` \| `"New_Product"` |
| `productType` | (`"Offering"` \| `"Sellable"` \| `"Non_Sellable"`)[] |
| `predecessorPublicIds` | string[] (UUIDs `public_id` de artefactos predecesores) |
| `description` | string \| null |
| `mandatory` | boolean |
| `area` | string |
| `status` | `1` activo, `0` inactivo |
| `createdAt`, `updatedAt` | string (ISO 8601) |

**Errores:** `400` si `initiativeType`, `productType`, `status` o `sortOrder` tienen valores inválidos; `400` si `publicId` en query no es UUID válido.

---

### `GET /karia-svc/v2/artifact-definitions/:publicId`

| | |
|--|--|
| **Operación SQL** | `SELECT … WHERE public_id = $1` |
| **Path** | **`publicId`** — UUID de la definición |
| **Respuesta `200`** | Un objeto **ArtifactDefinition** (misma forma que cada elemento de `artifacts` en el listado). |
| **Respuesta `404`** | `{ "error": "Artifact definition not found" }` |
| **Respuesta `400`** | UUID inválido → `{ "error": "publicId must be a valid UUID" }` |

Este endpoint **no filtra por `status`**: devuelve el artefacto si existe con `status = 1` o `status = 0`. Esto permite consultar el detalle de un artefacto desactivado.

---

### `POST /karia-svc/v2/artifact-definitions`

| | |
|--|--|
| **Operación SQL** | `INSERT … RETURNING *` |
| **Content-Type** | `application/json` |

**Validación:** **`name`** obligatorio. **Fase:** debe indicarse **`phase`** (entero 1–8 o string numérico `"3"`) **o** **`phaseName`**. `phaseName` **no es libre**: debe coincidir (sin distinguir mayúsculas) con una de las **8 etiquetas KashioOS** definidas en código (`src/const/phases.ts`), las mismas que devuelve **`phaseLabel`** en GET:

| `phase` | `phaseName` (valor permitido) |
|---------|-------------------------------|
| 1 | `Research` |
| 2 | `Analysis` |
| 3 | `Design` |
| 4 | `Frontend Development` |
| 5 | `Backend Development` |
| 6 | `Testing` |
| 7 | `Deployment` |
| 8 | `Monitoring` |

Hace falta al menos **`phase` o `phaseName`** en el body; si envías **ambos**, deben referirse a la **misma** fase (ej. `phase: 3` y `phaseName: "Design"`). Cualquier número fuera de 1–8 o etiqueta que no esté en la tabla → `400`.

**`predecessorPublicIds`:** cada elemento puede ser un **`publicId`** (UUID) o el **`name`** exacto de una fila existente en `artifact_definition`; si falta alguno → `400`. Se guarda en jsonb como array de **UUIDs `public_id`**.

**`initiativeType`:** opcional; si se envía debe ser **`Both`**, **`Change`** o **`New_Product`** (mayúsculas y formatos flexibles); si se omite → **`Both`**.

**`productType`:** opcional; puede ser un string único o un array. Valores válidos: **`Offering`**, **`Sellable`**, **`Non_Sellable`**. Se persiste como array jsonb.

**`status`:** opcional; si se omite → **`1`** (activo). Acepta `1`/`0`, `true`/`false`, `active`/`inactive`, `activo`/`inactivo`.

**Cuerpo (ArtifactDefinitionInput):**

| Campo | Obligatorio | Tipo | Default / notas |
|-------|-------------|------|-----------------|
| `name` | Sí | string | |
| `phase` | Condicional | number o string | 1–8; opcional si va `phaseName`. |
| `phaseName` | Condicional | string | Una de las 8 etiquetas de la tabla anterior; opcional si va `phase`. |
| `publicId` | No | string (UUID) | Si se omite, la BD genera `gen_random_uuid()`. |
| `initiativeType` | No | `"Both"` \| `"Change"` \| `"New_Product"` | **`Both`** si se omite. |
| `productType` | No | string o string[] | **`[]`** — valores permitidos: `Offering`, `Sellable`, `Non_Sellable`. |
| `predecessorPublicIds` | No | string[] | **`[]`** — UUID o `name` existente por elemento; se normaliza a UUIDs. |
| `description` | No | string \| null | |
| `mandatory` | No | boolean | **`false`** |
| `area` | No | string | **`"Producto"`** |
| `status` | No | `1` \| `0` \| boolean/string equivalente | **`1`** (activo). |

**Respuesta `201`:** objeto **ArtifactDefinition** creado (incluye `id`, `publicId`, `createdAt`, `updatedAt`).

---

### `PUT /karia-svc/v2/artifact-definitions/:publicId`

| | |
|--|--|
| **Operación SQL** | `UPDATE … WHERE public_id = $n RETURNING *` |
| **Path** | **`publicId`** — UUID |
| **Content-Type** | `application/json` |

**Cuerpo:** **las mismas propiedades que en POST** (`name`, `phase`, `phaseName`, `initiativeType`, `productType`, `description`, `mandatory`, `area`, `predecessorPublicIds`, `status`). Puedes enviar el **JSON completo** (mismo shape que un alta) para sobrescribir todos los campos que incluyas, o un **subconjunto** parcial: solo se actualizan las claves presentes (excepto fase: ver siguiente viñeta).

- **`publicId`** no se envía en el body del PUT (va solo en la URL).
- Si **no** envías `phase` ni `phaseName`, la columna **`phase`** no cambia. Si envías cualquiera de los dos (o ambos), aplican la **misma** tabla de etiquetas y reglas de conflicto que en POST.
- Si envías `initiativeType`, debe ser **`Both`**, **`Change`** o **`New_Product`**. Si omites la clave, **`initiativeType`** no cambia.
- Si envías `productType`, reemplaza el array completo de tipos de producto.
- Si envías `predecessorPublicIds`, aplica la misma validación que POST (UUID o `name` existente por elemento) y reemplaza el array completo.
- Si envías `status`, puede activar (`1`) o desactivar (`0`) el artefacto sin borrarlo.

**Ejemplo de cuerpo (equivalente al que usarías en POST):**

```json
{
  "name": "2.9. Ejemplo SDD",
  "phase": 3,
  "phaseName": "Design",
  "initiativeType": "New_Product",
  "productType": ["Sellable", "Non_Sellable"],
  "description": "Descripción de prueba",
  "mandatory": false,
  "area": "Producto",
  "predecessorPublicIds": [],
  "status": 1
}
```

**Respuestas:** `200` objeto actualizado; `400` sin campos, fase/predecesores/`initiativeType`/`productType`/`status` inválidos o cuerpo inválido; `404` si no existe la fila.

---

### `DELETE /karia-svc/v2/artifact-definitions/:publicId`

| | |
|--|--|
| **Operación SQL** | **Soft-delete:** `UPDATE artifact_definition SET status = 0 WHERE public_id = $1 RETURNING public_id, name, status`. No borra la fila y no modifica `predecessor_public_ids` de otros artefactos. |
| **Path** | **`publicId`** — UUID |
| **Body** | Ignorado |
| **Respuesta `200`** | `{ "success": true, "softDeleted": true, "artifact": { "publicId": "...", "name": "...", "status": 0 } }` |
| **Respuesta `404`** | Definición no encontrada. |

---

## 5. Resumen rápido

| Método | Ruta | Body |
|--------|------|------|
| GET | `/health` | — |
| GET | `/karia-svc/v2/health` | — |
| GET | `/karia-svc/v2/health/db` | — |
| GET | `/karia-svc/v2/initiatives` | — |
| POST | `/karia-svc/v2/initiatives/sync/:publicId` | — (sin body; requiere env KashioOS) |
| GET | `/karia-svc/v2/initiatives/:publicId` | — |
| PUT | `/karia-svc/v2/initiatives/:publicId` | JSON `{ "status": "…" }` *(ruta comentada en código hasta habilitarla)* |
| DELETE | `/karia-svc/v2/initiatives/:publicId` | — (soft-delete) |
| GET | `/karia-svc/v2/intakes` | — |
| GET | `/karia-svc/v2/artifact-definitions` | Query opcional: `name`, `publicId`, `initiativeType`, `productType`, `status`, `area`, `sortBy`, `sortOrder` |
| GET | `/karia-svc/v2/artifact-definitions/:publicId` | — |
| POST | `/karia-svc/v2/artifact-definitions` | JSON ArtifactDefinitionInput |
| PUT | `/karia-svc/v2/artifact-definitions/:publicId` | JSON (mismo shape que POST; parcial permitido; UUID en path) |
| DELETE | `/karia-svc/v2/artifact-definitions/:publicId` | — |

---

## 6. Verificación frente a `database/schemaV2.sql`

| Tabla | Coincidencia con esta doc |
|-------|---------------------------|
| **`initiative`** | Modelo vigente: snapshot KashioOS (`public_id` uuid UNIQUE, `code`, `title`, `description`, `status`, `current_phase`, `initiative_type` CHECK `CHANGE`/`NEW_PRODUCT`, `product_name`, `quarter_*`, fechas estimadas, `intake_origin_code`, `phases` jsonb, `synced_at`, timestamps). Migración destructiva: `database/migrations/004_initiative_kashio_sync.sql`. Ver **`docs/Integracion_Iniciativas_KashioOS.md`**. |
| **`intake_request`** | El GET refleja las columnas del `SELECT *`; `requester` y `problem` son **NOT NULL** en DDL; el JSON del API sigue los tipos en `src/types/intake.ts`. |
| **`artifact_definition`** | Modelo vigente: `id` bigserial, `public_id` uuid, `phase` 1–8, `initiative_type` CHECK `Both`/`Change`/`New_Product`, `product_type` jsonb, `predecessor_public_ids` jsonb, `status` int2 (`1` activo, `0` inactivo/soft-delete), timestamps. Ver `database/schemaV2.sql` y `database/migrations/005_artifact_definition_phase_organization.sql`. |
| **`library_file`** | Existe en `schemaV2.sql` pero **no** hay rutas Express documentadas aquí que lean/escriban esa tabla (solo GCS en otras rutas). |

Fuente de verdad del esquema físico: **`database/schemaV2.sql`**. Fuente de verdad del contrato HTTP: **`src/`** + este documento; si divergen, primero revisar migraciones o ramas distintas.

---

*Alineado con `database/schemaV2.sql`, el código en `src/controllers`, `src/services`, `src/repositories` y tipos en `src/types/`.*
