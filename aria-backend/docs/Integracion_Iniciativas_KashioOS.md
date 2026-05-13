# Integración de iniciativas — KashioOS → ARIA

**Fecha:** 2026-05-12 (Migración 006)
**Autor:** Backend ARIA
**Estado:** MVP + filtro de artefactos por `productType` (migración 006).
**Cambios v006 (2026-05-12):** `POST /sync/:publicId` (path-based) → `POST /sync` con body `{ publicId, productType? }`. `productType` es **opcional**: si se envía, la iniciativa lo guarda y el detalle filtra los artefactos por ese valor + el `initiativeType` upstream; si se omite, la iniciativa queda con `product_type = NULL` (o conserva el valor previo) y el detalle muestra todos los artefactos activos sin filtrar. No rompe iniciativas ya desplegadas.

---

## 1. Problema que resuelve

Las iniciativas en Kashio viven en **KashioOS** (es la fuente de verdad).
ARIA necesita una copia local *ligera* de cada iniciativa para:

- Asociar artefactos / fases / predecesores a una iniciativa concreta.
- Mostrar la iniciativa sin tener que llamar a KashioOS en cada request.
- Filtrar por trimestre, tipo (`CHANGE` / `NEW_PRODUCT`), estado, fase actual, etc.

La tabla `initiative` que existía era del modelo **ARIA v1** (`current_gate_id`,
`G0..G5`, `artifacts jsonb` embebido, `id varchar`). No servía para el payload
de KashioOS, así que se rediseñó desde cero.

---

## 2. Flujo end-to-end

```
Frontend / cliente
   │
   │  POST /karia-svc/v2/initiatives/sync
   │  Body: { "publicId": UUID, "productType"?: "Offering"|"Sellable"|"Non_Sellable" }
   ▼
ARIA backend (Express)
   ├── Valida body: publicId UUID (obligatorio).
   ├── productType OPCIONAL: si está, valida ∈ {Offering, Sellable, Non_Sellable}.
   ├── GET https://kpdlc-svc-app-...run.app/api/v1/initiatives/:publicId
   │       Headers:  Authorization: Bearer ${KASHIOS_API_TOKEN}
   │                 Accept: application/json
   ├── Acepta envelope { success, data } o el objeto plano.
   ├── Verifica que data.id == publicId (defensa contra mismatch).
   ├── Mapea solo los campos relevantes (descarta el resto) + adjunta productType del body si vino.
   ├── UPSERT en public.initiative (clave: public_id).
   │   - Si el body trae productType válido, sobrescribe initiative.product_type.
   │   - Si el body NO trae productType, preserva el valor anterior (o NULL en el primer insert).
   └── Devuelve la fila guardada
       · 201 si la creó
       · 200 si la actualizó
```

**Idempotente:** llamar el mismo endpoint con el mismo `publicId` solo refresca
el snapshot. `synced_at` se actualiza en cada llamada; `created_at` solo se
escribe en la primera.

---

## 3. Endpoints expuestos

Todos cuelgan de `/karia-svc/v2/initiatives` (prefijo definido en `src/index.ts`).

| Método  | Ruta                  | Descripción                                                    |
|---------|-----------------------|----------------------------------------------------------------|
| POST    | `/sync`               | Pide la iniciativa a KashioOS y hace upsert local. **Principal.** Body: `{ publicId, productType? }` (productType opcional). |
| GET     | `/`                   | Listado liviano (**InitiativeSummary**), orden `synced_at DESC`. No llama a KashioOS. |
| GET     | `/:publicId`          | Detalle (**InitiativeDetail**): datos de la iniciativa + 8 fases con `artifact_definition` filtrados por `productType` + `initiativeType`. 404 si no se sincronizó nunca. |
| PUT     | `/:publicId`          | Update parcial (hoy solo `status`). **Ruta comentada** en `initiativeRoutes.ts` hasta habilitarla; el handler existe. |
| DELETE  | `/:publicId`          | **Soft-delete:** pone `status = 'DELETED'`. **No** borra la fila ni toca KashioOS. 404 si no existe. |

### 3.1 `POST /karia-svc/v2/initiatives/sync`

