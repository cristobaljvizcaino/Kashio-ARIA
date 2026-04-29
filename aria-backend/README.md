# ARIA Backend

API Express independiente del portal ARIA (Kashio). Este repositorio es **totalmente autocontenido** y se despliega de forma independiente del frontend (`aria-frontend`) en Google Cloud Run.

**Referencia backend:** [docs/BACKEND_REFERENCE.md](docs/BACKEND_REFERENCE.md) · **BD v2 + GCS + DDL:** [docs/DATABASE_AUDIT.md](docs/DATABASE_AUDIT.md) · **Mejoras / roadmap:** [docs/mejoras.md](docs/mejoras.md).

## Estructura

```
aria-backend/
├── index.js              # Servidor Express (API principal)
├── db.js                 # Pool PostgreSQL (URI + opciones TLS)
├── package.json          # Dependencias del servicio
├── Dockerfile            # Imagen para Cloud Run
├── cloudbuild.yaml       # Pipeline de CI/CD (GCP Cloud Build)
├── .dockerignore
├── .gitignore
├── functions/            # Cloud Functions desplegables por separado
│   ├── api/              # Funciones HTTP (Gemini / APIs generales)
│   ├── library/          # Funciones de la biblioteca de artefactos
│   └── storage/          # Utilidades de Cloud Storage
└── migrations/           # SQL PostgreSQL (003 = esquema v2 recomendado)
    ├── squema.db           # volcado de referencia (v1)
    └── 003_v2_four_tables.sql
```

## Requisitos

- Node.js 18+
- Cuenta de Google Cloud con Cloud Run, PostgreSQL (conexión directa) y Cloud Storage; biblioteca migrada en proyecto **Kashio FinOps**, bucket **`karia-library-files`** (ver `BACKEND_REFERENCE.md`)
- `gcloud` CLI autenticado

## Variables de entorno

| Variable         | Uso                                                  |
|------------------|------------------------------------------------------|
| `PORT`           | Puerto HTTP (por defecto `8080`)                     |
| `ConnectionString_Karia` | URI PostgreSQL (`postgresql://…`) — conexión directa al servidor. |
| `DB_SSL_CA` | Opcional. Ruta a PEM del CA del proveedor (TLS verificado). |
| `DB_SSL_REJECT_UNAUTHORIZED` | Opcional. `false` desactiva verificación del certificado (solo dev / red de confianza). |
| `SERVICE_BASE_PATH`     | Opcional. Prefijo ingress (p. ej. `/karia-svc/v2`). Cloud Build lo fija por defecto. |
| `GCS_BUCKET_NAME`       | Opcional. Bucket de biblioteca (default **`karia-library-files`** en FinOps). `cloudbuild.yaml` lo inyecta en Cloud Run. |
| `GEMINI_API_KEY` | API key de Gemini para los endpoints de generación   |

En Cloud Run se inyectan vía `--set-secrets` (ver `cloudbuild.yaml`).

## Desarrollo local

```bash
npm install
# copia .env.example → .env y ajusta valores (al menos ConnectionString_Karia y GEMINI_API_KEY)
npm start
# API en http://localhost:8080
```

Si no defines `ConnectionString_Karia`, el server arranca igual (útil para trabajar solo contra `/api/library/*` o `/api/artifacts/*`), pero los endpoints `/api/db/*` responderán con error controlado.

Healthcheck: `GET /health`.

## Despliegue independiente (Cloud Run)

```bash
gcloud builds submit --config=cloudbuild.yaml .
```

El pipeline construye la imagen, la publica en Container Registry y la despliega como servicio `aria-backend` en Cloud Run. **No depende en absoluto de `aria-frontend`.**

## Cloud Functions

Las funciones dentro de `functions/` se despliegan por separado (p. ej. `gcloud functions deploy`) y quedan excluidas del contenedor (ver `.dockerignore`). Cada subcarpeta tiene su propio `package.json`.

## Migraciones

**BD nueva v2 (4 tablas, recomendado):**

```bash
psql "$ConnectionString_Karia" -f migrations/003_v2_four_tables.sql
```

Detalle de tablas, GCS y `library_file`: [docs/DATABASE_AUDIT.md](docs/DATABASE_AUDIT.md).

Si en otro entorno usáis scripts legacy `001` / `002`, revisad conflictos antes de mezclar con `003`.
