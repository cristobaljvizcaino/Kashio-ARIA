# Despliegue de ARIA v2 en GCP — Análisis funcional `aria-backend` + `aria-frontend`

> **Versión 2 del análisis** — actualiza el anterior tras el refactor del frontend (28/04/2026): migración completa de **Firebase Identity Platform** a **MSAL contra Microsoft Entra ID** y configuración de auth **en runtime** (no en build).

## 1. Finalidad

Confirmar si, **desplegando solo dos servicios en GCP** (un backend y un frontend independientes en Cloud Run), el portal funciona **igual que `AriaV1`**, salvo por las vistas que ya se eliminaron a propósito y por el método de autenticación. También dejar claras las **variables y secretos** necesarios.

## 2. Veredicto rápido

**Sí, queda funcional con dos despliegues** (uno para `aria-backend`, otro para `aria-frontend`), siempre que se cumplan **5 ajustes mínimos** (ver §6). No hay funcionalidad oculta perdida en las vistas: lo que se quitó del front se quitó también del back de forma coherente.

> Lo más sensible ahora: **sin las dos variables `IT-ARIA_MSAL_CLIENT_ID` y `IT-ARIA_MSAL_AUTHORITY` configuradas en el Cloud Run del frontend, no hay forma de iniciar sesión** y, por tanto, no se ve la app. Ya no existe la antigua bandera `AUTH_ENABLED` para saltarse el login.

## 3. Comparación V1 vs V2 (resumen)

| Pieza | `AriaV1` (monolito) | `aria-backend` + `aria-frontend` (multirepo) | Estado |
|------|---------------------|----------------------------------------------|--------|
| Vistas del front | 13 (Overview, Portfolio, Intake, Generation, Inventory, Library, ArtifactConfig, KpcCatalog, OeaStrategy, Prioritization, Governance, SquadGovernance, VegaObservatory) | 5 (**Generation, Inventory, Library, ArtifactConfig, AriaChat**) | **Esperado** (refactor de v2) |
| Endpoints del back consumidos por las vistas que sobreviven | `/api/library/*`, `/api/artifacts/*`, `/api/db/initiatives` (CRUD), `/api/db/intakes` (GET), `/api/db/artifact-definitions` (CRUD), `/health` | Idénticos: están todos en `aria-backend/index.js` | ✔ Cubierto |
| Endpoints eliminados | `POST /api/db/intakes`, `PUT /api/db/intakes/:id` | Eliminados | Coherente: solo los usaba la vista **Intake**, que ya no existe en v2 |
| Servicio de Gemini en el front (`geminiService.ts`) | SDK en navegador con clave inyectada por Vite | **Igual** (mismo SDK, modelos con fallback) | ✔ |
| **Autenticación** | **Firebase Identity Platform** envolviendo Microsoft OAuth, tenant hardcoded en código | **MSAL puro** (`@azure/msal-browser` + `@azure/msal-react`) contra **Microsoft Entra ID**; `clientId` y `authority` se leen en runtime desde `window.aria_msal_config` | **Cambio mayor** |
| Bandera `AUTH_ENABLED` | `true` | **Eliminada**: el login es obligatorio, `index.tsx` envuelve la app en `<AriaAuthShell><LoginGate>...` | El login ya no se puede desactivar |
| Componente de login | `LoginPage.tsx` con popup Firebase | `auth/LoginGate.tsx` con `loginRedirect` MSAL (tarjeta corporativa Microsoft) | Reemplazado |
| Servidor estático | Express servía `dist/` en el mismo contenedor | nginx (en `aria-frontend`) sirve la SPA; Express ya no necesita servirla | ✔ Mejor para multirepo |
| Cloud Storage / bucket | Bucket `aria-library-files` (hardcoded en backend) | **Mismo bucket hardcoded** | ✔ Reutiliza el bucket de v1 |
| Cloud SQL / Postgres | `DATABASE_URL` + migraciones `001/002` | **Mismas migraciones**, misma cadena | ✔ Reutiliza la BD de v1 |
| Imagen del front | `node:18-alpine` + nginx | `node:22-alpine` + `nginx:alpine` con script de arranque que genera `/config.js` desde variables de entorno | Patrón runtime-config |

> Diferencia funcional real para el usuario final: **el flujo de login cambia de popup (Firebase) a redirect (MSAL)** y el botón es ahora "Entrar con cuenta Kashio" sobre fondo oscuro corporativo (`LoginGate.tsx`). El backend y el resto de las vistas se comportan exactamente igual.

## 4. Cómo se conectan los dos servicios