- **Body:** `application/json`.
  ```json
  {
    "publicId":   "ed5c9978-c12b-4ba0-b127-3faf89d0e9a8",
    "productType": "Sellable"
  }
  ```
  - `publicId` (string UUID): identificador de la iniciativa en KashioOS y en ARIA. **Obligatorio.**
  - `productType` (string): `Offering` | `Sellable` | `Non_Sellable`. **Opcional.** Si se envía, se persiste en `initiative.product_type` y `GET /:publicId` filtra los artefactos por ese tipo de producto. Si se omite (no aparece en el body, o llega `null` / string vacío / array vacío) la iniciativa queda con `product_type = NULL` (primer insert) o conserva el valor anterior (re-sync) y el detalle muestra todos los artefactos activos sin filtrar. Acepta también un array de un solo elemento (ej. `["Sellable"]`) para conveniencia del front. Si se envía un valor que no mapea a uno de los tres permitidos → `400`.
- **Path param:** ninguno (la ruta path-based `POST /sync/:publicId` fue eliminada en la migración 006).
- **Respuestas:**
  - `201 Created` → no existía localmente y se acaba de crear.
  - `200 OK`      → ya existía, se actualizó con datos frescos. Si vino `productType`, se reescribe; si no, conserva el anterior.
  - `400 Bad Request` → body inválido / `publicId` no es UUID / `productType` con valor no permitido.
  - `404 Not Found` → KashioOS no encontró esa iniciativa.
  - `502 Bad Gateway` → KashioOS respondió error / payload inválido / id distinto.
  - `504 Gateway Timeout` → la llamada a KashioOS tardó más que `KASHIOS_TIMEOUT_MS` (default 15s).
  - `500 Internal Server Error` → faltan `KASHIOS_API_BASE_URL` o `KASHIOS_API_TOKEN`.

**Ejemplos cURL:**

```bash
# Sincroniza sin productType (sin filtro, no rompe el flujo viejo)
curl -X POST http://localhost:3000/karia-svc/v2/initiatives/sync \
  -H 'Content-Type: application/json' \
  -d '{"publicId":"ed5c9978-c12b-4ba0-b127-3faf89d0e9a8"}'

# Sincroniza opcionalmente con productType = Sellable (activa el filtro)
curl -X POST http://localhost:3000/karia-svc/v2/initiatives/sync \
  -H 'Content-Type: application/json' \
  -d '{"publicId":"ed5c9978-c12b-4ba0-b127-3faf89d0e9a8","productType":"Sellable"}'

# Sincroniza una NEW_PRODUCT para producto Offering
curl -X POST http://localhost:3000/karia-svc/v2/initiatives/sync \
  -H 'Content-Type: application/json' \
  -d '{"publicId":"c78267bb-e885-45db-ab7f-b4b5040d44e1","productType":"Offering"}'

# Re-sincronizar cambiando el productType de una iniciativa ya existente
curl -X POST http://localhost:3000/karia-svc/v2/initiatives/sync \
  -H 'Content-Type: application/json' \
  -d '{"publicId":"ed5c9978-c12b-4ba0-b127-3faf89d0e9a8","productType":"Non_Sellable"}'
```

> **Compatibilidad / migración suave:** El flujo desplegado que ya consume el endpoint sin `productType` sigue funcionando. Iniciativas sin `product_type` se renderizan con TODOS los artefactos activos del catálogo y `artifactsFilterApplied = false`. Cuando el front esté listo, basta con empezar a enviar `productType` en el sync para activar el filtro por iniciativa, sin migración adicional.

### 3.2 `GET /karia-svc/v2/initiatives`

Lista local (array de **InitiativeSummary**): sin `phases` ni `description`; incluye `currentPhaseLabel`. No llama a KashioOS.

```bash
curl http://localhost:3000/karia-svc/v2/initiatives
```

### 3.3 `GET /karia-svc/v2/initiatives/:publicId`

Detalle enriquecido (**InitiativeDetail**): campos de la iniciativa + `productType` + `totalArtifacts` + `artifactsFilterApplied` + `phases` (8 ranuras) con `artifacts[]` filtrados por la combinación `productType` × `initiativeType` de la iniciativa. Devuelve **404** si nunca se sincronizó.

