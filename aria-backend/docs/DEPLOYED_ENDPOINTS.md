# ARIA — Endpoints desplegados (Cloud Run Functions, Kashio-Finops)

Inventario operativo de las **8 funciones HTTP activas** en producción tras la migración a **Kashio-Finops** (`us-central1`). Estas funciones provienen de las dos fuentes en este repositorio:

- `aria-backend/functions/api/index.js` → 4 funciones de IA / utilidades.
- `aria-backend/functions/library/index.js` → 4 funciones de biblioteca sobre GCS.

> Bucket de biblioteca por defecto: **`karia-library-files`** (override con env `GCS_BUCKET_NAME`).
> Categorías permitidas: **`Contexto`**, **`Output`**, **`Prompt`**, **`Template`**.

---

## Tabla resumen rápida

| # | Función | Service name | URL | Método | Input clave | Output clave |
|---|---------|--------------|-----|--------|-------------|--------------|
| 1 | `health` | `health` | `https://health-476648227615.us-central1.run.app` | GET | — | `{ status, service, timestamp }` |
| 2 | `ariaChat` | `ariachat` | `https://ariachat-476648227615.us-central1.run.app` | POST | `{ message, history? }` | `{ response, model, timestamp }` |
| 3 | `generateArtifact` | `generateartifact` | `https://generateartifact-476648227615.us-central1.run.app` | POST | `{ artifactName, gateLabel }` | `{ content, metadata }` |
| 4 | `analyzeIntake` | `analyzeintake` | `https://analyzeintake-476648227615.us-central1.run.app` | POST | `{ request: {...} }` | `{ analysis, metadata }` |
| 5 | `getLibraryFiles` | `getlibraryfiles` | `https://getlibraryfiles-476648227615.us-central1.run.app` | GET | `?category=` (opcional) | `[ { id, filePath, name, ... } ]` |
| 6 | `getLibraryUploadUrl` | `getlibraryuploadurl` | `https://getlibraryuploadurl-476648227615.us-central1.run.app` | POST | `{ filename, category, contentType? }` | `{ signedUrl, fileId, filePath }` |
| 7 | `downloadLibraryFile` | `downloadlibraryfile` | `https://downloadlibraryfile-476648227615.us-central1.run.app` | GET / POST | `filePath` | `{ signedUrl, filePath }` |
| 8 | `deleteLibraryFile` | `deletelibraryfile` | `https://deletelibraryfile-476648227615.us-central1.run.app` | DELETE / POST | `filePath` | `{ success, filePath }` |

---

## CORS configurado

### API / Gemini (`functions/api`)

```
origin:
  - https://karia-ui-app-476648227615.us-east4.run.app
  - https://aria-frontend-ih5a4tpiua-uc.a.run.app
  - https://aria-frontend-215989210525.us-central1.run.app
  - https://aria-control-center.vercel.app
  - http://localhost:3000
  - http://localhost:8082
methods: GET, POST, OPTIONS
credentials: true
```

### Library (`functions/library`)

```
origin:
  - https://karia-ui-app-476648227615.us-east4.run.app
  - http://localhost:3000
  - http://localhost:8082
methods: GET, POST, DELETE, OPTIONS
credentials: true
```

---

# 🔵 API / Gemini (4 funciones)

## 1. `health` — Health check

- **URL:** `https://health-476648227615.us-central1.run.app`
- **Service name:** `health`
- **Método:** `GET`
- **Body / Params:** ninguno
- **Respuesta 200:**

```json
{
  "status": "healthy",
  "service": "aria-api-functions",
  "timestamp": "2026-04-30T15:00:00.000Z"
}
```

---

## 2. `ariaChat` — Chatbot ARIA

- **URL:** `https://ariachat-476648227615.us-central1.run.app`
- **Service name:** `ariachat`
- **Método:** `POST` (también `OPTIONS` para CORS)
- **Headers:** `Content-Type: application/json`
- **Body:**

```json
{
  "message": "string (requerido) — pregunta del usuario",
  "history": "array (opcional) — historial de conversación previo"
}
```

- **Respuesta 200:**

```json
{
  "success": true,
  "response": "Texto generado por ARIA",
  "model": "gemini-2.5-flash-lite",
  "timestamp": "2026-04-30T15:00:00.000Z"
}
```

- **Errores:**
  - `400` → `Missing message`
  - `405` → método distinto a POST
  - `500` → fallo de Gemini

- **Ejemplo curl:**

