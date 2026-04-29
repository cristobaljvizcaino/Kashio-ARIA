# ARIA Frontend

SPA (Vite + React + TypeScript) del portal ARIA (Kashio). Este repositorio es **totalmente autocontenido** y se despliega de forma independiente del backend (`aria-backend`) en Google Cloud Run detrás de nginx.

## Estructura

```
aria-frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── Dockerfile            # Build multi-stage (node → nginx)
├── nginx.conf            # Servidor estático + proxy /api/ → aria-backend
├── cloudbuild.yaml       # Pipeline de CI/CD (GCP Cloud Build)
├── .dockerignore
├── .gitignore
├── .env.example
├── assets/               # Archivos estáticos de referencia (csv, excel, pdf, word)
├── public/               # Recursos servidos tal cual por Vite
└── src/
    ├── index.tsx
    ├── App.tsx
    ├── components/       # Layout, LoginPage, AriaAgentBot, etc.
    ├── views/            # Generation, Inventory, Library, ArtifactConfig, AriaChat
    ├── services/         # authService, databaseService, geminiService, ...
    ├── utils/            # debugStorage, migrateToDb, resetDatabase, ...
    ├── data/             # artifactsFromOrder.ts
    ├── constants/        # constants.tsx
    ├── types/            # types.ts
    ├── hooks/            # (vacío, reservado)
    └── config/           # (vacío, reservado)
```

## Requisitos

- Node.js 18+
- Cuenta de Google Cloud con Cloud Run habilitado
- `gcloud` CLI autenticado

## Variables de entorno

| Variable          | Uso                                                  |
|-------------------|------------------------------------------------------|
| `GEMINI_API_KEY`  | API key de Gemini (inyectada por Vite en build time) |

Copiar `.env.example` a `.env` para desarrollo local.

## Desarrollo local

```bash
npm install
# copia .env.example → .env y ajusta GEMINI_API_KEY (y opcionalmente VITE_BACKEND_URL)
npm run dev
# Portal en http://localhost:3000
```

Vite redirige automáticamente cualquier `/api/*` al backend que indique `VITE_BACKEND_URL`
(por defecto `http://localhost:8080`). Para tener el stack completo levantado localmente:

```bash
# Terminal 1
cd aria-backend && npm start           # http://localhost:8080

# Terminal 2
cd aria-frontend && npm run dev        # http://localhost:3000 → proxya /api/* al :8080
```

## Build de producción

```bash
npm run build
npm run preview
```

## Despliegue independiente (Cloud Run)

```bash
gcloud builds submit --config=cloudbuild.yaml .
```

El pipeline construye la imagen, la publica en Container Registry y la despliega como servicio `aria-frontend` en Cloud Run. **No depende en absoluto de `aria-backend`** — solo lo consume vía HTTP.

## Proxy al backend

`nginx.conf` expone `/api/` como reverse-proxy hacia el Cloud Run del servicio `aria-backend`. Antes del primer deploy en producción, reemplazar el placeholder `aria-backend-<hash>-uc.a.run.app` por la URL real del servicio desplegado desde `aria-backend`.