**Filtro aplicado a `artifacts[]` de cada fase (cuando la iniciativa tiene `productType`):**

| Condición                                                                 | SQL equivalente |
|---------------------------------------------------------------------------|-----------------|
| Activos                                                                   | `status = 1` |
| Aplicables al tipo de producto de la iniciativa                           | `product_type @> ['<initiative.productType>']::jsonb` |
| Aplicables al tipo de iniciativa (`Both` aplica siempre)                  | `initiative_type IN ('Both', '<equivalente>')` donde `CHANGE → Change`, `NEW_PRODUCT → New_Product` |

Si `initiative.productType` es `null` (iniciativas sincronizadas antes de la migración 006 que aún no se han re-sincronizado), el filtro **no** se aplica y `artifacts[]` lista todos los artefactos activos. La bandera `artifactsFilterApplied` permite al front avisar al usuario que debe re-sincronizar para ver el listado correcto.

```bash
curl http://localhost:3000/karia-svc/v2/initiatives/ed5c9978-c12b-4ba0-b127-3faf89d0e9a8
```

### 3.4 `PUT /karia-svc/v2/initiatives/:publicId` (opcional, ruta comentada)

Body JSON mínimo: `{ "status": "IN_PROGRESS" }` (cualquier string; se normaliza a mayúsculas). Sirve para restaurar tras soft-delete o estado local. **La ruta está comentada** en `src/routes/initiativeRoutes.ts`; descomentar la línea del `router.put` para exponerla.

### 3.5 `DELETE /karia-svc/v2/initiatives/:publicId`

**Soft-delete:** actualiza `status` a **`DELETED`**; la fila permanece. Respuesta típica: `{ "success": true, "softDeleted": true, "initiative": { … } }`. Para refrescar desde KashioOS: `POST /sync` con body `{ publicId, productType }` (sobrescribe `status` con el valor upstream y reescribe `productType`).

```bash
curl -X DELETE http://localhost:3000/karia-svc/v2/initiatives/ed5c9978-c12b-4ba0-b127-3faf89d0e9a8
```

---

## 4. Mapping KashioOS → ARIA

Solo persistimos los campos marcados como **MVP**. El resto se ignora; añadirlos
en el futuro es solo: ampliar la tabla + ampliar el mapper. No requiere
re-sincronizar nada en KashioOS.

| Campo KashioOS (`data.*`)   | Campo ARIA (`initiative.*`) | Tipo SQL        | Notas |
|-----------------------------|-----------------------------|-----------------|-------|
| `id`                        | `public_id`                 | `uuid` UNIQUE   | **Clave estable** para upsert / referencia. |
| `code`                      | `code`                      | `varchar(50)`   | Identificador humano `INI2026-042`. |
| `title`                     | `title`                     | `varchar(500)`  | NOT NULL. Si KashioOS no lo manda → 502. |
| `description`               | `description`               | `text`          | Markdown crudo. |
| `status`                    | `status`                    | `varchar(50)`   | `NOT_STARTED`, `IN_PROGRESS`, etc. |
| `currentPhase`              | `current_phase`             | `int2` 1..8     | CHECK opcional 1..8 (acepta NULL). |
| `initiativeType`            | `initiative_type`           | `varchar(20)`   | CHECK `CHANGE | NEW_PRODUCT`. Otros valores → NULL. |
| `product.name`              | `product_name`              | `varchar(200)`  | Snapshot legible. |
| `quarter.name`              | `quarter_name`              | `varchar(50)`   | Ej. `Q2`. |
| `quarter.year`              | `quarter_year`              | `int2`          | Ej. `2026`. |
| `estimatedStartDate`        | `estimated_start_date`      | `date`          | Solo `YYYY-MM-DD`. |
| `estimatedEndDate`          | `estimated_end_date`        | `date`          | Solo `YYYY-MM-DD`. |
| `intakeOrigin.code`         | `intake_origin_code`        | `varchar(50)`   | Solo viene en `NEW_PRODUCT` (`REQ-2026-013`). |
| `phases[]`                  | `phases`                    | `jsonb`         | Array `{phaseNumber, status, enteredAt, completedAt}` ordenado. |
| **— (body del request)**    | `product_type`              | `varchar(20)`   | **`Offering` \| `Sellable` \| `Non_Sellable`.** **Opcional.** Lo envía el front en el body de `POST /sync` cuando quiere activar el filtro por tipo de producto en `GET /:publicId`. CHECK constraint en BD; acepta `NULL`. |
| —                           | `synced_at`                 | `timestamptz`   | `now()` en cada upsert. |
| —                           | `created_at` / `updated_at` | `timestamptz`   | Estándar; trigger `update_updated_at_column`. |

