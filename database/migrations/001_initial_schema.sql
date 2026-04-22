-- ========================================
-- ARIA Control Center - Initial Database Schema
-- PostgreSQL 15
-- Fecha: Enero 2026
-- ========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABLAS PRINCIPALES
-- ========================================

-- OEA (Objetivos Estratégicos Anuales)
CREATE TABLE oea (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner VARCHAR(100),
  period VARCHAR(10),
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  health VARCHAR(20) CHECK (health IN ('Healthy', 'At Risk', 'Critical')),
  impact INTEGER CHECK (impact >= 1 AND impact <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_oea_period ON oea(period);
CREATE INDEX idx_oea_health ON oea(health);
COMMENT ON TABLE oea IS 'Objetivos Estratégicos Anuales de Kashio';

-- OKR (Objectives & Key Results)
CREATE TABLE okr (
  id VARCHAR(20) PRIMARY KEY,
  oea_id VARCHAR(20) REFERENCES oea(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  owner VARCHAR(100),
  health VARCHAR(20) CHECK (health IN ('Healthy', 'At Risk', 'Critical')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_okr_oea ON okr(oea_id);
CREATE INDEX idx_okr_health ON okr(health);

-- KeyResult
CREATE TABLE key_result (
  id VARCHAR(20) PRIMARY KEY,
  okr_id VARCHAR(20) REFERENCES okr(id) ON DELETE CASCADE,
  description TEXT,
  target NUMERIC,
  current NUMERIC,
  unit VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kr_okr ON key_result(okr_id);

-- PortfolioInitiative
CREATE TABLE portfolio_initiative (
  id VARCHAR(20) PRIMARY KEY,
  okr_id VARCHAR(20) REFERENCES okr(id) ON DELETE SET NULL,
  kpc_code VARCHAR(50),
  kpc_version VARCHAR(20),
  portfolio VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  start_date VARCHAR(20),
  end_date VARCHAR(20),
  owner VARCHAR(100),
  lead VARCHAR(100),
  tech_lead VARCHAR(100),
  squads VARCHAR(100),
  status VARCHAR(50),
  brm_link TEXT,
  domain_l1 VARCHAR(100),
  domain_l2 VARCHAR(100),
  domain_l3 VARCHAR(100),
  it_services VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_init_okr ON portfolio_initiative(okr_id);
CREATE INDEX idx_init_status ON portfolio_initiative(status);
CREATE INDEX idx_init_kpc ON portfolio_initiative(kpc_code);
CREATE INDEX idx_init_portfolio ON portfolio_initiative(portfolio);

-- Artifact
CREATE TABLE artifact (
  id VARCHAR(20) PRIMARY KEY,
  initiative_id VARCHAR(20) REFERENCES portfolio_initiative(id) ON DELETE CASCADE,
  gate VARCHAR(5) NOT NULL CHECK (gate IN ('G0', 'G1', 'G2', 'G3', 'G4', 'G5')),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  version VARCHAR(20),
  status VARCHAR(30) CHECK (status IN ('NOT_STARTED', 'DRAFT', 'ACTIVE', 'OBSOLETE', 'PENDING_HITL', 'GENERATING')),
  artifact_type VARCHAR(10) CHECK (artifact_type IN ('Input', 'Output')),
  content TEXT,
  generated_by VARCHAR(20) CHECK (generated_by IN ('ARIA', 'Manual')),
  link TEXT,
  storage_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_by VARCHAR(100),
  approved_at TIMESTAMP
);

CREATE INDEX idx_artifact_init ON artifact(initiative_id);
CREATE INDEX idx_artifact_gate ON artifact(gate);
CREATE INDEX idx_artifact_status ON artifact(status);
CREATE INDEX idx_artifact_type ON artifact(artifact_type);

-- Artifact Destinations (many-to-many)
CREATE TABLE artifact_destination (
  artifact_id VARCHAR(20) REFERENCES artifact(id) ON DELETE CASCADE,
  destination VARCHAR(50) NOT NULL CHECK (destination IN ('Confluence', 'Jira', 'SharePoint', 'ReadMe')),
  published_at TIMESTAMP,
  published_url TEXT,
  PRIMARY KEY (artifact_id, destination)
);

-- IntakeRequest
CREATE TABLE intake_request (
  id VARCHAR(20) PRIMARY KEY,
  requester VARCHAR(100) NOT NULL,
  area VARCHAR(50),
  type VARCHAR(50) CHECK (type IN ('Bug', 'Mejora', 'Estratégica', 'Regulatorio', 'Deuda Técnica')),
  product VARCHAR(100),
  domain VARCHAR(100),
  region VARCHAR(100),
  impact_type VARCHAR(50),
  severity VARCHAR(5) CHECK (severity IN ('P0', 'P1', 'P2', 'P3')),
  urgency VARCHAR(20) CHECK (urgency IN ('Now', 'Next', 'Later')),
  problem TEXT NOT NULL,
  outcome TEXT NOT NULL,
  scope TEXT[],
  constraints TEXT,
  alternatives TEXT,
  kpi VARCHAR(255),
  status VARCHAR(50),
  aria_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_intake_status ON intake_request(status);
CREATE INDEX idx_intake_severity ON intake_request(severity);
CREATE INDEX idx_intake_created ON intake_request(created_at DESC);

-- KpcProduct
CREATE TABLE kpc_product (
  id VARCHAR(20) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('Active', 'Archived', 'Deprecated', 'Draft')),
  version VARCHAR(20),
  pdlc_initiative_id VARCHAR(20) REFERENCES portfolio_initiative(id),
  pdlc_gate VARCHAR(5),
  owner VARCHAR(100),
  domain VARCHAR(100),
  target_segment VARCHAR(100),
  region VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kpc_code ON kpc_product(code);
CREATE INDEX idx_kpc_status ON kpc_product(status);
CREATE INDEX idx_kpc_initiative ON kpc_product(pdlc_initiative_id);

-- ========================================
-- TRIGGERS Y FUNCIONES
-- ========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_oea_updated_at BEFORE UPDATE ON oea
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_okr_updated_at BEFORE UPDATE ON okr
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_key_result_updated_at BEFORE UPDATE ON key_result
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_initiative_updated_at BEFORE UPDATE ON portfolio_initiative
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artifact_updated_at BEFORE UPDATE ON artifact
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intake_request_updated_at BEFORE UPDATE ON intake_request
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpc_product_updated_at BEFORE UPDATE ON kpc_product
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FUNCIONES AUXILIARES
-- ========================================

-- Calcular health de OEA basado en OKRs
CREATE OR REPLACE FUNCTION calculate_oea_health(oea_id_param VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  critical_count INT;
  at_risk_count INT;
  total_count INT;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE health = 'Critical'),
    COUNT(*) FILTER (WHERE health = 'At Risk'),
    COUNT(*)
  INTO critical_count, at_risk_count, total_count
  FROM okr
  WHERE oea_id = oea_id_param;
  
  IF critical_count > 0 THEN
    RETURN 'Critical';
  ELSIF at_risk_count >= total_count / 2 THEN
    RETURN 'At Risk';
  ELSE
    RETURN 'Healthy';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SEED DATA (Opcional - Datos de prueba)
-- ========================================

-- Insertar OEAs de ejemplo
INSERT INTO oea (id, name, owner, period, progress, health, impact) VALUES
('OEA-01', 'Plataforma FinOps AI Driven', 'CDPO', '2026', 82, 'Healthy', 5),
('OEA-02', 'Eficiencia Operativa & Riesgo', 'COO', '2026', 64, 'At Risk', 4);

-- Insertar OKRs de ejemplo  
INSERT INTO okr (id, oea_id, name, owner, health) VALUES
('OKR-O1.1', 'OEA-01', 'Automatizar conciliación bancaria', 'Head of FinOps', 'Healthy'),
('OKR-O2.1', 'OEA-02', 'Reducir pérdidas operativas', 'COO', 'At Risk');

-- Insertar iniciativa de ejemplo
INSERT INTO portfolio_initiative (id, name, portfolio, status, start_date, end_date, owner, lead, tech_lead, squads, okr_id) VALUES
('IDPRD-001', 'Portal Empresa', 'Plataforma', 'En curso', 'Q1-26', 'Q2-26', 'DPI (Rosa María Orellana)', 'Kari', 'Arley', 'Nova', 'OKR-O1.1');

-- Verificar
SELECT 'Schema created successfully! Tables: ' || count(*) FROM information_schema.tables WHERE table_schema = 'public';