```
Usuario ─► Cloud Run "aria-frontend" (nginx + SPA)
              │  ─ al arrancar el contenedor: genera /config.js con
              │    window.aria_msal_config = { clientId, authority }
              │    leído de IT-ARIA_MSAL_CLIENT_ID / IT-ARIA_MSAL_AUTHORITY
              │
              ├─ /            → SPA + LoginGate MSAL → Microsoft Entra ID
              ├─ /api/*       → reverse-proxy hacia "aria-backend"
              │                  (HOY este bloque devuelve 503;
              │                   hay que poner el proxy_pass real)
              └─ /health      → 200 OK
                                   │
                                   ▼
                       Cloud Run "aria-backend" (Express)
                                   │
                                   ├─ Cloud SQL (PostgreSQL)  ← DATABASE_URL
                                   └─ Cloud Storage           ← bucket "aria-library-files"
```

El frontend **no llama directamente** al backend desde JavaScript: usa rutas relativas (`/api/...`) que el nginx redirige al servicio del backend. Esto está definido en `aria-frontend/nginx.conf`. La autenticación, en cambio, va **directa del navegador a Microsoft Entra ID** mediante MSAL (no pasa por el backend).

## 5. Variables de entorno y secretos a definir en GCP

### 5.1 `aria-backend` (Cloud Run)

| Nombre | Valor | Origen recomendado |
|--------|-------|--------------------|
| `PORT` | `8080` | Lo inyecta Cloud Run automáticamente |
| `DATABASE_URL` | Cadena de conexión a Cloud SQL PostgreSQL | **Secret Manager** → `aria-database-url:latest` |
| `GEMINI_API_KEY` | *(opcional hoy)* clave de Gemini si más adelante se centraliza la IA en el backend | **Secret Manager** → `gemini-api-key:latest` |

Configuración adicional al desplegar:

- Conectar el servicio a la instancia Cloud SQL con `--add-cloudsql-instances=<PROYECTO>:<REGION>:<INSTANCIA>`.
- La cuenta de servicio (Service Account) del Cloud Run debe tener:
  - **Cloud SQL Client** (para conectarse a Postgres).
  - **Storage Object Admin** (o Reader+Creator) sobre el bucket `aria-library-files`.

### 5.2 `aria-frontend` (Cloud Run)

| Nombre | Cuándo | Valor |
|--------|--------|-------|
| `IT-ARIA_MSAL_CLIENT_ID` | **Runtime** (lo lee el script `99-generate-config.sh` al arrancar el contenedor) | Application (client) ID del registro de la app ARIA en **Microsoft Entra ID** |
| `IT-ARIA_MSAL_AUTHORITY` | **Runtime** | URL del *authority*, normalmente `https://login.microsoftonline.com/<TENANT_ID>` (para Kashio: tenant `4cb14595-301a-44ee-af4e-33b9bb64c9c4`) |
| `GEMINI_API_KEY` | **Build-time** | Clave de Gemini (Vite la inserta en el bundle). Pasar como substitution `_GEMINI_API_KEY` o `--build-arg` en Cloud Build |

Notas:
- `IT-ARIA_MSAL_*` deben **inyectarse al servicio Cloud Run** (`--set-env-vars`). Hoy `aria-frontend/cloudbuild.yaml` **no las pasa**, hay que añadirlas (o exponerlas como secretos en Secret Manager y usar `--set-secrets`).
- La clave de Gemini queda **embebida en el bundle JavaScript** del navegador. Es funcional pero expone la clave; centralizar Gemini en el backend es mejora futura, no bloqueador para que v2 funcione igual que v1.

### 5.3 Configuración fuera de variables (Microsoft Entra ID)

- En el portal de **Azure / Microsoft Entra ID**, en el *App Registration* de ARIA:
  - **Redirect URIs (Single-page application)**: añadir la URL pública del Cloud Run del frontend (algo tipo `https://aria-frontend-XXXXXX-uc.a.run.app/` y/o el dominio personalizado). MSAL usa redirect, no popup, así que sin esto el login devuelve `AADSTS50011: redirect URI mismatch`.
  - **Logout URL**: misma URL raíz del frontend.
  - **API permissions**: al menos `User.Read` (que es lo que `loginRequest` solicita en `msalConfig.ts`).
- Validación de dominio `@kashio.net` o restricción de usuarios: hoy `LoginGate.tsx` la indica como mensaje informativo, pero **el filtro real lo aplica Entra ID** según la política del tenant. Si se quiere validar también en cliente, hay que añadirlo en `AuthContext.tsx`.

## 6. Ajustes mínimos antes del primer despliegue

Estos son los **únicos imprescindibles** para que v2 quede funcional como v1:

