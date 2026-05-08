# Integración de iniciativas — KashioOS → ARIA

**Fecha:** 2026-05-08
**Autor:** Backend ARIA
**Estado:** Primera entrega (MVP). Solo guarda información básica de la iniciativa.

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
   │  POST /karia-svc/v2/initiatives/sync/:publicId
   ▼
ARIA backend (Express)
   ├── Valida que :publicId sea UUID
   ├── GET https://kpdlc-svc-app-...run.app/api/v1/initiatives/:publicId
   │       Headers:  Authorization: Bearer ${KASHIOS_API_TOKEN}
   │                 Accept: application/json
   ├── Acepta envelope { success, data } o el objeto plano.
   ├── Verifica que data.id == :publicId (defensa contra mismatch).
   ├── Mapea solo los campos relevantes (descarta el resto).
   ├── UPSERT en public.initiative (clave: public_id).
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
| POST    | `/sync/:publicId`     | Pide la iniciativa a KashioOS y hace upsert local. **Principal.** |
| GET     | `/`                   | Listado liviano (**InitiativeSummary**), orden `synced_at DESC`. No llama a KashioOS. |
| GET     | `/:publicId`          | Detalle (**InitiativeDetail**): datos de la iniciativa + 8 fases con `artifact_definition` por fase. 404 si no se sincronizó nunca. |
| PUT     | `/:publicId`          | Update parcial (hoy solo `status`). **Ruta comentada** en `initiativeRoutes.ts` hasta habilitarla; el handler existe. |
| DELETE  | `/:publicId`          | **Soft-delete:** pone `status = 'DELETED'`. **No** borra la fila ni toca KashioOS. 404 si no existe. |

### 3.1 `POST /karia-svc/v2/initiatives/sync/:publicId`

- **Body:** ninguno.
- **Path param:** `publicId` (UUID que también es el `id` en KashioOS).
- **Respuestas:**
  - `201 Created` → no existía localmente y se acaba de crear.
  - `200 OK`      → ya existía, se actualizó con datos frescos.
  - `400 Bad Request` → `publicId` no es UUID válido.
  - `404 Not Found` → KashioOS no encontró esa iniciativa.
  - `502 Bad Gateway` → KashioOS respondió error / payload inválido / id distinto.
  - `504 Gateway Timeout` → la llamada a KashioOS tardó más que `KASHIOS_TIMEOUT_MS` (default 15s).
  - `500 Internal Server Error` → faltan `KASHIOS_API_BASE_URL` o `KASHIOS_API_TOKEN`.

**Ejemplos cURL:**

```bash
# Sincroniza la iniciativa CHANGE de ejemplo
curl -X POST http://localhost:3000/karia-svc/v2/initiatives/sync/ed5c9978-c12b-4ba0-b127-3faf89d0e9a8

# Sincroniza la NEW_PRODUCT de ejemplo
curl -X POST http://localhost:3000/karia-svc/v2/initiatives/sync/c78267bb-e885-45db-ab7f-b4b5040d44e1

# Volver a llamar refresca el snapshot (200, mismo public_id)
curl -X POST http://localhost:3000/karia-svc/v2/initiatives/sync/ed5c9978-c12b-4ba0-b127-3faf89d0e9a8
```

### 3.2 `GET /karia-svc/v2/initiatives`

Lista local (array de **InitiativeSummary**): sin `phases` ni `description`; incluye `currentPhaseLabel`. No llama a KashioOS.

```bash
curl http://localhost:3000/karia-svc/v2/initiatives
```

### 3.3 `GET /karia-svc/v2/initiatives/:publicId`

Detalle enriquecido (**InitiativeDetail**): campos de la iniciativa + `totalArtifacts` + `phases` (8 ranuras) con `artifacts[]` leídos de **`artifact_definition`** por número de fase. Devuelve **404** si nunca se sincronizó.

```bash
curl http://localhost:3000/karia-svc/v2/initiatives/ed5c9978-c12b-4ba0-b127-3faf89d0e9a8
```

### 3.4 `PUT /karia-svc/v2/initiatives/:publicId` (opcional, ruta comentada)

Body JSON mínimo: `{ "status": "IN_PROGRESS" }` (cualquier string; se normaliza a mayúsculas). Sirve para restaurar tras soft-delete o estado local. **La ruta está comentada** en `src/routes/initiativeRoutes.ts`; descomentar la línea del `router.put` para exponerla.

### 3.5 `DELETE /karia-svc/v2/initiatives/:publicId`