```bash
curl -X POST "https://ariachat-476648227615.us-central1.run.app" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola ARIA, dime qué haces.","history":[]}'
```

---

## 3. `generateArtifact` — Genera contenido de artefacto PDLC

- **URL:** `https://generateartifact-476648227615.us-central1.run.app`
- **Service name:** `generateartifact`
- **Método:** `POST` (también `OPTIONS`)
- **Headers:** `Content-Type: application/json`
- **Body:**

```json
{
  "artifactName": "string (requerido) — ej. 'Business Case'",
  "gateLabel": "string (requerido) — ej. 'G1' o 'G2 - Discovery'"
}
```

- **Respuesta 200:**

```json
{
  "success": true,
  "content": "Outline generado por Gemini",
  "metadata": {
    "artifactName": "Business Case",
    "gateLabel": "G1",
    "model": "gemini-2.5-flash-lite",
    "timestamp": "2026-04-30T15:00:00.000Z"
  }
}
```

- **Errores:** `400` si falta `artifactName` o `gateLabel`.

- **Ejemplo curl:**

```bash
curl -X POST "https://generateartifact-476648227615.us-central1.run.app" \
  -H "Content-Type: application/json" \
  -d '{"artifactName":"Business Case","gateLabel":"G1"}'
```

---

## 4. `analyzeIntake` — Análisis ARIA del intake

- **URL:** `https://analyzeintake-476648227615.us-central1.run.app`
- **Service name:** `analyzeintake`
- **Método:** `POST` (también `OPTIONS`)
- **Headers:** `Content-Type: application/json`
- **Body:**

```json
{
  "request": {
    "type": "string — ej. 'New Product' | 'Feature' | 'Bug'",
    "severity": "string — ej. 'Low' | 'Medium' | 'High'",
    "problem": "string — descripción del problema",
    "outcome": "string — outcome esperado",
    "scope": ["string", "..."],
    "constraints": "string (opcional)"
  }
}
```

- **Respuesta 200:**

```json
{
  "success": true,
  "analysis": "2 oraciones con recomendación + ruta PDLC + gate inicial",
  "metadata": {
    "type": "New Product",
    "severity": "High",
    "model": "gemini-2.5-flash-lite",
    "timestamp": "2026-04-30T15:00:00.000Z"
  }
}
```

- **Errores:** `400` si falta `request`.

- **Ejemplo curl:**

```bash
curl -X POST "https://analyzeintake-476648227615.us-central1.run.app" \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "type": "New Product",
      "severity": "High",
      "problem": "Onboarding muy lento",
      "outcome": "Reducir onboarding 40%",
      "scope": ["UX","Backend","Compliance"],
      "constraints": "Antes de Q3"
    }
  }'
```

---

# 🟢 Library / Cloud Storage (4 funciones)

## 5. `getLibraryFiles` — Lista archivos del bucket

- **URL:** `https://getlibraryfiles-476648227615.us-central1.run.app`
- **Service name:** `getlibraryfiles`
- **Método:** `GET`
- **Query params (opcionales):**
  - `category` → filtra por categoría (`Contexto` | `Output` | `Prompt` | `Template`)
- **Ejemplos:**
  - `GET https://getlibraryfiles-476648227615.us-central1.run.app` → todos los archivos
  - `GET https://getlibraryfiles-476648227615.us-central1.run.app?category=Template` → solo Templates

- **Respuesta 200:** array de archivos

```json
[
  {
    "id": "lib-1730301800-Plan_Producto.pdf",
    "filePath": "Template/lib-1730301800-Plan_Producto.pdf",
    "name": "Plan_Producto.pdf",
    "category": "Template",
    "uploadedAt": "2026-04-30T14:00:00.000Z",
    "updatedAt": "2026-04-30T14:00:00.000Z",
    "size": 234567,
    "url": "gs://karia-library-files/Template/lib-1730301800-Plan_Producto.pdf",
    "contentType": "application/pdf"
  }
]
```

- **Errores:** `400` si `category` es inválida.

> **Importante:** el campo **`filePath`** devuelto en cada item es el que debe usarse en `downloadLibraryFile` y `deleteLibraryFile`.

---

## 6. `getLibraryUploadUrl` — URL firmada para subir archivo

- **URL:** `https://getlibraryuploadurl-476648227615.us-central1.run.app`
- **Service name:** `getlibraryuploadurl`
- **Método:** `POST`
- **Headers:** `Content-Type: application/json`
- **Body:**

