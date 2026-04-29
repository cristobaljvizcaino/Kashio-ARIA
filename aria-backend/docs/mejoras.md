# Mejoras y dirección de arquitectura — `aria-backend`

Documento vivo con **decisiones pendientes**, **qué dejar de usar** y **qué implementar** en el backend Express frente a Cloud Functions. Complementa [`BACKEND_REFERENCE.md`](BACKEND_REFERENCE.md).

**Migración FinOps (GCS):** el depósito operativo de biblioteca pasó al proyecto **Kashio FinOps** (`Kashio-Finops`), bucket **`karia-library-files`** (`GCS_BUCKET_NAME`). Detalle de carpetas y despliegue: sección 3 de `BACKEND_REFERENCE.md`.

**Secret Manager (Gemini):** el secreto **`gemini-api-key`** está creado en **Kashio-Finops** (`projects/kashio-finops/secrets/gemini-api-key`, versión 1, habilitada). `functions/api` lo lee desde ese proyecto vía `PROJECT_ID` / `GOOGLE_CLOUD_PROJECT` (default `kashio-finops`). Plan de redespliegue: §7.5 de `BACKEND_REFERENCE.md`.

**Stack actualizado (abril 2026):**

- **Cloud Functions Gen 2** (`functions/api`): runtime **`nodejs22`**.
- **Cloud Run backend** (`aria-backend`, Express): imagen **`node:24-alpine`** con **Express 5**.
- Dependencias bumpeadas a últimas estables: `@google-cloud/functions-framework ^5.0.2`, `@google-cloud/secret-manager ^6.1.1`, `@google-cloud/storage ^7.19.0`, `@google/generative-ai ^0.24.1`, `express ^5.2.1`, `pg ^8.20.0`, `dotenv ^17.4.2`, `cors ^2.8.6`.

> **Nota Express 5:** se cambió el catch-all SPA `routes.get('*', ...)` por `routes.get('/{*splat}', ...)` (path-to-regexp v8 ya no acepta el `'*'` literal).

> **Nota SDK Gemini:** `@google/generative-ai` sigue activa pero el camino futuro recomendado por Google es **`@google/genai`** (SDK unificado). Migración pendiente cuando se justifique (cambia API de `getGenerativeModel`/`generateContent`).

---

## 1. Objetivo

Centralizar en **un solo API** (`aria-backend`, Express en Cloud Run) lo que hoy puede estar repartido: **PostgreSQL**, **Cloud Storage**, **validaciones**, **autenticación futura**, **logs** y **reglas de negocio**. Mantener las **Cloud Functions** solo donde aporta valor claro (por ejemplo **Gemini / IA**).

---

## 2. Estado actual (resumen)

| Pieza | Rol hoy |
|--------|---------|
| **`aria-backend` (`index.js`)** | Rutas `/api/library/*`, `/api/artifacts/*`, `/api/db/*`, health. GCS + PostgreSQL (CRUD iniciativas, definiciones, intakes lectura). |
| **`functions/api`** | Gemini: `generateArtifact`, `analyzeIntake`, `ariaChat`, `health`. Clave vía Secret Manager. |
| **`functions/library`** | CRUD serverless **solo contra el bucket** configurado (`GCS_BUCKET_NAME`, por defecto `karia-library-files` en FinOps). **No** escribe en `library_file`. |
| **Tabla `library_file`** | Definida en migraciones v2; **integración pendiente** en Express (la documentación ya lo indica). |

---

## 3. Decisión recomendada: biblioteca y artefactos en Express

**Centralizar el CRUD de archivos de biblioteca en el backend Express**, no en `functions/library`, porque ya existen rutas equivalentes:

- `/api/library/files`
- `/api/library/upload-url`
- `/api/library/download/:fileId`
- `/api/library/delete/:fileId`
- `/api/artifacts/publish`
- `/api/artifacts/publish-pdf`

### Flujo deseado (frontend)

**Recomendado:**

```text
Frontend → aria-backend → Cloud Storage
Frontend → aria-backend → PostgreSQL
Frontend → functions/api → Gemini   (solo IA)
```

**Evitar como patrón principal** (duplica superficie y operación):