**Soft-delete:** actualiza `status` a **`DELETED`**; la fila permanece. Respuesta típica: `{ "success": true, "softDeleted": true, "initiative": { … } }`. Para refrescar desde KashioOS: `POST /sync/:publicId` (sobrescribe `status` con el valor upstream).

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
    phases                jsonb          DEFAULT '[]'::jsonb NULL,
    synced_at             timestamptz    DEFAULT now() NOT NULL,
    created_at            timestamptz    DEFAULT now() NOT NULL,
    updated_at            timestamptz    DEFAULT now() NOT NULL,
    CONSTRAINT initiative_pkey PRIMARY KEY (id),
    CONSTRAINT initiative_public_id_key UNIQUE (public_id),
    CONSTRAINT initiative_current_phase_check
        CHECK (current_phase IS NULL OR (current_phase BETWEEN 1 AND 8)),
    CONSTRAINT initiative_initiative_type_check
        CHECK (initiative_type IS NULL OR initiative_type IN ('CHANGE', 'NEW_PRODUCT'))
);

CREATE INDEX idx_initiative_status        ON public.initiative (status);
CREATE INDEX idx_initiative_type          ON public.initiative (initiative_type);
CREATE INDEX idx_initiative_current_phase ON public.initiative (current_phase);
CREATE INDEX idx_initiative_quarter       ON public.initiative (quarter_year, quarter_name);
CREATE INDEX idx_initiative_code          ON public.initiative (code);

-- trigger compartido que mantiene updated_at
CREATE TRIGGER update_initiative_updated_at BEFORE UPDATE
    ON public.initiative FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Migración para BD existentes (DM)

Archivo: `aria-backend/database/migrations/004_initiative_kashio_sync.sql`.
**Es destructivo** (`DROP TABLE IF EXISTS public.initiative CASCADE` y luego
`CREATE TABLE`). Aplica solo si los datos antiguos del modelo v1 no son
necesarios — KashioOS es la fuente de verdad y se puede re-sincronizar.

```bash
psql "$ConnectionString_Karia" -f aria-backend/database/migrations/004_initiative_kashio_sync.sql
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

Si falta `baseUrl` o `token`, el endpoint `POST /sync/:publicId` responde
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
# 1. Aplicar migración (destructivo: borra datos viejos del modelo ARIA v1)
cd aria-backend
psql "$ConnectionString_Karia" -f database/migrations/004_initiative_kashio_sync.sql

# 2. Arrancar el backend
npm run dev   # http://localhost:3000

# 3. Sincronizar una iniciativa CHANGE
curl -i -X POST http://localhost:3000/karia-svc/v2/initiatives/sync/ed5c9978-c12b-4ba0-b127-3faf89d0e9a8
# → HTTP/1.1 201 Created (la primera vez)

# 4. Volver a llamar — refresca y devuelve 200
curl -i -X POST http://localhost:3000/karia-svc/v2/initiatives/sync/ed5c9978-c12b-4ba0-b127-3faf89d0e9a8
# → HTTP/1.1 200 OK

# 5. Sincronizar la NEW_PRODUCT (trae intakeOrigin.code)
curl -X POST http://localhost:3000/karia-svc/v2/initiatives/sync/c78267bb-e885-45db-ab7f-b4b5040d44e1

# 6. Listar lo que quedó local
curl http://localhost:3000/karia-svc/v2/initiatives

# 7. Detalle por UUID
curl http://localhost:3000/karia-svc/v2/initiatives/ed5c9978-c12b-4ba0-b127-3faf89d0e9a8

# 8. Soft-delete local (status DELETED; la fila sigue en BD)
curl -X DELETE http://localhost:3000/karia-svc/v2/initiatives/ed5c9978-c12b-4ba0-b127-3faf89d0e9a8
```

### Ejemplo de respuesta de `POST /sync` (objeto **Initiative** guardado en BD)

El **`GET /:publicId`** devuelve además **`InitiativeDetail`**: mismos datos de iniciativa + `totalArtifacts` y, en cada una de las 8 fases, `artifacts[]` (catálogo `artifact_definition`).

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
  "syncedAt": "2026-05-08T17:24:55.000Z",
  "createdAt": "2026-05-08T17:24:55.000Z",
  "updatedAt": "2026-05-08T17:24:55.000Z"
}
```

---

## 9. Decisiones / convenciones

- **`public_id` = `id` UUID de KashioOS.** Hace el upsert idempotente y permite
  re-sincronizar bajo demanda sin duplicados.
- **`POST /sync/:publicId` no recibe body.** El UUID viaja por la URL.
- **`DELETE` es soft-delete local-only** (`status = 'DELETED'`). *No* afecta a KashioOS ni elimina la fila.
- **No guardamos el payload crudo.** Si alguna vez se necesita "debug del JSON
  original", se puede agregar después una columna `raw jsonb` opcional.
- **El detalle por fase se guarda como `jsonb`.** Es snapshot puramente
  visual (timeline). Si más adelante se necesita filtrar/reportar por estado
  de fase fuera de SQL, puede normalizarse a una tabla `initiative_phase`.
- **Tipo de iniciativa restringido a `CHANGE | NEW_PRODUCT`** vía CHECK,
  alineado con KashioOS. Cualquier otro valor que llegue se persiste como
  `NULL` en lugar de hacer fallar el upsert.

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
