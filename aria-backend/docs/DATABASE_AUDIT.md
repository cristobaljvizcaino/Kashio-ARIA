# Auditoría de Bases de Datos — ARIA

## Situación actual

Existen **dos bases de datos ANTIGUAS** en PostgreSQL (Cloud SQL), ambas pertenecen a la **versión 1 (AriaV1)**:

| BD antigua | Tablas que contiene |
|------------|---------------------|
| **`aria`** (v1) | `initiative`, `intake_request`, `artifact_definition`, `chat_conversations`, `chat_messages`, `confluence_publication` |
| **`aria_db`** (v1) | `intake_request`, `library_file`, `oea`, `okr`, `key_result`, `portfolio_initiative`, `product`, `artifact`, `artifact_destination`, `gate_status`, `kpc_product` |

Se creó una **base de datos NUEVA (vacía)** para la versión 2 (`aria-backend` + `aria-frontend`).

**Objetivo:** un esquema **mínimo y desplegable ya**: **4 tablas**. La tabla **`phase` / Fases** queda **omitida** por ahora (buena idea futura, no incluida en este DDL).

---

## Google Cloud Storage (catálogo de ficheros)

El backend Express usa el bucket de biblioteca configurado por **`GCS_BUCKET_NAME`** (por defecto **`karia-library-files`**) en el proyecto GCP **Kashio FinOps** (selector de consola: **`Kashio-Finops`**). Antes se documentaba el bucket `aria-library-files` en el proyecto squad/nova; la migración FinOps centraliza el depósito con el prefijo **Karia**. Los blobs **no** viven en PostgreSQL; viven en **GCS**. La tabla **`library_file`** sirve como **índice de metadatos** (URL `gs://…`, nombre, tipo, categoría, gate, etc.) alineada con lo que muestra la UI (“Cargar Archivo” → Contexto / Prompt / Template / Output).

### Estructura de carpetas (objeto = `path` dentro del bucket)

Vista real en consola (abril 2026): bajo **`Template/`** conviven plantillas Markdown (`lib-{timestamp}-Plantilla_…`, `Artefacto_…`) y PDFs; **`Output/`** incluye subcarpetas por gate (**G1**–**G5**; **G0** cuando aplica publicación desde ARIA).

```
karia-library-files/
├── Contexto/                    # Subidas UI categoría "Contexto"
│   └── lib-{timestamp}-{nombreArchivo}
├── Prompt/                      # Categoría "Prompt"
├── Template/                    # Categoría "Template"
└── Output/                      # Artefactos generados / publicados por ARIA
    ├── G0/
    ├── G1/
    ├── G2/
    ├── G3/
    ├── G4/
    └── G5/
        └── {nombreSeguro}_{iniciativa}_{versión}.md   (o .pdf)
```

| Origen en código | Patrón de objeto | Notas |
|------------------|------------------|--------|
| `POST /api/library/upload-url` | `{category}/{fileId}` | `category` = una de: `Contexto`, `Prompt`, `Template`, `Output` (o la que envíe el cliente). `fileId` = `lib-{timestamp}-{filename}`. |
| `POST /api/artifacts/publish` | `Output/{gate}/{fileId}.md` | `gate` por defecto `G0` si no viene. |
| `POST /api/artifacts/publish-pdf` | `Output/{gate}/{fileId}.pdf` | Metadatos en cabeceras HTTP. |
| `GET /api/library/files` | Todo el bucket | Agrupa versiones `.md` bajo `Output/` y lista el resto como fuentes. |

**Regla de integridad con `library_file`:** cada vez que un flujo confirme un objeto en GCS, conviene **INSERT/UPDATE** en `library_file` con el mismo `storage_url` (`gs://karia-library-files/...` u otro valor de `GCS_BUCKET_NAME`) y `file_name` / `file_type` / `gate` coherentes. Hoy **`index.js` no escribe en `library_file`**; la tabla está lista para una integración rápida en los mismos endpoints.

---

## Modelo v2: las 4 tablas

| Tabla | Rol | Uso actual en código (`index.js`) |
|-------|-----|-------------------------------------|
| **`initiative`** | Iniciativas PDLC + `artifacts` JSONB | CRUD `/api/db/initiatives` |
| **`intake_request`** | Solicitudes de intake | Solo `GET /api/db/intakes` |
| **`artifact_definition`** | Catálogo de artefactos por gate (G0…G5), PRD/SDD/etc. | CRUD `/api/db/artifact-definitions` |
| **`library_file`** | Metadatos de ficheros en GCS (subidas + generados) | **Planeada**: sin SQL en `index.js` todavía |

Los **Gates** siguen modelados con la columna **`artifact_definition.gate`** (`G0`…`G5`). No hay tabla `phase` en este entregable.

---

## Tablas v1 que NO entran en la BD nueva

| Tabla (solo v1) | Motivo |
|-----------------|--------|
| `chat_conversations`, `chat_messages` | Chat en localStorage en v2 |
| `confluence_publication` | Sin endpoint v2 |
| `oea`, `okr`, `key_result`, `portfolio_initiative`, `product`, `artifact`, `artifact_destination`, `gate_status`, `kpc_product` | Modelo legacy / no usado por Express v2 |

---

## DDL — aplicar sobre la BD nueva (vacía)

El mismo SQL está versionado en el repo como:

**`aria-backend/migrations/003_v2_four_tables.sql`**

