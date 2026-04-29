# ARIA Backend — Referencia técnica centralizada

Documento único para entender **todo lo que incluye `aria-backend`**, cómo se conecta a **Google Cloud**, **qué endpoints existen**, **qué tablas tocan**, **variables de entorno** y **cómo desplegar**.

---

## 1. ¿Qué hay dentro de esta carpeta?

| Ruta | Rol |
|------|-----|
| **`index.js`** | Servidor **Express** único: API REST + (opcional) estáticos del SPA si existe `dist/`. |
| **`db.js`** | Pool **PostgreSQL** con `pg`; usa la variable **`ConnectionString_Karia`**. |
| **`package.json`** | Dependencias del proceso Node del servidor (`express`, `cors`, `@google-cloud/storage`, `pg`). |
| **`Dockerfile`** | Imagen **solo API + db.js** (no incluye `functions/` ni `migrations/`). |
| **`cloudbuild.yaml`** | **Cloud Build**: build Docker → push **Artifact Registry / GCR** → deploy **Cloud Run**. |
| **`migrations/`** | SQL para **Cloud SQL (PostgreSQL)**; se aplican aparte (no van dentro de la imagen Docker actual). |
| **`functions/`** | **Cloud Functions** (Node, `@google-cloud/functions-framework`) — **despliegue independiente** del contenedor Express. |
| **`.env.example`** | Plantilla de variables locales. |

La carpeta **`functions/`** está en **`.dockerignore`**: no se copia al build del backend en Docker; son proyectos aparte que se suben con `gcloud functions deploy` u orquestación similar.

---

## 2. Herramientas y librerías (por qué se usan)

| Herramienta | Uso en este backend |
|-------------|---------------------|
| **Node.js** | Runtime del servidor Express y de las Cloud Functions. |
| **Express** | Framework HTTP: rutas `/api/*`, middleware JSON, raw body para PDF. |
| **cors** | Permitir llamadas desde el navegador (origen del frontend). |
| **pg (`node-postgres`)** | Cliente PostgreSQL; usa **`ConnectionString_Karia`** (URI `postgresql://…`, ej. Cloud SQL o Supabase). |
| **@google-cloud/storage** | Cliente oficial para **Google Cloud Storage (GCS)**; lista objetos, firma URLs, sube/borra archivos en el bucket configurado por código. |
| **Credenciales GCP** | En Cloud Run usa la **cuenta de servicio del propio servicio** (ADC). En local suele hacer falta `gcloud auth application-default login` o `GOOGLE_APPLICATION_CREDENTIALS` apuntando a un JSON de cuenta de servicio con permisos sobre el bucket. |
| **@google-cloud/functions-framework** | Solo en **`functions/*/index.js`**: convierte handlers HTTP en funciones desplegables como **Cloud Functions (2ª gen)**. |
| **@google/generative-ai** | Solo en **`functions/api/index.js`**: llamadas a **Gemini**; la clave en prod viene de **Secret Manager** (no del `.env` del Express). |
| **Docker** | Empaqueta `index.js` + `db.js` + `node_modules` para **Cloud Run**. |
| **Cloud Build** | CI/CD en GCP: construye imagen y ejecuta `gcloud run deploy`. |

---

## 3. Mapa Google Cloud (¿con qué está “conectado”?)

```
┌─────────────────────────────────────────────────────────────────┐
│  Cloud Run (servicio: ej. aria-backend)                        │
│  • Imagen desde Container Registry / Artifact Registry          │
│  • Cuenta de servicio → ADC para Storage                         │
│  • Variables / secretos: PORT, ConnectionString_Karia, (GEMINI ver §9) │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
        ┌───────────────┐           ┌───────────────────┐
        │ Cloud SQL     │           │ Cloud Storage      │
        │ PostgreSQL    │           │ Bucket (código):   │
        │ Tablas: §6    │           │ aria-library-files │
        └───────────────┘           └───────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Cloud Functions (functions/api, functions/library) — aparte    │
│  • API de Gemini + bucket en algunos flujos legacy               │
│  • Secret Manager: proyecto configurado en functions/api (clave) │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Secret Manager (referenciado en cloudbuild.yaml)               │
│  • gemini-api-key:latest    → GEMINI_API_KEY en Cloud Run       │
│  • aria-database-url:latest → ConnectionString_Karia en Cloud Run │
└─────────────────────────────────────────────────────────────────┘
```

**Bucket GCS (hardcodeado en `index.js`):** `aria-library-files`.

### 3.1 Estructura de objetos en `aria-library-files`

El backend asume este layout (coincide con la consola de Cloud Storage y el modal “Cargar Archivo” del frontend):

