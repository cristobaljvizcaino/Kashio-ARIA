-- ========================================
-- ARIA v2 — Esquema unificado (4 tablas)
-- PostgreSQL 15+
-- Sin tabla "phase" (Gates siguen en artifact_definition.gate).
-- library_file: catálogo de metadatos alineado con GCS (aria-library-files).
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 1. initiative
-- ========================================
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

-- ========================================
-- 2. intake_request
-- ========================================
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

-- ========================================
-- 3. artifact_definition
-- ========================================
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

-- ========================================
-- 4. library_file (catálogo; rutas reales en GCS — ver docs)
-- Nota: index.js aún NO inserta aquí; integración en endpoints futura.
-- ========================================
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

CREATE INDEX idx_library_active  ON library_file(is_active);
CREATE INDEX idx_library_created ON library_file(created_at DESC);
CREATE INDEX idx_library_gate    ON library_file(gate);
CREATE INDEX idx_library_type    ON library_file(file_type);
CREATE INDEX idx_library_category ON library_file(category);

CREATE TRIGGER update_library_file_updated_at
  BEFORE UPDATE ON library_file
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
