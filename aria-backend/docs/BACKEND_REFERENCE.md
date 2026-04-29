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
| **`migrations/`** | SQL **PostgreSQL**; se aplican aparte (no van dentro de la imagen Docker actual). |
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
| **pg (`node-postgres`)** | Cliente PostgreSQL; usa **`ConnectionString_Karia`** y opciones TLS opcionales **`DB_SSL_CA`** / **`DB_SSL_REJECT_UNAUTHORIZED`** (ver §8.4). |
| **@google-cloud/storage** | Cliente oficial para **Google Cloud Storage (GCS)**; lista objetos, firma URLs, sube/borra archivos en el bucket configurado por código. |
| **Credenciales GCP** | En Cloud Run usa la **cuenta de servicio del propio servicio** (ADC). En local suele hacer falta `gcloud auth application-default login` o `GOOGLE_APPLICATION_CREDENTIALS` apuntando a un JSON de cuenta de servicio con permisos sobre el bucket. |
| **@google-cloud/functions-framework** | Solo en **`functions/*/index.js`**: convierte handlers HTTP en funciones desplegables como **Cloud Functions (2ª gen)**. |
| **@google/generative-ai** | Solo en **`functions/api/index.js`**: llamadas a **Gemini**; la clave en prod viene de **Secret Manager** (no del `.env` del Express). |
| **Docker** | Empaqueta `index.js` + `db.js` + `node_modules` para **Cloud Run**. |
| **Cloud Build** | CI/CD en GCP: construye imagen y ejecuta `gcloud run deploy`. |

---

## 3. Mapa Google Cloud (con que esta "conectado"?)

Region habitual: **`us-central1`**. Intervienen **dos proyectos GCP**: **Kashio FinOps** (bucket + secreto Gemini) y **`kashio-squad-nova`** (muchas Cloud Functions y otros secretos legacy; ver §7 y §10).

| Rol | Proyecto (consola) | Notas |
|-----|-------------------|--------|
| **Biblioteca y artefactos (GCS)** | **Kashio FinOps** — **`Kashio-Finops`** | Bucket **`karia-library-files`**, **us-central1 (Iowa)**, clase **Standard**, **no publico**. Estructura: `Contexto/`, `Prompt/`, `Template/`, `Output/` (subcarpetas por gate). Sustituye el antiguo bucket **`aria-library-files`** en el flujo migrado. |
| **Secret Manager — clave Gemini** | **Kashio FinOps** — **`Kashio-Finops`** | Secreto **`gemini-api-key`**, versión **1**, estado **Habilitada**, cifrado administrado por Google. Ruta `projects/kashio-finops/secrets/gemini-api-key`. Es la fuente de verdad para la API de Gemini (consumida por `functions/api` y opcionalmente por Cloud Run vía `--set-secrets`). |
| **Cloud Functions (URLs históricas) + otros secretos** | **`kashio-squad-nova`** | URLs `https://us-central1-kashio-squad-nova.cloudfunctions.net/...`. Otros secretos de integración pueden seguir aquí; **`functions/api`** lee `gemini-api-key` desde FinOps (ver §10 y variable **`GEMINI_SECRET_PROJECT_ID`** en código). |

**Nombre del bucket:** el **ID de recurso en GCP** es **`karia-library-files`** (globally unique, en minusculas). Si en reuniones o specs aparece un nombre tipo **"Cloud ARIA Library files"**, debe mapearse a ese ID. En runtime se puede sobreescribir con **`GCS_BUCKET_NAME`** (ver §8.1).