```
aria-library-files/
├── Contexto/              # Categoría UI: Contexto
│   └── lib-{timestamp}-{nombreArchivo}
├── Prompt/                # Categoría UI: Prompt
├── Template/              # Categoría UI: Template
├── Output/                # Salidas / artefactos publicados por ARIA
│   ├── G0/
│   ├── G1/
│   ├── G2/
│   ├── G3/
│   ├── G4/
│   └── G5/
│       └── {nombreSeguro}_{iniciativa}_{versión}.md   (o .pdf)
```

| Flujo API | Patrón de clave de objeto |
|-----------|----------------------------|
| `POST /api/library/upload-url` | `{category}/{fileId}` con `fileId = lib-{Date.now()}-{filename}` |
| `POST /api/artifacts/publish` | `Output/{gate|G0}/{fileId}.md` |
| `POST /api/artifacts/publish-pdf` | `Output/{gate|G0}/{fileId}.pdf` |
| `GET /api/library/files` | Lista todo el bucket; deduplica versiones `.md` bajo `Output/` |

**PostgreSQL y GCS:** la tabla **`library_file`** (ver `docs/DATABASE_AUDIT.md` y `migrations/003_v2_four_tables.sql`) está pensada para guardar **metadatos** (`storage_url`, nombre, tipo, gate, etc.) alineados con esas rutas. **`index.js` aún no inserta filas en `library_file`**; hoy la verdad operativa del listado es el bucket. La integración SQL-GCS es el siguiente paso natural.

---

## 4. Servidor Express (`index.js`) — funciones lógicas por bloque

No son “funciones exportadas”; son **handlers de rutas**. Agrupadas así:

| Bloque | Finalidad |
|--------|-----------|
| **Middleware** | `cors()`, JSON hasta 50 MB. |
| **Library / Storage** | CRUD virtual sobre **objetos GCS**, no sobre tablas SQL. |
| **Artifacts** | Publicar Markdown/PDF en prefijo `Output/` del bucket. |
| **Database API** | CRUD SQL sobre tablas PostgreSQL definidas en migraciones v2. |
| **Health** | Salud del proceso y prueba de BD. |
| **SPA fallback** | `express.static('dist')` + `sendFile(index.html)` para rutas no API (solo útil si la imagen incluye `dist/`). |

---

## 5. Tablas PostgreSQL (modelo v2 unificado)

Esquema objetivo para **BD nueva (v2)**: **4 tablas**, DDL canónico en **`migrations/003_v2_four_tables.sql`** y documentado en **`docs/DATABASE_AUDIT.md`**.

| Tabla | Endpoints que la usan hoy (`index.js`) | Notas |
|-------|----------------------------------------|--------|
| **`initiative`** | `GET/POST /api/db/initiatives`, `PUT/DELETE /api/db/initiatives/:id` | CRUD completo. |
| **`intake_request`** | Solo `GET /api/db/intakes` | Sin POST/PUT/DELETE en Express. |
| **`artifact_definition`** | `GET/POST /api/db/artifact-definitions`, `PUT/DELETE …/:id` | Gates = columna `gate` (G0…G5). **No** hay tabla `phase` en este entregable. |
| **`library_file`** | *(ninguno todavía)* | Catálogo de ficheros alineado con **GCS** (`storage_url`, categorías Contexto/Prompt/Template/Output). Integración pendiente en `/api/library/*` y `/api/artifacts/publish*`. |

Las rutas **`/api/library/*`** y **`/api/artifacts/*`** operan **solo sobre el bucket** `aria-library-files` (§3.1), no sobre `library_file` hasta que se añada la escritura SQL.

---

## 6. Catálogo de endpoints HTTP (Express)

Convención: base URL = origen del backend (ej. `https://xxx.run.app` o `http://localhost:8080`).

### 6.1 Salud

| Método | Ruta | Base de datos | GCS |
|--------|------|:-------------:|:---:|
| GET | `/health` | No | No |
| GET | `/api/db/health` | Solo **test** (`SELECT now`) | No |

### 6.2 Biblioteca y artefactos (Google Cloud Storage + futuro `library_file`)

| Método | Ruta | Acción | Tablas SQL (hoy) |
|--------|------|--------|------------------|
| GET | `/api/library/files` | Lista objetos del bucket (filtra versiones Output `.md`) | Ninguna |
| GET | `/api/artifacts/files` | Lista nombres bajo prefijo `Output/` | Ninguna |
| POST | `/api/library/upload-url` | Body JSON: firma URL **subida** hacia `{category}/lib-…` (§3.1) | Ninguna |
| GET | `/api/library/download/:fileId` | Firma URL **lectura** | Ninguna |
| DELETE | `/api/library/delete/:fileId` | Borra objeto | Ninguna |
| POST | `/api/artifacts/publish` | Body JSON: guarda `.md` en `Output/{gate}/...` + metadata objeto | Ninguna |
| POST | `/api/artifacts/publish-pdf` | Raw PDF + headers `artifactname`, etc. → guarda `.pdf` en `Output/{gate}/...` | Ninguna |

