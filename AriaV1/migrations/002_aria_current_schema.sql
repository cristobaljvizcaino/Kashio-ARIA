-- ========================================
-- ARIA Control Center - Schema v2
-- Matches current TypeScript interfaces
-- PostgreSQL 15
-- Fecha: Febrero 2026
-- ========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- DROP OLD TABLES (if migrating from v1)
-- ========================================
DROP TABLE IF EXISTS artifact_destination CASCADE;
DROP TABLE IF EXISTS artifact CASCADE;
DROP TABLE IF EXISTS portfolio_initiative CASCADE;
DROP TABLE IF EXISTS key_result CASCADE;
DROP TABLE IF EXISTS okr CASCADE;
DROP TABLE IF EXISTS oea CASCADE;
DROP TABLE IF EXISTS kpc_product CASCADE;
DROP TABLE IF EXISTS intake_request CASCADE;

-- ========================================
-- NEW TABLES
-- ========================================

-- Initiative (matches TypeScript Initiative interface)
CREATE TABLE initiative (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  product VARCHAR(200),
  current_gate_id VARCHAR(10) DEFAULT 'G0',
  type VARCHAR(20) CHECK (type IN ('Change', 'Run')),
  start_date VARCHAR(20),
  end_date VARCHAR(20),
  quarter VARCHAR(20),
  status VARCHAR(100),
  intake_request_id VARCHAR(50),
  pipeline_activated BOOLEAN DEFAULT FALSE,
  artifacts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_initiative_gate ON initiative(current_gate_id);
CREATE INDEX idx_initiative_type ON initiative(type);
CREATE INDEX idx_initiative_quarter ON initiative(quarter);
CREATE INDEX idx_initiative_status ON initiative(status);

-- Intake Request (matches TypeScript IntakeRequest interface)
CREATE TABLE intake_request (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(500),
  requester VARCHAR(200) NOT NULL,
  area VARCHAR(100),
  type VARCHAR(50),
  product VARCHAR(200),
  domain VARCHAR(200),
  region VARCHAR(200),
  impact_type VARCHAR(100),
  severity VARCHAR(5),
  urgency VARCHAR(20),
  problem TEXT NOT NULL,
  outcome TEXT,
  scope JSONB DEFAULT '[]'::jsonb,
  constraints TEXT,
  alternatives TEXT,
  kpi VARCHAR(500),
  status VARCHAR(50) DEFAULT 'G0_Intake',
  aria_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_intake_status ON intake_request(status);
CREATE INDEX idx_intake_severity ON intake_request(severity);
CREATE INDEX idx_intake_created ON intake_request(created_at DESC);

-- Artifact Definition (matches TypeScript ArtifactDefinition interface)
CREATE TABLE artifact_definition (
  id VARCHAR(50) PRIMARY KEY,
  gate VARCHAR(10) NOT NULL,
  name VARCHAR(500) NOT NULL,
  initiative_type VARCHAR(20) CHECK (initiative_type IN ('Change', 'Run', 'Both')) DEFAULT 'Both',
  predecessor_ids JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  mandatory BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_artdef_gate ON artifact_definition(gate);
CREATE INDEX idx_artdef_type ON artifact_definition(initiative_type);

-- ========================================
-- TRIGGERS
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_initiative_updated_at BEFORE UPDATE ON initiative
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intake_updated_at BEFORE UPDATE ON intake_request
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artdef_updated_at BEFORE UPDATE ON artifact_definition
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VERIFY
-- ========================================
SELECT 'Schema v2 created successfully! Tables: ' || count(*) 
FROM information_schema.tables 
WHERE table_schema = 'public';