```
+----------------------------------------------------------------------+
|  Cloud Run - servicio "aria-backend"                                 |
|  * Imagen: Container Registry / Artifact Registry                    |
|  * Cuenta de servicio -> ADC para Storage (proyecto con el bucket)   |
|  * Secretos inyectados al arrancar (ver S10) + GCS_BUCKET_NAME       |
+------------+----------------------------+-----------------------------+
             |                            |
             v                            v
  +--------------------+       +------------------------+
  | PostgreSQL         |       | Cloud Storage          |
  | Conexion directa   |       | Bucket (FinOps):       |
  | TCP/TLS via        |       | karia-library-files    |
  | ConnectionString   |       | Kashio-Finops /        |
  | _Karia. Tablas S5  |       |  Contexto|Prompt|     |
  +--------------------+       |  Template|Output      |
                               +------------------------+

+----------------------------------------------------------------------+
|  Cloud Run Functions (26+ funciones - ver S7)                        |
|  Proyecto tipico hoy: kashio-squad-nova  Region: us-central1         |
|  * CRUD, biblioteca serverless, IA (Gemini)                          |
+----------------------------------------------------------------------+

+----------------------------------------------------------------------+
|  Secret Manager (ver S10)                                            |
|  * gemini-api-key -> proyecto kashio-finops                          |
|  * otros secretos / integraciones -> muchos en kashio-squad-nova     |
+----------------------------------------------------------------------+
```

### 3.1 Estructura de objetos en `karia-library-files` (Kashio FinOps)

El codigo usa **`GCS_BUCKET_NAME`** con valor por defecto **`karia-library-files`** (`index.js`). El arbol coincide con el **navegador de carpetas** de Cloud Storage y con el modal "Cargar Archivo" del frontend (categorias **Contexto**, **Prompt**, **Template**, **Output**).

**Contenido tipico:** en **`Template/`** conviven Markdown (p. ej. `lib-{timestamp}-Plantilla_*.md`, `Artefacto_*.md`) y PDFs; en **`Output/`** hay subcarpetas por gate (**G1**–**G5** visibles en consola; **G0** cuando la API publica sin gate). Archivos bajo **Contexto / Prompt / Template** siguen el prefijo `lib-{timestamp}-{nombre}` en subidas por URL firmada.