```text
Frontend → functions/library → Cloud Storage   (paralelo a Express)
Frontend → aria-backend → PostgreSQL
```

### Por qué Express para biblioteca

- **Un solo lugar** para autenticación (cuando exista), validaciones, permisos, logs y reglas de negocio.
- Alineación con la tabla **`library_file`**: el camino natural es **metadata en SQL + objetos en GCS**, con trazabilidad.
- Con `functions/library` solo se opera el bucket; **no hay vínculo fuerte** con PostgreSQL ni un solo contrato de API para el front.

### Cuándo sí tendría sentido `functions/library`

Arquitectura muy distribuida donde cada operación es una función independiente. El coste es mayor: más despliegues, URLs, IAM, logs, CORS y puntos de falla. Para un equipo que busca **orden y menos piezas**, suele ser **más peso del necesario**.

---

## 4. Qué se espera implementar en el backend (prioridad)

1. **`library_file` en Express**  
   Tras confirmar subida (o en el mismo flujo coordinado):
   - Insertar / actualizar filas en **`library_file`** alineadas con rutas del bucket (ver estructura en `BACKEND_REFERENCE.md`, sección del bucket).
2. **`GET /api/library/files`**  
   Evolucionar a **catálogo desde SQL** (o **SQL + GCS** si hace falta reconciliar), en lugar de depender solo del listado del bucket.
3. **Borrado coherente**  
   `DELETE /api/library/delete/:fileId`: borrar en GCS y **soft-delete o borrado de fila** en `library_file`.
4. **Publicación de artefactos**  
   Donde aplique, registrar en SQL metadatos de lo publicado en `Output/` (misma idea de trazabilidad).

---

## 5. Qué dejar de priorizar o marcar como legacy

| Elemento | Acción sugerida |
|----------|------------------|
| **`functions/library`** | Tratar como **legacy / alternativa serverless**. **No desplegar** nuevas revisiones salvo necesidad puntual; **no** enlazar nuevos clientes frontend aquí. Candidato a **retirar** cuando Express cubra metadata + mismos contratos. |
| **Duplicar lógica** entre `functions/library` y `index.js` | **Evitar** nuevas funciones duplicadas; cualquier cambio de bucket o reglas debe ir primero a Express. |

**No** se propone eliminar aún el código del repo sin validar despliegues y consumidores; sí documentar que el **camino oficial** es Express.

---

## 6. Qué mantener en Cloud Functions

| Paquete | Mantener | Motivo |
|---------|----------|--------|
| **`functions/api`** | Sí | Gemini / IA: `ariaChat`, `generateArtifact`, `analyzeIntake`, `health`. Separación clara **IA vs datos**. |

---

## 7. Separación final (resumen ejecutivo)

| Capa | Responsabilidad |
|------|------------------|
| **IA / Gemini** | `functions/api` |
| **CRUD / DB / Storage / reglas de negocio** | `aria-backend` (Express) |
| **Frontend** | Consume Express para datos y archivos; consume `functions/api` solo para llamadas de IA según necesidad |

Esto **reduce duplicidad** y simplifica mantenimiento (menos URLs, menos CORS, un solo contrato de biblioteca).

---

## 8. Checklist de seguimiento (para ir tachando)

- [ ] Documentar en frontend la **base URL única** de biblioteca apuntando solo a `aria-backend`.
- [ ] Implementar escritura en **`library_file`** tras upload confirmado (diseñar idempotencia y errores).
- [ ] Ajustar listados para usar **SQL** (y reconciliación con bucket si aplica).
- [ ] Revisar IAM y Secret Manager solo donde Express y Functions lo necesiten.
- [ ] Cuando no haya consumidores: deprecar despliegue de **`functions/library`** y archivar o eliminar código según política del repo.

---

## 9. Referencias

- Detalle de endpoints y tablas: [`BACKEND_REFERENCE.md`](BACKEND_REFERENCE.md).
- DDL v2: `migrations/003_v2_four_tables.sql` (incluye `library_file`).
- Auditoría de datos: `docs/DATABASE_AUDIT.md`.

---

*Última actualización: alineado con la decisión de centralizar biblioteca/artefactos en Express y reservar Functions para IA.*