```json
{
  "filename": "string (requerido) — ej. 'Plan_Producto.pdf'",
  "category": "string (requerido) — Contexto|Output|Prompt|Template",
  "contentType": "string (opcional) — ej. 'application/pdf'"
}
```

- **Respuesta 200:**

```json
{
  "signedUrl": "https://storage.googleapis.com/...",
  "fileId": "lib-1730301800-Plan_Producto.pdf",
  "filePath": "Template/lib-1730301800-Plan_Producto.pdf",
  "bucket": "karia-library-files",
  "expiresInMinutes": 15
}
```

- **Errores:**
  - `400` si falta `filename`/`category`
  - `400` si `category` no es una de las permitidas

- **Cómo usarla desde el front (flujo de 2 pasos):**

```js
const { signedUrl, filePath } = await fetch(
  'https://getlibraryuploadurl-476648227615.us-central1.run.app',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      category: 'Template',
      contentType: file.type
    })
  }
).then(r => r.json());

await fetch(signedUrl, {
  method: 'PUT',
  headers: { 'Content-Type': file.type },
  body: file
});
```

---

## 7. `downloadLibraryFile` — URL firmada para descarga

- **URL:** `https://downloadlibraryfile-476648227615.us-central1.run.app`
- **Service name:** `downloadlibraryfile`
- **Método:** `GET` o `POST`
- **Query params (recomendado):**
  - `filePath` → ruta completa del archivo (ej. `Template/lib-1730301800-Plan_Producto.pdf`)
- **Body alternativo (POST):**

```json
{ "filePath": "Template/lib-1730301800-Plan_Producto.pdf" }
```

- **Ejemplo:**

```
GET https://downloadlibraryfile-476648227615.us-central1.run.app?filePath=Template/lib-1730301800-Plan_Producto.pdf
```

- **Respuesta 200:**

```json
{
  "signedUrl": "https://storage.googleapis.com/...",
  "filePath": "Template/lib-1730301800-Plan_Producto.pdf",
  "expiresInMinutes": 15
}
```

- **Errores:**
  - `400` → `filePath is required`
  - `404` → `File not found`

---

## 8. `deleteLibraryFile` — Elimina archivo del bucket

- **URL:** `https://deletelibraryfile-476648227615.us-central1.run.app`
- **Service name:** `deletelibraryfile`
- **Método:** `DELETE` o `POST`
- **Query params:**
  - `filePath` → ruta completa del archivo
- **Body alternativo:**

```json
{ "filePath": "Template/lib-1730301800-Plan_Producto.pdf" }
```

- **Ejemplo:**

```
DELETE https://deletelibraryfile-476648227615.us-central1.run.app?filePath=Template/lib-1730301800-Plan_Producto.pdf
```

- **Respuesta 200:**

```json
{
  "success": true,
  "filePath": "Template/lib-1730301800-Plan_Producto.pdf"
}
```

- **Errores:**
  - `400` → `filePath is required`
  - `404` → `File not found`

---

## Notas operativas para el front

1. **Flujo de upload** (2 pasos):
   1. `POST` a `getLibraryUploadUrl` → recibe `signedUrl` + `filePath`
   2. `PUT` al `signedUrl` con el binario del archivo y el mismo `Content-Type` declarado

2. **Download / Delete** ahora usan `filePath` (ruta completa, ej. `Template/lib-...md`), **no** `fileId` solo. Tomar el `filePath` que devuelve `getLibraryFiles` en cada item.

3. **Hardening aplicado** (ver `functions/library/index.js`):
   - Eliminado el uso de `req.params[0]` (causaba `Cannot read properties of undefined` al llamar la URL directa).
   - Reemplazado `files.find(f => f.name.includes(fileId))` por acceso directo `bucket.file(filePath)` + `file.exists()` (evita falsos positivos por sub-cadenas).
   - CORS restringido a orígenes Karia (antes `origin: true`).
   - Validación de categorías permitidas y `sanitizeFileName()` en upload.

4. **Modelos Gemini con fallback** (ver `functions/api/index.js`): orden `gemini-2.5-flash-lite` → `gemini-2.5-flash`. La respuesta incluye `model` o `metadata.model` para trazabilidad.

5. **Autenticación:** las funciones se desplegaron con `--allow-unauthenticated` para validación. Para endurecer en producción, retirar el flag y exigir `Authorization: Bearer <id_token>` (ver §7.4 en `BACKEND_REFERENCE.md`).