```
karia-library-files/
├── Contexto/
│   └── lib-{timestamp}-{nombreArchivo}
├── Prompt/
├── Template/              # Plantillas .md / .pdf (p. ej. Plantilla_*, Artefacto_*)
├── Output/
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

Las rutas **`/api/library/*`** y **`/api/artifacts/*`** operan **solo sobre el bucket** configurado (por defecto **`karia-library-files`**, FinOps; ver §3.1 y **`GCS_BUCKET_NAME`**), no sobre `library_file` hasta que se añada la escritura SQL.

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

## 7. Cloud Functions en `functions/` y funciones desplegadas en Cloud Run

El proyecto **`kashio-squad-nova`** tiene **26+ funciones** activas desplegadas como **Cloud Run Functions** en `us-central1`. Cada una tiene su propia URL y requiere autenticacion. Las fuentes en este repositorio son `functions/api/index.js` y `functions/library/index.js`; el resto fue desplegado de forma independiente.

### 7.1 Fuente `functions/api/index.js` - Gemini IA

Usa **`@google-cloud/secret-manager`** para obtener la clave Gemini en runtime desde el secreto **`gemini-api-key`** del proyecto **Kashio FinOps** (ruta `projects/${PROJECT_ID}/secrets/gemini-api-key/versions/latest`). El proyecto se resuelve por orden: **`PROJECT_ID`** → **`GOOGLE_CLOUD_PROJECT`** → default **`kashio-finops`** (alfanumérico). Implementa fallback entre **`gemini-2.5-flash-lite`** y **`gemini-2.5-flash`** (sin previews). Las respuestas JSON incluyen **`metadata.model`** o **`model`** según el endpoint.

| Funcion (handler) | Metodo | Descripcion |
|-------------------|--------|-------------|
| `generateArtifact` | POST | Genera un outline profesional para un artefacto PDLC dado su nombre y gate (G0-G5). Usa Gemini con contexto de Kashio Fintech. |
| `analyzeIntake` | POST | Analiza un intake request (tipo, severidad, problema, resultado esperado) y devuelve recomendacion de ruta PDLC (Fast Track / Discovery / Standard) y gate de entrada. |
| `ariaChat` | POST | Chatbot ARIA: recibe mensaje e historial, responde como agente experto en PDLC de Kashio (Gates, SLAs, artefactos, alineacion estrategica). |
| `health` | GET | Estado del servicio `aria-api-functions`. |

### 7.2 Fuente `functions/library/index.js` - Biblioteca GCS

Operaciones directas sobre el mismo bucket de biblioteca (por defecto **`karia-library-files`**). Alternativa a los mismos endpoints de Express en `index.js`.

| Funcion (handler) | Metodo | Descripcion |
|-------------------|--------|-------------|
| `getLibraryFiles` | GET | Lista todos los archivos del bucket con metadatos (categoria, tamano, fecha, contentType). |
| `getLibraryUploadUrl` | POST | Genera URL firmada de subida (V4, 15 min) para `{category}/lib-{timestamp}-{filename}`. |
| `downloadLibraryFile` | GET | Genera URL firmada de lectura (V4, 15 min) dado un `fileId`. |
| `deleteLibraryFile` | DELETE | Elimina un objeto del bucket dado su `fileId`. |

### 7.3 Funciones CRUD adicionales desplegadas en Cloud Run (kashio-squad-nova)

Las siguientes funciones estan desplegadas y activas como Cloud Run Functions independientes. No forman parte de la imagen Docker del backend Express; cada una tiene su propio endpoint HTTPS con autenticacion requerida.

| Nombre en Cloud Run | Descripcion funcional |
|---------------------|-----------------------|
| `analyzaintake` | Equivalente desplegado de `analyzeIntake`: analiza un intake y recomienda ruta PDLC via Gemini. |
| `ariachat` | Equivalente desplegado de `ariaChat`: chat ARIA con contexto PDLC de Kashio. |
| `cleanalldata` | Funcion de mantenimiento: limpia / resetea datos del sistema (uso restringido). |
| `cleang2artifacts` | Limpia o resetea los artefactos del gate G2 en la base de datos o bucket. |
| `confirmupload` | Confirma que una subida firmada a GCS se completo exitosamente; puede actualizar metadatos. |
| `convertintaketoinitiative` | Convierte un intake request aprobado en una nueva iniciativa en PostgreSQL. |
| `creategatestatus` | Crea o inicializa el estado de los gates para una iniciativa (tabla de estado de pipeline). |
| `createinitiative` | Inserta una nueva iniciativa en la tabla `initiative` de PostgreSQL. |
| `createintakerequest` | Inserta un nuevo intake request en la tabla `intake_request` de PostgreSQL. |
| `createlibraryfile` | Registra un nuevo archivo en la biblioteca: sube a GCS y/o guarda metadatos en `library_file`. |
| `createproduct` | Crea un nuevo producto en el catalogo de productos. |
| `createproducttable` | Crea o inicializa la tabla de productos en la base de datos (migracion puntual). |
| `deletelibraryfile` | Elimina un archivo de la biblioteca desde GCS (equivalente a `DELETE /api/library/delete/:fileId`). |
| `deleteproduct` | Elimina un producto del catalogo de productos. |
| `downloadlibraryfile` | Genera URL firmada de descarga para un archivo de biblioteca (equivalente a `GET /api/library/download/:fileId`). |
| `generateartifact` | Equivalente desplegado de `generateArtifact`: genera outline de artefacto PDLC con Gemini. |
| `generatedownloadurl` | Genera URL firmada de descarga para un objeto GCS arbitrario. |
| `generateuploadurl` | Genera URL firmada de subida para incorporar archivos a la biblioteca. |
| `getallgatesstatus` | Devuelve el estado actual de todos los gates de una o todas las iniciativas. |
| `getallinitiatives` | Lista todas las iniciativas desde PostgreSQL (equivalente a `GET /api/db/initiatives`). |
| `getallintakerequests` | Lista todos los intake requests desde PostgreSQL (equivalente a `GET /api/db/intakes`). |
| `getalllibraryfiles` | Lista todos los archivos del bucket de biblioteca (p. ej. `karia-library-files`) con metadatos (equivalente a `GET /api/library/files`). |
| `getalloes` | Lista todas las Entidades Operativas (OEs) del portafolio. |
| `getallokr` | Lista todos los OKRs del portafolio. |
| `getallportfolioinitiatives` | Lista las iniciativas del portafolio con vista consolidada (portfolio view). |
| `getallproducts` | Lista todos los productos del catalogo. |

> **Nota:** las funciones con icono de advertencia en la consola Cloud Run (senaladas con triangulo amarillo) pueden tener una revision pendiente de despliegue o una variable de entorno no configurada en esa revision. Las funciones en si estan activas y responden.

### 7.4 Prueba manual de funciones protegidas por IAM (ejemplo `ariaChat`)

Las funciones desplegadas en `us-central1-kashio-squad-nova.cloudfunctions.net` suelen exigir **autenticación**. Para que una prueba funcione hacen falta **cuatro cosas**:

1. **Método `POST`** (no basta abrir la URL en el navegador).
2. **`Authorization: Bearer <token>`** — token de identidad de Google (`gcloud auth print-identity-token`). El encabezado puede ir como `Bearer` o `bearer`; GCP lo acepta.
3. **`Content-Type: application/json`**
4. **Cuerpo JSON** con al menos **`message`** (y opcionalmente **`history`**, p. ej. `[]`).

**Comando de referencia** (terminal local o Cloud Shell, con `gcloud` autenticado):

```bash
curl -X POST "https://us-central1-kashio-squad-nova.cloudfunctions.net/ariaChat" \
  -H "Authorization: bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola ARIA, dime que haces.","history":[]}'
```

**Por qué el navegador muestra 403:** al pegar solo la URL, el navegador hace **GET** y no envía token; la función espera **POST** + Bearer.

**Check verde funcional:** respuesta HTTP **200** y en logs de la función un mensaje tipo **`Chat response generated`** (o el cuerpo JSON con `success: true` y el texto en `response`). Eso confirma que Gemini respondió tras leer la clave desde Secret Manager.

El mismo patrón (POST + Bearer + JSON) aplica a **`generateArtifact`**, **`analyzeIntake`** y al resto de funciones que tengan *Require authentication* en Cloud Run/Functions.

### 7.5 Plan de redespliegue en **Kashio FinOps** (Cloud Run Functions Gen 2, Node 22)

Solo se redespliegan **4 funciones IA + health** (`functions/api`). El paquete **`functions/library`** queda como **legacy / no se redespliega**: la biblioteca pasa a Express (ver `docs/mejoras.md`).

#### A. Cambios obligatorios ya aplicados en código

| Cambio | Detalle |
|--------|---------|
| `PROJECT_ID` | Resolución dinámica: `process.env.PROJECT_ID || GOOGLE_CLOUD_PROJECT || 'kashio-finops'` (antes hardcoded a `kashio-squad-nova`). |
| Runtime | `package.json` (`engines.node = ">=22"`); usar **`--runtime=nodejs22`** en `gcloud functions deploy` (Cloud Functions Gen 2 acepta `nodejs20`, `nodejs22`, `nodejs24`). El backend Express en Docker usa **`node:24-alpine`**. |
| `package.json` (`functions/api`) | `@google-cloud/functions-framework ^5.0.2`, `@google-cloud/secret-manager ^6.1.1`, `@google/generative-ai ^0.24.1`, `cors ^2.8.6`. `"type": "module"` (porque `index.js` usa `import`). |
| Bucket | `GCS_BUCKET_NAME=karia-library-files` (FinOps). |

#### B. IAM previo

- Cuenta de servicio de ejecución de las funciones con rol **Secret Manager Secret Accessor** sobre `projects/kashio-finops/secrets/gemini-api-key`.
- Si el bucket vive en otro proyecto, también **Storage Object Admin** sobre `karia-library-files`.

#### C. Visibilidad recomendada

- **Pruebas:** desplegar con `--allow-unauthenticated` para validar end-to-end sin token.
- **Producción:** retirar el flag y exigir IAM + Bearer token (ver §7.4).

#### D. Comandos de despliegue (orden recomendado)

```bash
# Seleccionar proyecto FinOps
gcloud config set project kashio-finops
cd aria-backend/functions/api

# 1) health (no toca Gemini ni Secret Manager → smoke test del deploy)
gcloud functions deploy health \
  --gen2 --runtime=nodejs22 --region=us-central1 \
  --source=. --entry-point=health \
  --trigger-http --allow-unauthenticated \
  --set-env-vars=PROJECT_ID=kashio-finops

# 2) ariaChat
gcloud functions deploy ariaChat \
  --gen2 --runtime=nodejs22 --region=us-central1 \
  --source=. --entry-point=ariaChat \
  --trigger-http --allow-unauthenticated \
  --set-env-vars=PROJECT_ID=kashio-finops

# 3) generateArtifact
gcloud functions deploy generateArtifact \
  --gen2 --runtime=nodejs22 --region=us-central1 \
  --source=. --entry-point=generateArtifact \
  --trigger-http --allow-unauthenticated \
  --set-env-vars=PROJECT_ID=kashio-finops

# 4) analyzeIntake
gcloud functions deploy analyzeIntake \
  --gen2 --runtime=nodejs22 --region=us-central1 \
  --source=. --entry-point=analyzeIntake \
  --trigger-http --allow-unauthenticated \
  --set-env-vars=PROJECT_ID=kashio-finops
```

#### E. Verificación post-despliegue

```bash
# Smoke
curl "https://us-central1-kashio-finops.cloudfunctions.net/health"

# Chat (con allow-unauthenticated)
curl -X POST "https://us-central1-kashio-finops.cloudfunctions.net/ariaChat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola ARIA, dime que haces.","history":[]}'

# Outline de artefacto
curl -X POST "https://us-central1-kashio-finops.cloudfunctions.net/generateArtifact" \
  -H "Content-Type: application/json" \
  -d '{"artifactName":"Business Case","gateLabel":"G1"}'

# Análisis de intake
curl -X POST "https://us-central1-kashio-finops.cloudfunctions.net/analyzeIntake" \
  -H "Content-Type: application/json" \
  -d '{"request":{"type":"New Product","severity":"High","problem":"Customers need a faster onboarding process","outcome":"Reduce onboarding time by 40%","scope":["UX","Backend","Compliance"],"constraints":"Must be launched before Q3"}}'
```

> **Nota cache de la API key:** `getGeminiApiKey()` cachea en memoria (`cachedApiKey`). Tras rotar el secreto en Secret Manager, hacer **redeploy** o reiniciar la función para forzar la lectura de la nueva versión.

---
## 8. Variables de entorno necesarias para que “todo funcione”

### 8.1 Servidor Express (`node index.js`)

| Variable | Obligatoria | Uso real en código |
|----------|-------------|---------------------|
| **`PORT`** | No | Puerto HTTP (default **8080**). Cloud Run suele inyectar `8080`. |
| **`ConnectionString_Karia`** | Para `/api/db/*` | URI PostgreSQL (`postgresql://…`), **conexión directa** al servidor (TCP/TLS). Sin ella el servidor **arranca**, pero rutas DB fallan (`Database not configured`). |
| **`DB_SSL_CA`** | No | Ruta a archivo **PEM** con el certificado raíz/intermedio del proveedor. Activa TLS con verificación usando ese CA (recomendado en prod). Ver §8.4. |
| **`DB_SSL_REJECT_UNAUTHORIZED`** | No | Si vale **`false`** o **`0`**, Node **no** valida la cadena del certificado del servidor (`ssl.rejectUnauthorized: false`). Útil en **dev** ante `self-signed certificate in certificate chain`; en prod preferí **`DB_SSL_CA`**. Ver §8.4. |
| **`GOOGLE_APPLICATION_CREDENTIALS`** | Solo si ADC no está disponible | Ruta al JSON de cuenta de servicio para **Storage** en local. |
| **`GCS_BUCKET_NAME`** | No | ID del bucket de biblioteca/artefactos para rutas GCS. Por defecto **`karia-library-files`** (proyecto **Kashio FinOps**, región **us-central1**). Sobrescribir si el bucket vive bajo otro nombre o proyecto vinculado por IAM. |
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

### 8.4 PostgreSQL directo y TLS (`db.js`)

El backend **no depende** del [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy): basta una URI estándar en **`ConnectionString_Karia`** hacia cualquier Postgre alcanzable (misma VPC, internet con firewall, Supabase, etc.).

Node (`pg` + TLS) valida la cadena del certificado del servidor. Si el proveedor usa una CA que no está en el almacén por defecto de Node, o hay un certificado autofirmado en la cadena, aparece:

`self-signed certificate in certificate chain`

**Qué hacer:**

1. **Producción (recomendado):** obtener el **PEM del CA** del proveedor (documentación del hosting), guardarlo en un volumen/secreto y definir **`DB_SSL_CA`** con la ruta absoluta o relativa al proceso (en Cloud Run: montar secreto como archivo y apuntar `DB_SSL_CA` ahí).
2. **Solo desarrollo o red totalmente de confianza:** **`DB_SSL_REJECT_UNAUTHORIZED=false`** en `.env`. El servidor loguea un aviso; **no** uses esto en internet abierta sin otra capa de confianza.

**Aviso de `pg` / `sslmode`:** versiones recientes tratan `sslmode=require` de forma estricta respecto a TLS. Si tu URI lleva `sslmode=require` y seguís con errores de CA, la solución correcta sigue siendo **`DB_SSL_CA`** o el PEM que distribuya el proveedor, no mezclar modos al azar.

---

## 9. Despliegue del backend en GCP (Cloud Run vía Cloud Build)

### Prerrequisitos

1. Proyecto GCP con APIs: **Cloud Run**, **Cloud Build**, **Artifact Registry** (o Container Registry), **Secret Manager**, **Cloud Storage**. La base de datos es **PostgreSQL** con **conexión directa** desde Cloud Run (URI en `ConnectionString_Karia`); no se usa Cloud SQL como servicio gestionado.
2. En **Kashio FinOps** (`Kashio-Finops`): bucket **`karia-library-files`** creado en **us-central1**, clase Standard, no público; la cuenta de servicio de Cloud Run debe tener **lectura/escritura** sobre ese bucket. Definir **`GCS_BUCKET_NAME=karia-library-files`** en el servicio si no se usa el default del código. Si el servicio Cloud Run se despliega en **otro** proyecto GCP (p. ej. `kashio-squad-nova`), la misma cuenta de servicio necesita IAM sobre el bucket en FinOps (p. ej. **Storage Object Admin** en `karia-library-files`).
3. Secretos en **Secret Manager** (nombres alineados con `cloudbuild.yaml`):
   - **`gemini-api-key`** en proyecto **Kashio-Finops** (versión **1** o `latest`; ver §10.1).
   - **`aria-database-url`** (u otro nombre acordado) → contenido = **URI PostgreSQL completa** (mismo valor que `ConnectionString_Karia` en local). Suele vivir en el mismo proyecto que el Cloud Run que desplegáis, o referenciarlo en forma cross-project como el secreto Gemini.

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
   - Si **Cloud Run** se despliega en el **mismo** proyecto que el secreto (`Kashio-Finops`), basta `GEMINI_API_KEY=gemini-api-key:latest`. Si el servicio vive en **otro** proyecto (p. ej. `kashio-squad-nova`) pero el secreto sigue solo en FinOps, usá la forma cross-project: `GEMINI_API_KEY=projects/476648227615/secrets/gemini-api-key:latest` y concedé a la cuenta de servicio de ejecución el rol **Secret Manager Secret Accessor** sobre ese secreto en FinOps.

### Dockerfile vs frontend embebido

La imagen actual **solo copia** `index.js` y `db.js`. Las rutas que sirven `dist/` **no tendrán SPA** a menos que copiéis `dist` en la imagen. En la práctica este backend se usa como **API** y el frontend va en otro hosting (Cloud Run aparte, CDN, etc.).

---

## 10. Secret Manager — catálogo y proyectos

El **bucket de biblioteca** vive en **Kashio FinOps** (`karia-library-files`; ver §3). Los secretos **no** tienen que estar todos en el mismo proyecto: hoy **`gemini-api-key`** está creado y gestionado en **Kashio FinOps** (`Kashio-Finops` en el selector de la consola).

### 10.1 Kashio FinOps — secreto Gemini (fuente actual)

| Campo | Valor |
|--------|--------|
| **Proyecto (consola)** | **Kashio-Finops** |
| **Nombre del secreto** | **`gemini-api-key`** |
| **Ruta de recurso** | `projects/kashio-finops/secrets/gemini-api-key` (en consola también aparece `projects/476648227615/...`; ambos valen) |
| **Versión** | **1** (habilitada; cifrado administrado por Google) |
| **Consumidores** | `functions/api` (lectura en runtime vía `@google-cloud/secret-manager`), Cloud Run `aria-backend` si inyectáis `GEMINI_API_KEY` desde el mismo secreto |
| **Variable de entorno en Cloud Functions** | `PROJECT_ID=kashio-finops` (se inyecta con `--set-env-vars` al desplegar; ver §7.5) |

**Código (`functions/api/index.js`):** la ruta usa `PROJECT_ID` con orden de resolución `PROJECT_ID` → `GOOGLE_CLOUD_PROJECT` → default **`kashio-finops`** (ID alfanumérico). En despliegues sobre FinOps `GOOGLE_CLOUD_PROJECT` suele venir poblado por GCP; aun así, el `--set-env-vars=PROJECT_ID=kashio-finops` en el despliegue (§7.5) lo deja explícito.

### 10.2 kashio-squad-nova — otros secretos (referencia legacy / integraciones)

Siguen documentados aquí porque aparecieron en inventarios anteriores; **validá en consola** en qué proyecto vive cada uno hoy (puede ser **`kashio-squad-nova`**, **Kashio-Finops** u otro).

| Nombre del secreto | Tipo | Quien lo consume | Descripcion |
|--------------------|------|-----------------|-------------|
| **`db-password`** | Credencial BD | Backend Express (dentro de `ConnectionString_Karia`) | Contrasena del servidor PostgreSQL. Se usa componiendola dentro de la URI de conexion directa. |
| **`aria-database-url`** | URI conexion | Cloud Run backend | URI PostgreSQL completa (`postgresql://usuario:pass@host:5432/bd`). Se inyecta como `ConnectionString_Karia` al desplegarse via `cloudbuild.yaml`. Mismo valor que la variable local en `.env`. |
| **`connection-buxeh45github-...`** | Token OAuth | Cloud Build | Credencial de conexion entre Cloud Build y el repositorio GitHub (`buxeh45`). Permite disparar builds automaticos desde push/PR. |
| **`bitbucketCloudApiToken-*`** | API Token | Cloud Build / integraciones | Token de API de Bitbucket Cloud. Existen multiples versiones desplegadas en `us-central1` y `europe-west1` para distintos ambientes o pipelines. |
| **`bitbucketCloudWebhook-*`** | Webhook secret | Cloud Build / webhooks | Secreto de verificacion de webhooks entrantes desde Bitbucket Cloud. Multiples instancias por region y ambiente. |
| **`confluence_api_token`** | API Token | Integraciones / funciones | Token de API de Atlassian Confluence. Permite a funciones o pipelines leer/escribir documentacion en el espacio de Confluence del proyecto. |
| **`gitlabReadApiToken-buxca3y`** | API Token (lectura) | Cloud Build / integraciones | Token de lectura de la API de GitLab para la organizacion `buxca3y`. Se usa para leer repositorios o pipelines desde GCP. |
| **`gitlabWebhook-buxca3y`** | Webhook secret | Cloud Build / webhooks | Secreto de verificacion de webhooks entrantes desde GitLab (org `buxca3y`). |
| **`IT-KRESOLVE-API_URL`** | URL de servicio | Funciones de integracion IT | URL base de la API del sistema IT-KResolve. Consumida por funciones que crean o consultan tickets/solicitudes IT. |
| **`IT-KRESOLVE-APP_CLIENT_ID`** | Client ID OAuth | Funciones de integracion IT | Client ID de la aplicacion registrada en IT-KResolve para autenticacion OAuth. Acompana a un secreto de client secret (no visible en la captura). |

### Como se accede en codigo

**Desde Cloud Run Functions (`functions/api/index.js`):** orden `PROJECT_ID` → `GOOGLE_CLOUD_PROJECT` → default `kashio-finops`.
```js
const secretClient = new SecretManagerServiceClient();
const PROJECT_ID = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'kashio-finops';
const [version] = await secretClient.accessSecretVersion({
  name: `projects/${PROJECT_ID}/secrets/gemini-api-key/versions/latest`,
});
const apiKey = version.payload.data.toString();
```

**Desde Cloud Run vía `cloudbuild.yaml`** (mismo proyecto que el secreto FinOps):
```yaml
'--set-secrets=GEMINI_API_KEY=gemini-api-key:latest,ConnectionString_Karia=aria-database-url:latest'
'--set-env-vars=SERVICE_BASE_PATH=/karia-svc/v2,GCS_BUCKET_NAME=karia-library-files,PROJECT_ID=kashio-finops'
```
Si **Cloud Run** está en otro proyecto y el secreto Gemini solo existe en FinOps, referencialo en forma cross-project:
```yaml
'--set-secrets=GEMINI_API_KEY=projects/kashio-finops/secrets/gemini-api-key:latest,...'
```
El valor llega como variable de entorno al proceso Node; **`index.js` no** llama a Secret Manager para Gemini (solo lo haría si implementáis esa ruta).

---
## 11. Desarrollo local (resumen)

```bash
cd aria-backend
npm install
copy .env.example .env   # Windows: configurar ConnectionString_Karia al menos para probar DB
```

- **API + Storage:** credenciales GCP con acceso al proyecto que contiene el bucket (FinOps: **`karia-library-files`**) y variable **`GCS_BUCKET_NAME`** si no usáis el default.
- **Solo API sin BD:** sin `ConnectionString_Karia`; funcionarán rutas GCS si hay credenciales; `/api/db/*` fallarán hasta configurar Postgres.

---

## 12. Migraciones SQL

Para una **base de datos nueva (vacía)** en v2, usar el DDL unificado:

```bash
psql "$ConnectionString_Karia" -f migrations/003_v2_four_tables.sql
```

Incluye **`initiative`**, **`intake_request`**, **`artifact_definition`** y **`library_file`** (catálogo GCS; integración Express pendiente). Detalle de bucket y tablas: **`docs/DATABASE_AUDIT.md`**.

Si aún tenéis scripts legacy `001_initial_schema.sql` / `002_aria_current_schema.sql` en otro branch, no mezclarlos con **`003`** sobre la misma BD sin revisión (riesgo de `DROP`/`CREATE` duplicado).

---

## 13. Checklist rápido “¿está todo lo necesario?”

| Necesidad | Qué revisar |
|-----------|-------------|
| Endpoints REST | Este documento §6 |
| Biblioteca de ficheros | Bucket GCS + IAM + estructura §3.1 + rutas §6.2 |
| Catálogo SQL de biblioteca | Tabla `library_file` (§5) + integración pendiente en endpoints |
| CRUD iniciativas / definiciones | `ConnectionString_Karia` + migración **`003`** §11 |
| Lectura intakes | Tabla poblada + GET `/api/db/intakes` |
| Gemini | **`functions/api`** + secreto **`gemini-api-key`** en **Kashio-Finops** (§10.1); **Express** no usa Gemini en código hasta implementarlo |
| Producción Cloud Run | `cloudbuild.yaml` + secretos + cuenta de servicio con Storage |

---

*Última revisión: `PROJECT_ID=kashio-finops` (default en `functions/api`), Node.js **22** (Cloud Functions) y **24** (Express en Docker), Express 5, dependencias bumpeadas a últimas (ver `package.json`), bucket **`karia-library-files`**, secreto **`gemini-api-key`** en Kashio-Finops.*
