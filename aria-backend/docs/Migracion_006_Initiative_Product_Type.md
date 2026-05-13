# Migración 006 — `initiative.product_type` y filtro de artefactos por iniciativa

**Fecha:** 2026-05-12
**Autor:** Backend ARIA
**Archivo SQL:** `database/migrations/006_initiative_product_type.sql`
**Estado:** No destructiva. Idempotente.

---

## 1. Problema

El endpoint `GET /karia-svc/v2/initiatives/:publicId` devuelve, para cada una de las 8 fases del PDLC, los artefactos del catálogo (`artifact_definition`) que el equipo debe producir. Antes de esta migración, el detalle listaba **todos** los artefactos activos (`status = 1`) de cada fase, sin importar el tipo de producto al que pertenecía la iniciativa.

Esto tenía dos efectos no deseados:

1. **Ruido visual.** Una iniciativa para un producto **`Non_Sellable`** (interno / componente / infra) recibía artefactos exclusivamente comerciales como `7.07. One-pager`, `7.08. Pitch Deck`, `7.09. Brochure Producto`, `7.11. ICP & Segmentos objetivo`, `7.12. Playbook de Ventas`, etc.
2. **Falta de coherencia con el modelo de `artifact_definition`.** Cada artefacto ya declara su `product_type` (jsonb array de `Offering` / `Sellable` / `Non_Sellable`) e `initiative_type` (`Both` / `Change` / `New_Product`), pero esa info no se cruzaba con la iniciativa al renderizar.

---

## 2. Solución

1. Agregar la columna `product_type` (`varchar(20)`) a `public.initiative` con CHECK que solo permita `'Offering'`, `'Sellable'` o `'Non_Sellable'` (también acepta `NULL`).
2. Agregar índice `btree(product_type)` para filtros / dashboards.
3. Cambiar el endpoint **`POST /karia-svc/v2/initiatives/sync/:publicId`** (path-based, sin body) por **`POST /karia-svc/v2/initiatives/sync`** con body:
   ```json
   {
     "publicId":   "<uuid>",
     "productType": "Sellable"
   }
   ```
   **`productType` es opcional.** Si se omite, el body queda `{ "publicId": "<uuid>" }` y la iniciativa se sincroniza sin filtro por tipo de producto (compatible con el flujo viejo, no rompe nada). Cuando el front esté listo para usar el filtro, basta con empezar a enviar `productType` en el sync.

4. En `GET /karia-svc/v2/initiatives/:publicId`, filtrar `artifacts[]` de cada fase por:
   - `status = 1`
   - `product_type @> [<initiative.productType>]::jsonb` (solo si `initiative.productType` no es `NULL`).
   - `initiative_type IN ('Both', <equivalente>)` (solo si `initiative.initiativeType` existe). `CHANGE → Change`, `NEW_PRODUCT → New_Product`.

   Si la iniciativa todavía no tiene `productType` (sincronización sin el campo), no se aplica el filtro de productType y la respuesta incluye `artifactsFilterApplied = false`. El front puede saber por esa bandera si debe avisar al usuario o seguir mostrando todos los artefactos.

---

## 3. Aplicación

```bash
psql "$ConnectionString_Karia" -f database/migrations/006_initiative_product_type.sql
```

La migración:

- Es **idempotente:** `ADD COLUMN IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS` antes de `ADD CONSTRAINT`, `CREATE INDEX IF NOT EXISTS`.
- Es **no destructiva:** ninguna fila existente se borra ni se modifica. Las iniciativas ya sincronizadas quedan con `product_type = NULL` hasta que se haga `POST /sync` con el body nuevo.
- Tiene un bloque `DO $$ … RAISE EXCEPTION …` final que aborta si la columna, el CHECK o el índice no quedaron creados.

---

## 4. Estructura final de `public.initiative`