### Campos que **NO** persistimos (intencionalmente)

Para reducir el blast radius del MVP no se guardan:

`responsibleOffice`, `teamId`, `team.name`, `successMetric`, `quarterId`,
`ownerId`, `owner.*`, `productId`, `product.code`, `product.category`,
`product.type`, `repoUrl`, `repoLinks`, `createdById`, `createdBy`,
`cancelledAt/By`, `deletedAt/By`, `cancellationReason`, `deletionReason`,
`collaboratorUsers`, `keyResults`, `viewerUsers`, `dateConsistency`,
y todos los detalles internos por fase (`goal`, `inputDesc`, `outputDesc`,
`tool`, `deliverables`).

Si más adelante alguno hace falta: agregar columna en `initiative`, ampliar
el mapper en `services/initiativeService.ts` y rehacer migración. **No
requiere romper API existente.**

### Reglas del mapper

- Strings vacíos → `null`.
- `initiativeType` se normaliza a UPPERCASE y separadores → `_`. Si no es
  `CHANGE` ni `NEW_PRODUCT` se guarda `null` (no rompe la inserción).
- `productType` (body): **opcional**. Si se omite, llega `null`, string vacío o array vacío → se trata como "no enviado" (no se aplica filtro y la BD conserva el valor anterior o queda en `NULL`). Si se envía: se normaliza case-insensitive (`sellable`, `Sellable`, `SELLABLE` → `Sellable`); acepta `non_sellable`, `non sellable`, `non-sellable`, `nonsellable`. Si viene array de un solo elemento se acepta y se desempaqueta. Cualquier otro valor o un array de más de un elemento → 400.
- Fechas se truncan a `YYYY-MM-DD` (la columna es `date`).
- `phases[]` se filtra a items que tengan `phaseNumber` numérico y se ordena.

---

## 5. Esquema de la tabla `initiative`

Definitivo (ver `aria-backend/database/schemaV2.sql` y la migración
`004_initiative_kashio_sync.sql`):

