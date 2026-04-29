# Cloud SQL PostgreSQL Setup - ARIA (Recomendado para GCP)

## 🎯 Por qué Cloud SQL en lugar de Supabase

**Si ya estás en GCP**, Cloud SQL es mejor opción:

| Ventaja | Beneficio |
|---------|-----------|
| **Integración nativa** | VPC privada, sin llamadas externas |
| **Latencia** | ~10ms (vs ~50ms Supabase externo) |
| **Seguridad** | No sale de GCP, cumple org policies |
| **IAM unificado** | Mismo sistema de permisos |
| **Monitoreo** | Cloud Monitoring integrado |
| **Backups** | Automáticos en GCP Storage |

**Trade-off**: No tiene Auth/Storage/APIs built-in, pero puedes agregarlos.

---

## 🚀 Paso 1: Crear Instancia Cloud SQL

### Opción A: Instancia Pequeña (Development/Staging)

```bash
gcloud sql instances create aria-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --retained-backups-count=7 \
  --project kashio-squad-nova
```

**Costo**: ~$10/mes  
**Specs**: 1 vCPU compartido, 0.6GB RAM, 10GB SSD

### Opción B: Instancia Mediana (Producción)

```bash
gcloud sql instances create aria-db-prod \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-7680 \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=100GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --retained-backups-count=30 \
  --enable-bin-log \
  --availability-type=REGIONAL \
  --project kashio-squad-nova
```

**Costo**: ~$180/mes  
**Specs**: 2 vCPU dedicados, 7.5GB RAM, 100GB SSD, HA multi-zone

**Recomendación**: Empieza con `db-f1-micro` y escala cuando necesites.

---

## 📊 Paso 2: Crear Base de Datos

```bash
# Crear database
gcloud sql databases create aria \
  --instance=aria-db \
  --project kashio-squad-nova

# Crear usuario
gcloud sql users create aria-user \
  --instance=aria-db \
  --password=GENERA_PASSWORD_SEGURO_AQUI \
  --project kashio-squad-nova
```

---

## 🔐 Paso 3: Configurar Acceso desde Cloud Run

### Conectar Cloud Run a Cloud SQL (Sin IP pública)

```bash
# Actualizar Cloud Run para conectar a Cloud SQL
gcloud run services update aria-frontend \
  --region us-central1 \
  --add-cloudsql-instances=kashio-squad-nova:us-central1:aria-db \
  --project kashio-squad-nova
```

### Variables de Entorno

```bash
gcloud run services update aria-frontend \
  --region us-central1 \
  --set-env-vars="DATABASE_URL=postgresql://aria-user:PASSWORD@/aria?host=/cloudsql/kashio-squad-nova:us-central1:aria-db" \
  --project kashio-squad-nova
```

---

## 📝 Paso 4: Ejecutar Schema SQL

### Crear archivo de schema (Ya lo tenemos en la spec)

`migrations/001_initial_schema.sql`:

```sql
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

-- OKR (Objectives & Key Results)
CREATE TABLE okr (
  id VARCHAR(20) PRIMARY KEY,
  oea_id VARCHAR(20) REFERENCES oea(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  owner VARCHAR(100),
  health VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_okr_oea ON okr(oea_id);

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

-- IntakeRequest
CREATE TABLE intake_request (
  id VARCHAR(20) PRIMARY KEY,
  requester VARCHAR(100) NOT NULL,
  area VARCHAR(50),
  type VARCHAR(50),
  product VARCHAR(100),
  domain VARCHAR(100),
  region VARCHAR(100),
  impact_type VARCHAR(50),
  severity VARCHAR(5),
  urgency VARCHAR(20),
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

-- KPC Product
CREATE TABLE kpc_product (
  id VARCHAR(20) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20),
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

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_oea_updated_at BEFORE UPDATE ON oea
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Ejecutar schema:

```bash
# Opción 1: Desde CLI
gcloud sql connect aria-db --user=aria-user --project kashio-squad-nova
# Pegar el SQL de arriba

# Opción 2: Desde archivo
psql "host=/cloudsql/kashio-squad-nova:us-central1:aria-db dbname=aria user=aria-user" \
  -f migrations/001_initial_schema.sql
```

---

## 💻 Paso 5: Integrar en la Aplicación

### Instalar dependencias

```bash
npm install pg @google-cloud/sql-connector
```

### Crear servicio de conexión

`src/services/databaseService.ts`:

```typescript
import { Pool } from 'pg';
import { Connector } from '@google-cloud/sql-connector';

let pool: Pool | null = null;

export async function getPool(): Promise<Pool> {
  if (pool) return pool;

  const connector = new Connector();
  const clientOpts = await connector.getOptions({
    instanceConnectionName: 'kashio-squad-nova:us-central1:aria-db',
    ipType: 'PRIVATE'
  });

  pool = new Pool({
    ...clientOpts,
    user: 'aria-user',
    password: process.env.DB_PASSWORD,
    database: 'aria',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  return pool;
}

// Ejemplo de uso
export async function getOEAs() {
  const pool = await getPool();
  const result = await pool.query('SELECT * FROM oea ORDER BY created_at DESC');
  return result.rows;
}
```

---

## 🆚 Decisión Final: Cloud SQL vs Supabase

### Elige **Cloud SQL** si:
- ✅ Ya estás todo en GCP (como tú)
- ✅ Necesitas integración nativa con Cloud Run
- ✅ Quieres compliance/security de GCP
- ✅ No te importa construir APIs manualmente
- ✅ No necesitas Realtime subscriptions

### Elige **Supabase** si:
- Necesitas Auth OAuth built-in
- Quieres APIs REST/GraphQL auto-generadas
- Necesitas Realtime (WebSockets)
- Quieres Storage integrado
- Prefieres menor costo ($25 vs $50-180)
- Quieres desarrollo más rápido

---

## 💡 Mi Recomendación para ARIA

**Usa Cloud SQL PostgreSQL** porque:

1. ✅ **Ya estás en GCP** (Cloud Run + Cloud Storage)
2. ✅ **Mejor integración** (VPC privada, menor latencia)
3. ✅ **Compliance** (cumple policies de Kashio)
4. ✅ **ARIA no necesita** las features extras de Supabase:
   - Auth → Identity Platform de GCP
   - Storage → Cloud Storage (ya lo tienes)
   - APIs → Puedes crearlas simples con Cloud Functions
   - Realtime → No es crítico para ARIA

**Ahorro de complejidad**: Toda tu infra en un solo lugar (GCP).

---

## 🛠️ Configuración Recomendada

### Tier para empezar:
```
Instance: db-f1-micro
Costo: ~$10/mes
RAM: 0.6GB
Storage: 10GB SSD
```

### Escalar cuando necesites:
```
Instance: db-g1-small
Costo: ~$50/mes
RAM: 1.7GB  
Storage: 100GB SSD
```

### Producción completa:
```
Instance: db-custom-2-7680
Costo: ~$180/mes
RAM: 7.5GB
Storage: 100GB SSD
HA: Multi-zone
```

---

## 📝 Próximos Pasos

1. **Autentica gcloud**: `gcloud auth login`
2. **Crea instancia Cloud SQL**: (comando de arriba)
3. **Ejecuta migrations**: Schema SQL
4. **Conecta Cloud Run**: VPC connector
5. **Migra datos mock**: De constants a DB

---

¿Quieres que configure Cloud SQL ahora, o prefieres mantener los datos en memoria (mock) por ahora y enfocarte en usar ARIA con el equipo primero?

La base de datos es el **último paso** - no es urgente si quieres validar el producto primero. 🎯