```sql
CREATE TABLE public.initiative (
    id                    bigserial      NOT NULL,
    public_id             uuid           NOT NULL,
    code                  varchar(50)    NULL,
    title                 varchar(500)   NOT NULL,
    description           text           NULL,
    status                varchar(50)    NULL,
    current_phase         int2           NULL,
    initiative_type       varchar(20)    NULL,         -- CHANGE | NEW_PRODUCT
    product_name          varchar(200)   NULL,
    quarter_name          varchar(50)    NULL,
    quarter_year          int2           NULL,
    estimated_start_date  date           NULL,
    estimated_end_date    date           NULL,
    intake_origin_code    varchar(50)    NULL,
    product_type          varchar(20)    NULL,         -- ★ NUEVO (006)
    phases                jsonb          DEFAULT '[]'::jsonb NULL,
    synced_at             timestamptz    DEFAULT now() NOT NULL,
    created_at            timestamptz    DEFAULT now() NOT NULL,
    updated_at            timestamptz    DEFAULT now() NOT NULL,
    CONSTRAINT initiative_pkey            PRIMARY KEY (id),
    CONSTRAINT initiative_public_id_key   UNIQUE (public_id),
    CONSTRAINT initiative_current_phase_check
        CHECK (current_phase IS NULL OR (current_phase BETWEEN 1 AND 8)),
    CONSTRAINT initiative_initiative_type_check
        CHECK (initiative_type IS NULL OR initiative_type IN ('CHANGE', 'NEW_PRODUCT')),
    CONSTRAINT initiative_product_type_check                       -- ★ NUEVO (006)
        CHECK (product_type IS NULL OR product_type IN ('Offering', 'Sellable', 'Non_Sellable'))
);

CREATE INDEX idx_initiative_status        ON public.initiative (status);
CREATE INDEX idx_initiative_type          ON public.initiative (initiative_type);
CREATE INDEX idx_initiative_current_phase ON public.initiative (current_phase);
CREATE INDEX idx_initiative_quarter       ON public.initiative (quarter_year, quarter_name);
CREATE INDEX idx_initiative_code          ON public.initiative (code);
CREATE INDEX idx_initiative_product_type  ON public.initiative (product_type);   -- ★ NUEVO (006)
```

---

## 5. Reglas de upsert (`upsertFromKashio`)

`product_type` es **controlado por ARIA**, no viene del payload de KashioOS, y es **opcional**. El upsert respeta estas reglas:

| Caso                                                                            | Comportamiento sobre `product_type` |
|---------------------------------------------------------------------------------|-------------------------------------|
| Inserción inicial sin `productType` en el body                                  | Se guarda `NULL` (default).         |
| Inserción inicial con `productType` válido                                      | Se guarda el valor.                 |
| Update y el body **omite** `productType` (o lo envía `null` / vacío / `[]`)     | Se **preserva** el valor anterior (no se borra). |
| Update y el body envía `productType` válido                                     | Se sobreescribe.                    |
| Update y el body envía `productType` con un valor que no mapea a los 3 permitidos | `400 Bad Request`. La fila no se modifica. |

Implementación: el helper `parseProductTypeBody` devuelve `undefined` cuando no se recibe valor (lo trata como "no enviado"). El repositorio usa un flag booleano (`productTypeProvided = payload.productType !== undefined`) en el `ON CONFLICT` para decidir entre `EXCLUDED.product_type` y `initiative.product_type`. Esto garantiza que un re-sync que no incluya el campo no borre el `productType` ya guardado.

> **Estrategia de adopción:** hoy `productType` es **opcional** para no romper el front en producción. Cuando se decida hacerlo obligatorio, basta con que `parseProductTypeBody` vuelva a lanzar `400` si llega `undefined`. La columna y el filtro siguen funcionando igual.

---

## 6. Reglas de filtrado en `GET /:publicId`

`getDetail` llama a `artifactDefinitionRepository.findActiveForInitiative({ productType, initiativeType })`. La función arma dinámicamente el `WHERE`:

```sql
SELECT ...
  FROM artifact_definition
 WHERE status = 1
   AND product_type @> $1::jsonb               -- solo si productType != null
   AND initiative_type IN ('Both', $2)         -- solo si initiativeType != null
 ORDER BY phase ASC, name ASC;
```

**Equivalencias `InitiativeType` → `ArtifactInitiativeType`:**

| Initiative.initiativeType | Filtra `artifact_definition.initiative_type` en … |
|---------------------------|----------------------------------------------------|
| `CHANGE`                  | `('Both', 'Change')`                               |
| `NEW_PRODUCT`             | `('Both', 'New_Product')`                          |
| `null`                    | (no filtra por initiative_type)                    |

Si `productType` es `null` (iniciativas viejas), `findActiveForInitiative` no se llama: el service cae a `findAll()` y la respuesta marca `artifactsFilterApplied = false`. El front debe avisar al usuario o disparar el re-sync.

---

## 7. Cambios en el código