1. **Configurar las variables de auth en el Cloud Run del frontend**: añadir en `aria-frontend/cloudbuild.yaml` (o `gcloud run deploy ... --set-env-vars=...`) las dos variables `IT-ARIA_MSAL_CLIENT_ID` y `IT-ARIA_MSAL_AUTHORITY` con los valores del *App Registration* de ARIA en Entra ID. **Sin esto el login no arranca.**
2. **Apuntar el proxy `/api/` al backend real**: en `aria-frontend/nginx.conf`, reemplazar el bloque que hoy devuelve `503 "API: configure proxy in nginx.conf"` por un `proxy_pass https://<URL_REAL_DEL_BACKEND>/api/;` (con sus `proxy_set_header` correspondientes). Hacerlo **después** del primer despliegue del backend, cuando se conozca la URL.
3. **Pasar `GEMINI_API_KEY` al build del frontend**: editar `aria-frontend/cloudbuild.yaml` para inyectarla en `docker build` (substitution `_GEMINI_API_KEY` + `--build-arg`). El cloudbuild del backend ya la trae como secreto; el del frontend no.
4. **Crear/reutilizar secretos en Secret Manager**:
   - `aria-database-url` → cadena de conexión Cloud SQL.
   - `gemini-api-key` → clave Gemini.
   - *(Opcional)* `aria-msal-client-id` y `aria-msal-authority` si se prefiere no tenerlos como variables planas.
5. **Aplicar las migraciones** sobre la BD Cloud SQL (si no estaban ya aplicadas en la instancia de v1):
   `psql "$DATABASE_URL" -f aria-backend/migrations/001_initial_schema.sql`
   `psql "$DATABASE_URL" -f aria-backend/migrations/002_aria_current_schema.sql`
6. **Registrar el dominio del Cloud Run del frontend en Microsoft Entra ID** como Redirect URI (SPA) y Logout URL del *App Registration* (sustituye al antiguo paso de "Authorized domains de Firebase").

## 7. Riesgos y observaciones (no bloqueantes)

- **Sin bypass de auth**: en v1 existía `AUTH_ENABLED=false` para correr el front sin login (útil en local). En v2 ese flag desapareció: si MSAL no puede inicializar (clientId/authority vacíos o inválidos), `AuthProvider` deja la pantalla en *"Inicializando..."* y la app no avanza. Para desarrollo local hay que pasar las dos variables igualmente (apuntando a un App Registration de dev).
- **Generación de `/config.js` en runtime**: el Dockerfile crea `/docker-entrypoint.d/99-generate-config.sh` que escribe `window.aria_msal_config` al iniciar. Si el script falla (por permisos, sintaxis, etc.), MSAL recibe strings vacíos y el login truena con `endpoints_resolution_error`. Confirmar en logs de Cloud Run el primer arranque.
- **`nginx.conf` con `/api/` devolviendo 503**: ahora el placeholder es **explícito** (no fallaría por DNS inexistente, como pasaba con el host `<hash>` de la versión anterior), pero hasta que se cambie a un `proxy_pass` real **todas las llamadas del front al backend devolverán 503**.
- **`vite.config.ts`**: ya solo define `process.env.GEMINI_API_KEY` / `API_KEY`. Las antiguas constantes de Firebase fueron eliminadas, lo cual es correcto: ya no se usan.
- En `aria-backend/index.js` quedan dos líneas que servían `dist/` cuando v1 era monolito: `app.use(express.static(...))` y `app.get('*', ...)`. Son **código muerto** en multirepo (no hay `dist/` dentro de la imagen del backend) pero no causan errores; pueden limpiarse en una iteración futura.
- El `cloudbuild.yaml` del backend referencia el secreto `gemini-api-key`. Como hoy el backend **no llama a Gemini** (lo hace el front), ese secreto no es necesario. No bloquea, pero puede simplificarse.
- La carpeta `aria-backend/functions/` (Cloud Functions de api/library/storage) **no entra** en la imagen Docker (`.dockerignore` la excluye) y se despliega aparte si se quiere. v1 también se desplegaba así; no hay regresión.

## 8. Conclusión

- **Funcionalmente**, desplegar `aria-backend` y `aria-frontend` por separado en Cloud Run **reproduce el comportamiento de `AriaV1`** para las vistas que sobreviven en v2, **siempre que** se configure el *App Registration* de Microsoft Entra ID y se pasen sus dos variables al Cloud Run del frontend.
- **Las únicas diferencias visibles** para el usuario final son:
  1. Menos vistas en el menú (intencional).
  2. Una nueva vista **AriaChat** (intencional).
  3. **Pantalla de login renovada y flujo MSAL por redirect**, en lugar del popup Firebase.
- **Firebase desaparece por completo** en v2 (eliminado del `package.json` y de los `define` de Vite). Si el equipo quiere conservar la coexistencia, no se puede: hay que comprometerse con MSAL.
- Con los **6 ajustes** del §6 y los **secretos/IAM** del §5, el despliegue es completo y la aplicación queda como `AriaV1` está hoy en GCP, pero ya organizada como dos repositorios independientes listos para evolucionar (incluida la futura migración del backend a AWS).