Tras integrar **`library_file`**, lo habitual será **INSERT/UPDATE/soft-delete** en la misma petición en la que se confirma el objeto en GCS (evitar desalineación bucket ↔ SQL).

### 6.3 Base de datos — iniciativas

| Método | Ruta | Tabla |
|--------|------|--------|
| GET | `/api/db/initiatives` | `initiative` (lectura) |
| POST | `/api/db/initiatives` | `initiative` (INSERT) |
| PUT | `/api/db/initiatives/:id` | `initiative` (UPDATE) |
| DELETE | `/api/db/initiatives/:id` | `initiative` (DELETE) |

### 6.4 Base de datos — intakes

| Método | Ruta | Tabla |
|--------|------|--------|
| GET | `/api/db/intakes` | `intake_request` (solo lectura) |

### 6.5 Base de datos — definiciones de artefactos

| Método | Ruta | Tabla |
|--------|------|--------|
| GET | `/api/db/artifact-definitions` | `artifact_definition` (lectura) |
| POST | `/api/db/artifact-definitions` | `artifact_definition` (INSERT) |
| PUT | `/api/db/artifact-definitions/:id` | `artifact_definition` (UPDATE) |
| DELETE | `/api/db/artifact-definitions/:id` | `artifact_definition` (DELETE) |

---

## 7. Cloud Functions en `functions/` (fuera del contenedor Docker)

Desplegadas como **servicios distintos** en GCP (URLs propias según región y nombre).

### `functions/api/index.js` (Gemini)

| Handler (`functions.http`) | Propósito |
|----------------------------|-----------|
| `generateArtifact` | POST: borrador/outline con Gemini desde nombre de artefacto + gate. |
| `analyzeIntake` | POST: analiza objeto de intake. |
| `ariaChat` | POST: chat ARIA (mensaje + historial en body). |
| `health` | Estado del servicio `aria-api-functions`. |

**GCP:** Secret Manager (`projects/.../secrets/gemini-api-key`), proyecto GCP fijado en código de esa función (`PROJECT_ID`). **No usa la misma imagen Docker que `aria-backend`.**

### `functions/library/index.js`

Equivalentes HTTP orientados al bucket **`aria-library-files`** (listar, URLs firmadas, etc.). Útiles si querés exponer la biblioteca como funciones sin pasar por Express.

---

## 8. Variables de entorno necesarias para que “todo funcione”

### 8.1 Servidor Express (`node index.js`)

| Variable | Obligatoria | Uso real en código |
|----------|-------------|---------------------|
| **`PORT`** | No | Puerto HTTP (default **8080**). Cloud Run suele inyectar `8080`. |
| **`ConnectionString_Karia`** | Para `/api/db/*` | URI PostgreSQL (`postgresql://…`). Sin ella el servidor **arranca**, pero rutas DB fallan (`Database not configured`). |
| **`GOOGLE_APPLICATION_CREDENTIALS`** | Solo si ADC no está disponible | Ruta al JSON de cuenta de servicio para **Storage** en local. |
| **`GEMINI_API_KEY`** | Ver §9 | Documentada en `.env.example` y en **`cloudbuild.yaml`** como secreto; **el `index.js` actual no la usa**. |
| **`SERVICE_BASE_PATH`** | No | Prefijo de ingress (p. ej. `/karia-svc/v2`). Si está definido, toda la API queda bajo `{SERVICE_BASE_PATH}/api/...` y `/health` duplicado en raíz para probes (ver §8.3). |

### 8.2 Importante sobre `GEMINI_API_KEY` en el contenedor Express

El archivo **`cloudbuild.yaml`** incluye:

`--set-secrets=GEMINI_API_KEY=gemini-api-key:latest,...`

Pero **`index.js` no importa `@google/generative-ai` ni lee `process.env.GEMINI_API_KEY`**. La variable está preparada para una futura integración en el mismo servicio o para consistencia con otros pipelines; las llamadas a Gemini en este repo están en **`functions/api`**, que usa **Secret Manager desde código**.

Para usar Gemini **solo desde Express**, habría que añadir rutas y leer `GEMINI_API_KEY` (o llamar a Vertex/Gemini con la cuenta de servicio).

### 8.3 Prefijo de ingress: `SERVICE_BASE_PATH` (solo backend)

Si el **ingress** expone el servicio bajo **`/karia-svc/v2`**:

- Definí **`SERVICE_BASE_PATH=/karia-svc/v2`** (sin barra final; el código la normaliza).
- Las rutas reales pasan a ser **`/karia-svc/v2/api/...`**, **`/karia-svc/v2/health`**, etc.
- Se mantiene además **`GET /health`** en la **raíz** del contenedor para healthchecks que apunten a `/health` sin prefijo.