| Archivo | Cambio |
|---|---|
| `database/migrations/006_initiative_product_type.sql` | **nuevo** — DDL idempotente. |
| `database/schemaV2.sql` | Añade `product_type`, su CHECK e índice en la definición de `public.initiative`. |
| `src/types/initiative.ts` | Nuevo tipo `InitiativeProductType` (alias de `ArtifactProductType`). Campo `productType` en `Initiative`, `InitiativeSummary`, `InitiativeDetail`, `InitiativeUpsertPayload`, `InitiativeRow`. Campo `artifactsFilterApplied` en `InitiativeDetail`. |
| `src/repositories/initiativeRepository.ts` | `COLUMNS` incluye `product_type`. `mapRow` mapea `product_type → productType`. `upsertFromKashio` recibe `productType` en el payload y aplica la regla de "preservar si no se envía" mediante un flag booleano. |
| `src/repositories/artifactDefinitionRepository.ts` | Nuevo método `findActiveForInitiative({ productType, initiativeType })` que filtra `status = 1`, `product_type @> [productType]` (opcional) e `initiative_type IN ('Both', equiv)` (opcional). |
| `src/services/initiativeService.ts` | Helpers `parseProductTypeBody` (opcional, devuelve `undefined` si no se envía o llega vacío) y `mapToArtifactInitiativeType`. Nuevo tipo `InitiativeSyncBody`. `syncFromKashio(body)` ahora recibe el body completo, valida `publicId` (obligatorio) + `productType` (opcional) y persiste el segundo. `getDetail` invoca `findActiveForInitiative` cuando hay `productType` y devuelve `artifactsFilterApplied`. |
| `src/controllers/initiativeController.ts` | `syncInitiative` ahora lee `req.body` (en lugar de `req.params.publicId`). |
| `src/routes/initiativeRoutes.ts` | Ruta `POST /sync/:publicId` reemplazada por `POST /sync`. |
| `postman/Karia-ARIA-Backend.postman_collection.json` | Cuatro requests nuevos: *Sync initiative from KashioOS (sin productType — sin filtro / Sellable / Offering / Non_Sellable)* con bodies de ejemplo. Descripción del *Get initiative detail* explica el filtro y `artifactsFilterApplied`. |
| `docs/Integracion_Iniciativas_KashioOS.md` | Actualiza endpoint, body, ejemplos cURL, mapper, schema, decisiones. |
| `docs/API_DATABASE_ENDPOINTS.md` | §2 reescrita: nuevo `POST /sync`, comportamiento de `GET /:publicId` con el filtro. |

---

## 8. Verificación post-migración

```sql
-- 1) ¿Existe la columna y el CHECK?
\d+ public.initiative

-- Esperado: product_type varchar(20) y CHECK initiative_product_type_check

-- 2) Iniciativas pendientes de re-sync (no tienen productType todavía)
SELECT public_id, code, title, initiative_type, product_type
  FROM public.initiative
 WHERE product_type IS NULL
 ORDER BY synced_at DESC;

-- 3) Distribución de iniciativas por productType
SELECT product_type, COUNT(*) AS total
  FROM public.initiative
 GROUP BY product_type
 ORDER BY product_type NULLS LAST;
```

```bash
# 4a) Smoke test SIN productType (modo compat: sin filtro)
curl -i -X POST http://localhost:3000/karia-svc/v2/initiatives/sync \
  -H 'Content-Type: application/json' \
  -d '{"publicId":"ed5c9978-c12b-4ba0-b127-3faf89d0e9a8"}'

# 4b) Smoke test del filtro opcional con productType
curl -i -X POST http://localhost:3000/karia-svc/v2/initiatives/sync \
  -H 'Content-Type: application/json' \
  -d '{"publicId":"ed5c9978-c12b-4ba0-b127-3faf89d0e9a8","productType":"Sellable"}'

# 5) Detalle:
#   - Tras 4a → productType = null, artifactsFilterApplied = false, artifacts[] = todos los activos.
#   - Tras 4b → productType = "Sellable", artifactsFilterApplied = true, artifacts[] solo los aplicables a Sellable + Both/Change.
curl http://localhost:3000/karia-svc/v2/initiatives/ed5c9978-c12b-4ba0-b127-3faf89d0e9a8 | jq '.productType, .artifactsFilterApplied, [.phases[].artifactsCount]'
```

---

## 9. Rollback

```sql
BEGIN;

-- Quitar índice, CHECK y columna en orden inverso a la creación
DROP INDEX IF EXISTS public.idx_initiative_product_type;
ALTER TABLE public.initiative DROP CONSTRAINT IF EXISTS initiative_product_type_check;
ALTER TABLE public.initiative DROP COLUMN IF EXISTS product_type;

COMMIT;
```

> Nota: si haces rollback de la BD pero no del código, el endpoint `POST /sync` seguirá pidiendo `productType` y devolverá `400`. Hacer rollback **simultáneo** de código y SQL.
