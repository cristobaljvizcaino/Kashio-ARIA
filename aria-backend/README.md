# ARIA Backend (Express + TypeScript)

Servidor HTTP del producto **ARIA** para Kashio FinOps. Expone la API REST que consume el frontend (Postgres + Cloud Storage). Las **8 Cloud Run Functions** quedan en `functions/` solo como referencia/origen del despliegue serverless; **no** forman parte de este servicio.

---

## Estructura

```
aria-backend/
├── src/
│   ├── config/         # env, conexión Postgres, cliente GCS
│   ├── const/          # listas/enums fijos (categorías, TTLs)
│   ├── controllers/    # handlers Express (entrada / salida HTTP)
│   ├── middleware/     # error handler, 404
│   ├── repositories/   # SQL: 1 archivo por tabla
│   ├── routes/         # 1 archivo por entidad + index.ts
│   ├── services/       # lógica de negocio
│   ├── types/          # interfaces compartidas
│   ├── utils/          # helpers (sanitize, asyncHandler, sql)
│   └── index.ts        # entry: app, mount, listen
├── docs/               # documentación (empezar por BACKEND_REFERENCE.md)
├── database/           # DDL Postgres (schemaV2.sql vigente; schemaV1.sql legacy)
├── functions/          # Cloud Functions (despliegue separado, NO se incluye en la imagen)
├── Dockerfile
├── tsconfig.json
└── package.json
```

**Docs:** la referencia única amplia es `docs/BACKEND_REFERENCE.md`. Endpoints Express **solo PostgreSQL** (health/db, initiatives, intakes, artifact-definitions): `docs/API_DATABASE_ENDPOINTS.md`. Lo demás es tema específico (`DATABASE_AUDIT.md`, `DEPLOYED_ENDPOINTS.md`, `BACKEND_EXPRESS_INDEX_AND_GCP_FUNCTIONS.md`).

---

## Mapa de endpoints (ingress + entidad)

La API se monta con prefijo **fijo** en código: **`/karia-svc/v2/`** (`src/index.ts`). El liveness **`GET /health`** queda en la **raíz** del contenedor.

| Tabla / recurso | Método | Ruta | Acción |
|------------------|--------|------|--------|
| — | GET | `/health` | Liveness (raíz, probes) |
| — | GET | `/karia-svc/v2/health` | Liveness bajo prefijo |
| — | GET | `/karia-svc/v2/health/db` | `SELECT 1` (testConnection) |
| `initiative` | GET | `/karia-svc/v2/initiatives` | Lista |
| `initiative` | POST | `/karia-svc/v2/initiatives` | Crea |
| `initiative` | PUT | `/karia-svc/v2/initiatives/:id` | Actualiza (parcial) |
| `initiative` | DELETE | `/karia-svc/v2/initiatives/:id` | Elimina |
| `intake_request` | GET | `/karia-svc/v2/intakes` | Lista (solo lectura) |
| `artifact_definition` | GET | `/karia-svc/v2/artifact-definitions` | Lista |
| `artifact_definition` | POST | `/karia-svc/v2/artifact-definitions` | Crea |
| `artifact_definition` | PUT | `/karia-svc/v2/artifact-definitions/:id` | Actualiza |
| `artifact_definition` | DELETE | `/karia-svc/v2/artifact-definitions/:id` | Elimina |
| GCS bucket | GET | `/karia-svc/v2/library/files` | Lista archivos (dedupe versiones output `.md`) |
| GCS bucket | POST | `/karia-svc/v2/library/upload-url` | URL firmada (write) |
| GCS bucket | GET | `/karia-svc/v2/library/download/:fileId` | URL firmada (read) |
| GCS bucket | DELETE | `/karia-svc/v2/library/delete/:fileId` | Borra archivo |
| GCS `Output/` | GET | `/karia-svc/v2/artifacts/files` | Lista nombres bajo `Output/` |
| GCS `Output/` | POST | `/karia-svc/v2/artifacts/publish` | Guarda markdown |
| GCS `Output/` | POST | `/karia-svc/v2/artifacts/publish-pdf` | Guarda PDF (raw) |

> **Cambio respecto a v1:** desaparece el prefijo `/api/db/...`. Cada entidad expone su propio recurso REST bajo `/karia-svc/v2/...`. Si el front usaba esas rutas, hay que actualizarlas (`/api/db/initiatives` → `/karia-svc/v2/initiatives`, etc.).

---

## Variables de entorno

Mismas claves que antes; la lista canónica está en `.env.example`:

- `PORT`
- `ConnectionString_Karia`, `DB_SSL_CA`, `DB_SSL_REJECT_UNAUTHORIZED`
- `GCS_BUCKET_NAME`, `GOOGLE_APPLICATION_CREDENTIALS`

---

## Desarrollo local

```bash
cd aria-backend
npm install
copy .env.example .env   # editar valores

# Modo watch con TypeScript (sin compilar a dist/)
npm run dev

# O compilando:
npm run build
npm start
```

**Probar rápidamente:**

```bash
curl http://localhost:3000/health           # liveness raíz (default local)
curl http://localhost:3000/karia-svc/v2/health
curl http://localhost:3000/karia-svc/v2/health/db
curl http://localhost:3000/karia-svc/v2/initiatives
```

---

## Build / despliegue

`Dockerfile` es **multi-stage**: compila TS en una etapa y ejecuta `node dist/index.js` con dependencias de producción en la imagen final. En **Cloud Run**, configura secretos y variables de entorno en el servicio (p. ej. `ConnectionString_Karia`, `GCS_BUCKET_NAME`, `PROJECT_ID`; ver `docs/BACKEND_REFERENCE.md`).

```bash
# Cloud Run (build desde este directorio con el Dockerfile)
gcloud run deploy aria-backend --source . --region=us-central1

# O Docker local
docker build -t aria-backend .
docker run --rm -p 8080:8080 --env-file .env aria-backend
```

---

## Carpetas que **no** entran en la imagen

`functions/`, `database/`, `scripts/`, `docs/` están listadas en `.dockerignore`. Las funciones GCP se despliegan por separado con `gcloud functions deploy` (ver `docs/BACKEND_REFERENCE.md` §7).
