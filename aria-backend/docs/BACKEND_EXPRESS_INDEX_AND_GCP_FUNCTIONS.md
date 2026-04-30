# ARIA backend: Express (TypeScript) y relación con funciones GCP

Este documento explica el **servidor Express** (`aria-backend/src/index.ts`), el **acceso PostgreSQL** (`aria-backend/src/config/database.ts`) y cómo se **relacionan (o no)** con las **8 funciones HTTP** desplegadas en Kashio-Finops (`functions/api` + `functions/library`).

---

## 1. Respuesta directa: ¿hay relación entre Express y las funciones desplegadas?

**No hay llamadas HTTP desde Express hacia las Cloud Functions** (no aparecen `fetch`, URLs de `*.run.app`, ni clientes de esas funciones). Son **artefactos separados** en el mismo repositorio:

| Capa | Código | Rol principal |
|------|--------|----------------|
| **Servidor Express** | `aria-backend/src/` | API REST bajo **`/karia-svc/v2/`** que usa **PostgreSQL** (`src/config/database.ts`) y **Google Cloud Storage** (mismo bucket por defecto `karia-library-files`). |
| **Funciones API (Gemini)** | `aria-backend/functions/api/index.js` | IA: health, chat, generación de artefacto PDLC, análisis de intake. **Secret Manager** + **Gemini**. Sin Postgres ni GCS en ese archivo. |
| **Funciones Library** | `aria-backend/functions/library/index.js` | Biblioteca en GCS: listar, URL de subida, descarga y borrado con **`filePath`** y validación de categorías. |

Se **complementan a nivel de producto / frontend**, no a nivel de código servidor-servidor:

- El **front** puede usar **solo** el Express (por ejemplo despliegue en Cloud Run con `dist/index.js`).
- O puede usar **solo** las funciones GCP para IA + biblioteca (URLs dedicadas).
- O un **híbrido**: por ejemplo DB y publicación de artefactos vía Express, y chat/Gemini vía `ariachat-...run.app`.

**Solapamiento conceptual (mismo dominio, distinto entrypoint):**

| Necesidad | En Express (`/karia-svc/v2/`) | En Cloud Functions |
|-----------|-------------------------------|---------------------|
| Listar archivos de biblioteca | `GET /library/files` (lógica extra: última versión de outputs `.md`) | `getLibraryFiles` (prefijo por `category`, incluye `filePath`) |
| URL firmada para subir | `POST /library/upload-url` | `getLibraryUploadUrl` (+ `sanitizeFileName`, categorías estrictas) |
| Descargar | `GET /library/download/:fileId` (búsqueda por `includes`) | `downloadLibraryFile` (`filePath` explícito, `exists()`) |
| Borrar | `DELETE /library/delete/:fileId` | `deleteLibraryFile` (`filePath`) |
| IA (Gemini) | **No existe** en Express | `ariaChat`, `generateArtifact`, `analyzeIntake`, `health` (API) |

Mismo **bucket** posible en ambos mundos (`GCS_BUCKET_NAME` / default `karia-library-files`), por lo que los datos en GCS pueden ser **compartidos** aunque las rutas HTTP sean distintas.

---

## 2. `src/config/database.ts`: finalidad y responsabilidad

- Lee `ConnectionString_Karia` del entorno y crea un **`pg.Pool`** (máx. 10 conexiones, timeouts acotados).
- Si la URL trae `sslmode=require|prefer|verify-full` y no hay `DB_SSL_CA`, activa TLS con `rejectUnauthorized: true` en el pool.
- SSL opcional: `DB_SSL_CA` (PEM) o `DB_SSL_REJECT_UNAUTHORIZED=false` solo para desarrollo.
- Exporta **`query`**, **`getPool`**, **`testConnection()`** (equivalente al antiguo `db.js`).

**Quién lo usa:** repositorios y servicios bajo **`/karia-svc/v2/`** (initiatives, intakes, artifact-definitions, health/db). Las Cloud Functions de `api` y `library` **no** importan este módulo.

---

## 3. Mapa de endpoints Express

El prefijo **`/karia-svc/v2/`** está definido en **`src/index.ts`**. **`GET /health`** queda en la **raíz** para probes.

### 3.1 Almacenamiento (GCS) — sin tablas SQL