```sql
CREATE TABLE public.initiative (
    id                    bigserial      NOT NULL,
    public_id             uuid           NOT NULL,
    code                  varchar(50)    NULL,
    title                 varchar(500)   NOT NULL,
    description           text           NULL,
    status                varchar(50)    NULL,
    current_phase         int2           NULL,
    initiative_type       varchar(20)    NULL,
    product_name          varchar(200)   NULL,
    quarter_name          varchar(50)    NULL,
    quarter_year          int2           NULL,
    estimated_start_date  date           NULL,
    estimated_end_date    date           NULL,
    intake_origin_code    varchar(50)    NULL,
    product_type          varchar(20)    NULL,                    -- migración 006
    phases                jsonb          DEFAULT '[]'::jsonb NULL,
    synced_at             timestamptz    DEFAULT now() NOT NULL,
    created_at            timestamptz    DEFAULT now() NOT NULL,
    updated_at            timestamptz    DEFAULT now() NOT NULL,
    CONSTRAINT initiative_pkey PRIMARY KEY (id),
    CONSTRAINT initiative_public_id_key UNIQUE (public_id),
    CONSTRAINT initiative_current_phase_check
        CHECK (current_phase IS NULL OR (current_phase BETWEEN 1 AND 8)),
    CONSTRAINT initiative_initiative_type_check
        CHECK (initiative_type IS NULL OR initiative_type IN ('CHANGE', 'NEW_PRODUCT')),
    CONSTRAINT initiative_product_type_check                       -- migración 006
        CHECK (product_type IS NULL OR product_type IN ('Offering', 'Sellable', 'Non_Sellable'))
);

CREATE INDEX idx_initiative_status        ON public.initiative (status);
CREATE INDEX idx_initiative_type          ON public.initiative (initiative_type);
CREATE INDEX idx_initiative_current_phase ON public.initiative (current_phase);
CREATE INDEX idx_initiative_quarter       ON public.initiative (quarter_year, quarter_name);
CREATE INDEX idx_initiative_code          ON public.initiative (code);
CREATE INDEX idx_initiative_product_type  ON public.initiative (product_type);   -- migración 006

-- trigger compartido que mantiene updated_at
CREATE TRIGGER update_initiative_updated_at BEFORE UPDATE
    ON public.initiative FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Migración para BD existentes (DM)

**Migraciones aplicables a `initiative`:**

1. `database/migrations/004_initiative_kashio_sync.sql` — **destructivo**
   (`DROP TABLE IF EXISTS public.initiative CASCADE` + `CREATE TABLE`). Solo si
   los datos antiguos del modelo v1 no son necesarios; KashioOS es la fuente de
   verdad y todo se puede re-sincronizar.
2. `database/migrations/006_initiative_product_type.sql` — **no destructivo**:
   añade la columna `product_type` (NULL), su CHECK e índice. Las iniciativas
   existentes quedan con `product_type = NULL` hasta el siguiente `POST /sync`.
   Detalle: `docs/Migracion_006_Initiative_Product_Type.md`.

```bash
# Si nunca aplicaste 004 (BD limpia o solo modelo v1)
psql "$ConnectionString_Karia" -f aria-backend/database/migrations/004_initiative_kashio_sync.sql

# Para sumar el filtro por productType (idempotente)
psql "$ConnectionString_Karia" -f aria-backend/database/migrations/006_initiative_product_type.sql
```

---

## 6. Configuración (variables de entorno)

Añadidas en `aria-backend/.env.example`:

```dotenv
# KashioOS — API de iniciativas (consumido por POST /karia-svc/v2/initiatives/sync/:publicId)
KASHIOS_API_BASE_URL=https://kpdlc-svc-app-476648227615.us-east4.run.app
KASHIOS_API_TOKEN=<bearer token>
# Opcional, default 15000
# KASHIOS_TIMEOUT_MS=15000
```

Se leen en `src/config/env.ts`:

```ts
env.kashios.baseUrl     // string sin slash final
env.kashios.token       // bearer
env.kashios.timeoutMs   // default 15000
```

Si falta `baseUrl` o `token`, el endpoint `POST /sync` responde
**500** explicando cuál variable falta (no se hace la llamada saliente).

---

## 7. Archivos creados / modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `aria-backend/src/config/env.ts` | modificado | Añade `env.kashios.{baseUrl, token, timeoutMs}`. |
| `aria-backend/.env.example` | modificado | Documenta `KASHIOS_API_BASE_URL`, `KASHIOS_API_TOKEN`, `KASHIOS_TIMEOUT_MS`. |
| `aria-backend/.env` | modificado | Token y URL reales para desarrollo local. |
| `aria-backend/src/services/kashiosClient.ts` | **nuevo** | `kashioFetch()` con Bearer + timeout (`AbortController`). Convierte errores upstream a `HttpError` (404 / 502 / 504 / 500). |
| `aria-backend/src/types/initiative.ts` | reescrito | Tipos `Initiative`, `InitiativeUpsertPayload`, `InitiativeRow`, `InitiativePhaseSnapshot`. `InitiativeType = 'CHANGE' | 'NEW_PRODUCT'`. |
| `aria-backend/src/repositories/initiativeRepository.ts` | reescrito | `findAll`, `findByPublicId`, **`upsertFromKashio`** (`INSERT ... ON CONFLICT (public_id) DO UPDATE ...`), `removeByPublicId`. |
| `aria-backend/src/services/initiativeService.ts` | reescrito | Mapper KashioOS → ARIA y `syncFromKashio(publicId)`. |
| `aria-backend/src/controllers/initiativeController.ts` | reescrito | Handlers `listInitiatives`, `getInitiative`, `syncInitiative` (201/200), `updateInitiative`, `deleteInitiative` (soft-delete). |
| `aria-backend/src/routes/initiativeRoutes.ts` | reescrito | `GET /`, `POST /sync/:publicId`, `GET /:publicId`, `DELETE /:publicId`; `PUT /:publicId` comentado hasta habilitar. |
| `aria-backend/postman/Karia-ARIA-Backend.postman_collection.json` | modificado | Carpeta **3. Initiatives (KashioOS sync)** alineada con §3. |
| `aria-backend/database/schemaV2.sql` | modificado | Reemplaza definición legacy de `public.initiative`. |
| `aria-backend/database/migrations/004_initiative_kashio_sync.sql` | **nuevo** | Migración destructiva: dropea y recrea `initiative` con la forma nueva. |

---

## 8. Cómo probarlo end-to-end

```bash
# 1. Aplicar migraciones (004 es destructivo; 006 solo añade product_type)
cd aria-backend
psql "$ConnectionString_Karia" -f database/migrations/004_initiative_kashio_sync.sql
psql "$ConnectionString_Karia" -f database/migrations/006_initiative_product_type.sql