```sql
-- ========================================
-- ARIA v2 — Esquema unificado (4 tablas)
-- PostgreSQL 15+
-- Sin tabla "phase".
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE initiative (
  id                  VARCHAR(50) PRIMARY KEY,
  name                VARCHAR(500) NOT NULL,
  product             VARCHAR(200),
  current_gate_id     VARCHAR(10) DEFAULT 'G0',
  type                VARCHAR(20) CHECK (type IN ('Change', 'Run')),
  start_date          VARCHAR(20),
  end_date            VARCHAR(20),
  quarter             VARCHAR(20),
  status              VARCHAR(100),
  intake_request_id   VARCHAR(50),
  pipeline_activated  BOOLEAN DEFAULT FALSE,
  artifacts           JSONB DEFAULT '[]'::jsonb,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_initiative_gate    ON initiative(current_gate_id);
CREATE INDEX idx_initiative_type    ON initiative(type);
CREATE INDEX idx_initiative_quarter ON initiative(quarter);
CREATE INDEX idx_initiative_status  ON initiative(status);

CREATE TRIGGER update_initiative_updated_at
  BEFORE UPDATE ON initiative
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE intake_request (
  id            VARCHAR(50) PRIMARY KEY,
  title         VARCHAR(500),
  requester     VARCHAR(200) NOT NULL,
  area          VARCHAR(100),
  type          VARCHAR(50),
  product       VARCHAR(200),
  domain        VARCHAR(200),
  region        VARCHAR(200),
  impact_type   VARCHAR(100),
  severity      VARCHAR(5),
  urgency       VARCHAR(20),
  problem       TEXT NOT NULL,
  outcome       TEXT,
  scope         JSONB DEFAULT '[]'::jsonb,
  constraints   TEXT,
  alternatives  TEXT,
  kpi           VARCHAR(500),
  status        VARCHAR(50) DEFAULT 'G0_Intake',
  aria_analysis TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_intake_status   ON intake_request(status);
CREATE INDEX idx_intake_severity ON intake_request(severity);
CREATE INDEX idx_intake_created  ON intake_request(created_at DESC);

CREATE TRIGGER update_intake_updated_at
  BEFORE UPDATE ON intake_request
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE artifact_definition (
  id                VARCHAR(50) PRIMARY KEY,
  gate              VARCHAR(10) NOT NULL,
  name              VARCHAR(500) NOT NULL,
  initiative_type   VARCHAR(20) DEFAULT 'Both'
                    CHECK (initiative_type IN ('Change', 'Run', 'Both')),
  predecessor_ids   JSONB DEFAULT '[]'::jsonb,
  description       TEXT,
  mandatory         BOOLEAN DEFAULT FALSE,
  area              VARCHAR(50) DEFAULT 'Producto',
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_artdef_gate ON artifact_definition(gate);
CREATE INDEX idx_artdef_type ON artifact_definition(initiative_type);

CREATE TRIGGER update_artdef_updated_at
  BEFORE UPDATE ON artifact_definition
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE library_file (
  id           VARCHAR(50) PRIMARY KEY,
  file_name    VARCHAR(255) NOT NULL,
  file_type    VARCHAR(20)
               CHECK (file_type IN ('Template', 'Prompt', 'Contexto', 'Output')),
  file_size    BIGINT,
  mime_type    VARCHAR(100),
  storage_url  TEXT NOT NULL,
  gate         VARCHAR(10)
               CHECK (gate IS NULL OR gate IN ('G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'ALL')),
  category     VARCHAR(100),
  description  TEXT,
  uploaded_by  VARCHAR(100),
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW(),
  deleted_at   TIMESTAMP NULL
);

CREATE INDEX idx_library_active   ON library_file(is_active);
CREATE INDEX idx_library_created  ON library_file(created_at DESC);
CREATE INDEX idx_library_gate     ON library_file(gate);
CREATE INDEX idx_library_type     ON library_file(file_type);
CREATE INDEX idx_library_category ON library_file(category);

CREATE TRIGGER update_library_file_updated_at
  BEFORE UPDATE ON library_file
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Ejecutar, por ejemplo:

```bash
psql "$ConnectionString_Karia" -f migrations/003_v2_four_tables.sql
```

---

## Resumen visual

```
 GCS (siempre)                         PostgreSQL BD nueva (4 tablas)
┌─────────────────────────┐           ┌──────────────────────────────┐
│ karia-library-files/    │           │ initiative                   │
│  Contexto/ Prompt/ …    │  ◀──────▶ │ intake_request               │
│  Output/G0 … G5/        │  (futuro  │ artifact_definition          │
│                         │   sync)  │ library_file                 │
└─────────────────────────┘           └──────────────────────────────┘
```

---

## Pasos rápidos

1. Crear BD vacía en Cloud SQL (o local).
2. `psql` con `003_v2_four_tables.sql`.
3. Migrar datos viejos solo de `initiative`, `intake_request`, `artifact_definition` si aplica (y `library_file` desde `aria_db` si queréis conservar metadatos históricos).
4. Definir `ConnectionString_Karia` en el entorno del backend apuntando a la BD nueva.
5. Integrar escritura en `library_file` en los endpoints GCS cuando toque (no bloquea el arranque del API).

---

*Actualizado con bucket GCS, estructura de carpetas y 4 tablas (sin `phase`). DDL canónico: `migrations/003_v2_four_tables.sql`.*