| Método y ruta | Almacén / recurso | Qué hace |
|---------------|-------------------|----------|
| `GET /karia-svc/v2/library/files` | **GCS** bucket | Lista objetos; fusiona “fuente” con outputs `.md` deduplicados por versión semántica en nombre (`_vX.Y.md`). Metadatos custom (iniciativa, artefacto, gate, etc.) en la respuesta. |
| `GET /karia-svc/v2/artifacts/files` | **GCS** `Output/` | Lista nombres de archivo bajo prefijo `Output/`. |
| `POST /karia-svc/v2/library/upload-url` | **GCS** | Genera `fileId`, ruta `category/fileId`, URL firmada **write** (15 min). Valida categoría (`Contexto`, `Output`, `Prompt`, `Template`). |
| `GET /karia-svc/v2/library/download/:fileId` | **GCS** | Busca el primer objeto cuyo nombre **contiene** `fileId`; URL firmada **read**. |
| `DELETE /karia-svc/v2/library/delete/:fileId` | **GCS** | Igual búsqueda por `includes`; elimina el objeto encontrado. |
| `POST /karia-svc/v2/artifacts/publish` | **GCS** | Escribe markdown en `Output/{gate}/{fileId}.md` con metadatos de publicación. |
| `POST /karia-svc/v2/artifacts/publish-pdf` | **GCS** | Cuerpo raw PDF; nombres desde headers; escribe en `Output/{gate}/{fileId}.pdf`. |

### 3.2 Base de datos (PostgreSQL) — tabla por endpoint

| Método y ruta | Tabla SQL | Operación | Finalidad de la tabla / del endpoint |
|---------------|-----------|-----------|--------------------------------------|
| `GET /karia-svc/v2/health/db` | *(ninguna)* | `SELECT 1` vía `testConnection()` | Comprobar conectividad a Postgres sin exponer datos. |
| `GET /karia-svc/v2/initiatives` | `initiative` | `SELECT * ... ORDER BY created_at DESC` | **Iniciativas PDLC**: producto, gate actual, fechas, estado, vínculo a intake, artefactos (JSON), etc. |
| `POST /karia-svc/v2/initiatives` | `initiative` | `INSERT ... RETURNING *` | Crear una iniciativa. |
| `PUT /karia-svc/v2/initiatives/:id` | `initiative` | `UPDATE` dinámico por campos enviados | Actualizar iniciativa (incl. `artifacts` JSON). |
| `DELETE /karia-svc/v2/initiatives/:id` | `initiative` | `DELETE WHERE id` | Eliminar iniciativa. |
| `GET /karia-svc/v2/intakes` | `intake_request` | `SELECT * ... ORDER BY created_at DESC` | **Solicitudes de intake**: problema, outcome, severidad, `aria_analysis`, etc. **Solo lectura** (no hay POST/PUT/DELETE de intakes en Express). |
| `GET /karia-svc/v2/artifact-definitions` | `artifact_definition` | `SELECT * ... ORDER BY gate, name` | **Catálogo de artefactos** por gate (PDLC): nombre, tipo de iniciativa, predecesores, obligatoriedad, área. |
| `POST /karia-svc/v2/artifact-definitions` | `artifact_definition` | `INSERT ...` | Alta de definición. |
| `PUT /karia-svc/v2/artifact-definitions/:id` | `artifact_definition` | `UPDATE` dinámico | Edición de definición. |
| `DELETE /karia-svc/v2/artifact-definitions/:id` | `artifact_definition` | `DELETE WHERE id` | Baja de definición. |

### 3.3 Otros

| Método y ruta | Rol |
|---------------|-----|
| `GET /health` | Texto `OK` para probes (raíz). |
| `GET /karia-svc/v2/health` | Liveness bajo el mismo prefijo que el resto de la API. |

---

## 4. Cómo “complementan” las funciones GCP a este modelo

- **`analyzeIntake` (Cloud Function)** puede alimentar texto de análisis que el front luego guarde en **`intake_request.aria_analysis`** — pero **esa persistencia no está en la función**; tendría que hacerse vía un endpoint de actualización de intakes si existiera en Express (hoy no hay).
- **`generateArtifact` (Cloud Function)** genera contenido; el front puede enviar el resultado a **`POST /karia-svc/v2/artifacts/publish`** para guardarlo en **GCS** `Output/...`.
- **`ariaChat`**: conversación; no toca DB ni bucket salvo lo que implemente el cliente.
- **Library functions**: alternativa endurecida a **`/karia-svc/v2/library/*`** para el mismo bucket; conviene unificar criterio (`filePath` vs `fileId`) según qué backend consuma el front.

---

## 5. Resumen en una frase

**Express (`src/`)** es el **BFF** (Postgres + GCS). Las **8 funciones GCP** son **micro-servicios desacoplados** (Gemini y biblioteca GCS endurecida); **no son importadas por Express**, pero pueden convivir con el mismo bucket y el mismo front para cubrir IA y archivos sin exponer la API key en el navegador (Gemini vía Secret Manager en Cloud).

---

*Referencia de arquitectura para el repo Kashio-ARIA (`aria-backend`).*