En **`cloudbuild.yaml`** se fija por defecto `SERVICE_BASE_PATH=/karia-svc/v2` con `--set-env-vars`. Para otro prefijo o raíz, ajustá ese argumento o sobrescribí la variable en Cloud Run.

**Frontend (no implementado en este repo aquí):** cuando el portal se sirva bajo el mismo prefijo, tendrás que alinear **Vite `base`**, **rutas `fetch('/api/...')`**, **MSAL `redirectUri`** y el **proxy de desarrollo** / **nginx** para que apunten a `{prefijo}/api/...` y assets bajo `{prefijo}/`. Hasta entonces, un API Gateway que quite el prefijo antes de llamar al backend evita tocar el front.

---

## 9. Despliegue del backend en GCP (Cloud Run vía Cloud Build)

### Prerrequisitos

1. Proyecto GCP con APIs: **Cloud Run**, **Cloud Build**, **Artifact Registry** (o Container Registry), **Cloud SQL**, **Secret Manager**, **Cloud Storage**.
2. Bucket **`aria-library-files`** creado y permisos de lectura/escritura para la cuenta de servicio que usará Cloud Run.
3. Secretos en **Secret Manager** (nombres alineados con `cloudbuild.yaml`):
   - `gemini-api-key` (versión latest)
   - `aria-database-url` → contenido = **URI PostgreSQL completa** (mismo valor que `ConnectionString_Karia` en local: Cloud SQL, Supabase, etc.).

### Comando habitual

Desde la carpeta `aria-backend`:

```bash
gcloud builds submit --config=cloudbuild.yaml .
```

### Qué hace `cloudbuild.yaml`

1. **`docker build`** con `Dockerfile` → etiquetas `gcr.io/$PROJECT_ID/aria-backend:$COMMIT_SHA` y `:latest`.
2. **`docker push`** de esas etiquetas.
3. **`gcloud run deploy aria-backend`** en `us-central1`:
   - `--allow-unauthenticated` (API pública; endurecer según política de seguridad).
   - Límites: memoria 1 Gi, CPU 1, timeout 300 s, puerto 8080.
   - **`--set-secrets`**: inyecta `GEMINI_API_KEY` y `ConnectionString_Karia` desde Secret Manager.

### Dockerfile vs frontend embebido

La imagen actual **solo copia** `index.js` y `db.js`. Las rutas que sirven `dist/` **no tendrán SPA** a menos que copiéis `dist` en la imagen. En la práctica este backend se usa como **API** y el frontend va en otro hosting (Cloud Run aparte, CDN, etc.).

---

## 10. Desarrollo local (resumen)

```bash
cd aria-backend
npm install
copy .env.example .env   # Windows: configurar ConnectionString_Karia al menos para probar DB
```

- **API + Storage:** necesitáis credenciales GCP válidas para el bucket `aria-library-files`.
- **Solo API sin BD:** sin `ConnectionString_Karia`; funcionarán rutas GCS si hay credenciales; `/api/db/*` fallarán hasta configurar Postgres.

---

## 11. Migraciones SQL

Para una **base de datos nueva (vacía)** en v2, usar el DDL unificado:

```bash
psql "$ConnectionString_Karia" -f migrations/003_v2_four_tables.sql
```

Incluye **`initiative`**, **`intake_request`**, **`artifact_definition`** y **`library_file`** (catálogo GCS; integración Express pendiente). Detalle de bucket y tablas: **`docs/DATABASE_AUDIT.md`**.

Si aún tenéis scripts legacy `001_initial_schema.sql` / `002_aria_current_schema.sql` en otro branch, no mezclarlos con **`003`** sobre la misma BD sin revisión (riesgo de `DROP`/`CREATE` duplicado).

---

## 12. Checklist rápido “¿está todo lo necesario?”

| Necesidad | Qué revisar |
|-----------|-------------|
| Endpoints REST | Este documento §6 |
| Biblioteca de ficheros | Bucket GCS + IAM + estructura §3.1 + rutas §6.2 |
| Catálogo SQL de biblioteca | Tabla `library_file` (§5) + integración pendiente en endpoints |
| CRUD iniciativas / definiciones | `ConnectionString_Karia` + migración **`003`** §11 |
| Lectura intakes | Tabla poblada + GET `/api/db/intakes` |
| Gemini | **`functions/api`** desplegadas + Secret Manager; **Express** no usa Gemini hasta implementarlo |
| Producción Cloud Run | `cloudbuild.yaml` + secretos + cuenta de servicio con Storage |

---

*Última revisión: alineado con `index.js`, bucket `aria-library-files`, `migrations/003_v2_four_tables.sql` y `docs/DATABASE_AUDIT.md`.*