# 2. Arrancar el backend
npm run dev   # http://localhost:3000

# 3. Sincronizar una iniciativa CHANGE para producto Sellable
curl -i -X POST http://localhost:3000/karia-svc/v2/initiatives/sync \
  -H 'Content-Type: application/json' \
  -d '{"publicId":"ed5c9978-c12b-4ba0-b127-3faf89d0e9a8","productType":"Sellable"}'
# → HTTP/1.1 201 Created (la primera vez)

# 4. Volver a llamar (cambiando productType a Non_Sellable) — refresca y devuelve 200
curl -i -X POST http://localhost:3000/karia-svc/v2/initiatives/sync \
  -H 'Content-Type: application/json' \
  -d '{"publicId":"ed5c9978-c12b-4ba0-b127-3faf89d0e9a8","productType":"Non_Sellable"}'
# → HTTP/1.1 200 OK ; product_type ahora vale Non_Sellable y el filtro cambia

# 5. Sincronizar una NEW_PRODUCT para producto Offering
curl -X POST http://localhost:3000/karia-svc/v2/initiatives/sync \
  -H 'Content-Type: application/json' \
  -d '{"publicId":"c78267bb-e885-45db-ab7f-b4b5040d44e1","productType":"Offering"}'

# 6. Listar lo que quedó local
curl http://localhost:3000/karia-svc/v2/initiatives

# 7. Detalle por UUID — artifacts[] vendrán filtrados por productType + initiativeType
curl http://localhost:3000/karia-svc/v2/initiatives/ed5c9978-c12b-4ba0-b127-3faf89d0e9a8

# 8. Soft-delete local (status DELETED; la fila sigue en BD)
curl -X DELETE http://localhost:3000/karia-svc/v2/initiatives/ed5c9978-c12b-4ba0-b127-3faf89d0e9a8
```

### Ejemplo de respuesta de `POST /sync` (objeto **Initiative** guardado en BD)

El **`GET /:publicId`** devuelve además **`InitiativeDetail`**: mismos datos de iniciativa + `totalArtifacts` + `artifactsFilterApplied` y, en cada una de las 8 fases, `artifacts[]` (catálogo `artifact_definition` filtrado).

```json
{
  "id": 1,
  "publicId": "ed5c9978-c12b-4ba0-b127-3faf89d0e9a8",
  "code": "INI2026-042",
  "title": "Test2 Q2",
  "description": "**Problema**\ntest\n\n**Alcance**\ntest",
  "status": "NOT_STARTED",
  "currentPhase": 1,
  "initiativeType": "CHANGE",
  "productName": "Reportes Avanzados con IA",
  "productType": "Sellable",
  "quarterName": "Q2",
  "quarterYear": 2026,
  "estimatedStartDate": "2026-04-08T00:00:00.000Z",
  "estimatedEndDate": "2026-04-30T00:00:00.000Z",
  "intakeOriginCode": null,
  "phases": [
    { "phaseNumber": 1, "status": "IN_PROGRESS", "enteredAt": "2026-04-08T22:15:22.115Z", "completedAt": null },
    { "phaseNumber": 2, "status": "PENDING", "enteredAt": null, "completedAt": null },
    { "phaseNumber": 3, "status": "PENDING", "enteredAt": null, "completedAt": null },
    { "phaseNumber": 4, "status": "PENDING", "enteredAt": null, "completedAt": null },
    { "phaseNumber": 5, "status": "PENDING", "enteredAt": null, "completedAt": null },
    { "phaseNumber": 6, "status": "PENDING", "enteredAt": null, "completedAt": null },
    { "phaseNumber": 7, "status": "PENDING", "enteredAt": null, "completedAt": null },
    { "phaseNumber": 8, "status": "PENDING", "enteredAt": null, "completedAt": null }
  ],
  "syncedAt": "2026-05-12T17:24:55.000Z",
  "createdAt": "2026-05-08T17:24:55.000Z",
  "updatedAt": "2026-05-12T17:24:55.000Z"
}
```

---

## 9. Decisiones / convenciones

- **`public_id` = `id` UUID de KashioOS.** Hace el upsert idempotente y permite
  re-sincronizar bajo demanda sin duplicados.
- **`POST /sync` recibe body `{ publicId, productType? }`** (migración 006). El
  `publicId` viaja en el body porque ahora hay un segundo campo (`productType`)
  controlado por ARIA.
- **`productType` es OPCIONAL hoy** y controlado por ARIA, no por KashioOS. Si
  el front no lo envía, la iniciativa queda con `product_type = NULL` y el
  detalle no aplica filtro por tipo de producto (compatible con el flujo
  desplegado). Cuando el front esté listo para usar el filtro, basta con
  empezar a enviarlo. El día que sea obligatorio se cambia el `parseProductTypeBody`
  para que vuelva a lanzar `400` si falta. Cambiarlo solo requiere otro
  `POST /sync` con el nuevo valor.
- **El filtro de artefactos en el detalle es lado servidor.** El front solo
  consume `artifacts[]` y la bandera `artifactsFilterApplied`. Los artefactos
  con `status = 0` (soft-deleted) nunca aparecen en el detalle, sin importar
  el `productType`.
- **`DELETE` es soft-delete local-only** (`status = 'DELETED'`). *No* afecta a KashioOS ni elimina la fila.
- **No guardamos el payload crudo.** Si alguna vez se necesita "debug del JSON
  original", se puede agregar después una columna `raw jsonb` opcional.
- **El detalle por fase se guarda como `jsonb`.** Es snapshot puramente
  visual (timeline). Si más adelante se necesita filtrar/reportar por estado
  de fase fuera de SQL, puede normalizarse a una tabla `initiative_phase`.
- **Tipo de iniciativa restringido a `CHANGE | NEW_PRODUCT`** vía CHECK,
  alineado con KashioOS. Cualquier otro valor que llegue se persiste como
  `NULL` en lugar de hacer fallar el upsert.
- **Equivalencia `InitiativeType` ↔ `ArtifactInitiativeType`:** `CHANGE → Change`,
  `NEW_PRODUCT → New_Product`. `Both` aplica siempre. Esto se usa al filtrar
  los artefactos del catálogo: una iniciativa CHANGE recibe artefactos
  marcados como `Both` o `Change`, nunca solo `New_Product`.

---

## 10. Pendientes / próximos pasos sugeridos

- [x] Postman collection: carpeta **3. Initiatives (KashioOS sync)** alineada con §3.
- [x] Documentar en `API_DATABASE_ENDPOINTS.md` §2 (iniciativas alineadas con el código actual).
- [ ] Considerar un endpoint `POST /sync` (body con array de UUIDs) para
      sincronización masiva.
- [ ] Pensar política de actualización: ¿sync bajo demanda (actual) o un
      job periódico que refresque las iniciativas activas?
- [ ] Cuando ARIA necesite owner/team/repo/successMetric, agregar columnas
      sin romper API: solo añadir y ampliar el mapper.
