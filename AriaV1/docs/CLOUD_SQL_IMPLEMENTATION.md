# Implementación Cloud SQL - ARIA Control Center

**Instancia**: `aria-db`  
**Tier**: db-f1-micro ($9/mes)  
**Región**: us-central1  
**PostgreSQL**: 15

---

## ✅ Paso 1: Instancia Creada (Completado)

```bash
✅ Instancia: aria-db
✅ Status: PENDING_CREATE (tardará 5-10 minutos)
✅ Tier: db-f1-micro (0.6GB RAM, 1 vCPU compartido)
✅ Storage: 10GB SSD (auto-expand)
✅ Backups: Diarios a las 3:00 AM, retención 7 días
```

**Verificar estado**:
```bash
gcloud sql instances describe aria-db --project kashio-squad-nova
```

**Monitorear en consola**:
https://console.cloud.google.com/sql/instances?project=kashio-squad-nova

---

## 📝 Paso 2: Crear Base de Datos y Usuario

Una vez la instancia esté **RUNNABLE**, ejecutar:

```bash
# 1. Crear database
gcloud sql databases create aria \
  --instance=aria-db \
  --project=kashio-squad-nova

# 2. Crear usuario
gcloud sql users create aria-user \
  --instance=aria-db \
  --password="CAMBIAR_PASSWORD_SEGURO_AQUI" \
  --project=kashio-squad-nova

# 3. Set password de postgres (root)
gcloud sql users set-password postgres \
  --instance=aria-db \
  --password="OTRO_PASSWORD_SEGURO" \
  --project=kashio-squad-nova
```

---

## 🗄️ Paso 3: Ejecutar Schema SQL

```bash
# Opción A: Desde Cloud Shell
gcloud sql connect aria-db --user=postgres --project=kashio-squad-nova

# Una vez conectado:
\i /path/to/migrations/001_initial_schema.sql

# Opción B: Desde local con gcloud  
gcloud sql connect aria-db --user=postgres --project=kashio-squad-nova < migrations/001_initial_schema.sql
```

**Resultado esperado**:
```
CREATE TABLE (x9)
CREATE INDEX (x12)
CREATE TRIGGER (x7)
CREATE FUNCTION (x2)
INSERT 0 2 (OEAs)
INSERT 0 2 (OKRs)
INSERT 0 1 (Initiative)
Schema created successfully! Tables: 9
```

---

## 🔗 Paso 4: Conectar Cloud Run a Cloud SQL

### 4.1: Actualizar Cloud Run

```bash
gcloud run services update aria-frontend \
  --region us-central1 \
  --add-cloudsql-instances=kashio-squad-nova:us-central1:aria-db \
  --set-env-vars="DATABASE_URL=postgresql://aria-user:PASSWORD@/aria?host=/cloudsql/kashio-squad-nova:us-central1:aria-db" \
  --project kashio-squad-nova
```

### 4.2: Connection String Format

```
postgresql://[USER]:[PASSWORD]@/[DATABASE]?host=/cloudsql/[INSTANCE_CONNECTION_NAME]

Ejemplo:
postgresql://aria-user:MyS3cureP@ss@/aria?host=/cloudsql/kashio-squad-nova:us-central1:aria-db
```

---

## 💻 Paso 5: Actualizar Código de la Aplicación

### Instalar dependencias

```bash
cd /Users/jules/Kashio/ARIA
npm install pg @google-cloud/sql-connector
```

### Crear servicio de database

`src/services/databaseService.ts`:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to Cloud SQL');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err);
});

// Ejemplo: Get OEAs
export async function getOEAs() {
  const result = await pool.query(
    'SELECT * FROM oea ORDER BY progress DESC'
  );
  return result.rows;
}

// Ejemplo: Create artifact
export async function createArtifact(artifact: any) {
  const result = await pool.query(
    `INSERT INTO artifact (id, initiative_id, gate, name, category, version, status, artifact_type, generated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [artifact.id, artifact.initiativeId, artifact.gate, artifact.name, artifact.category, artifact.version, artifact.status, artifact.type, 'ARIA']
  );
  return result.rows[0];
}

export default { pool, getOEAs, createArtifact };
```

---

## 🧪 Paso 6: Testing de Conexión

### Test desde CLI

```bash
# Conectar a la DB
gcloud sql connect aria-db --user=aria-user --project=kashio-squad-nova

# Ejecutar queries de prueba
SELECT * FROM oea;
SELECT * FROM portfolio_initiative;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
```

### Test desde Cloud Functions

Actualizar una función para probar la conexión:

```javascript
// functions/api/test-db.js
import { Pool } from 'pg';

export async function testDatabase(req, res) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    res.json({
      success: true,
      connected: true,
      time: result.rows[0].current_time,
      version: result.rows[0].pg_version
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    await pool.end();
  }
}
```

---

## 📊 Paso 7: Migrar Datos Mock a Cloud SQL

Script para migrar datos de `constants.tsx` a Cloud SQL:

```typescript
// scripts/migrate-mock-data.ts
import { pool } from '../src/services/databaseService';
import { OEAS, OKRS, PORTFOLIO_2026 } from '../src/constants/constants';

async function migrate() {
  // Migrar OEAs
  for (const oea of OEAS) {
    await pool.query(
      'INSERT INTO oea (id, name, owner, period, progress, health, impact) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
      [oea.id, oea.name, oea.owner, oea.period, oea.progress, oea.health, oea.impact]
    );
  }
  
  // Migrar OKRs
  for (const okr of OKRS) {
    await pool.query(
      'INSERT INTO okr (id, oea_id, name, owner, health) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
      [okr.id, okr.oeaId, okr.name, okr.owner, okr.health]
    );
  }
  
  // Migrar Iniciativas
  for (const init of PORTFOLIO_2026) {
    await pool.query(
      `INSERT INTO portfolio_initiative 
       (id, name, portfolio, status, start_date, end_date, owner, lead, tech_lead, squads, okr_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [init.id, init.name, init.portfolio, init.status, init.start, init.end, init.owner, init.lead, init.techLead, init.squads, init.okrId]
    );
  }
  
  console.log('✅ Migration completada');
}

migrate().catch(console.error);
```

---

## 🔐 Paso 8: Seguridad y Permisos

### Almacenar password en Secret Manager

```bash
# Crear secret para DB password
echo -n "tu_password_db_aqui" | gcloud secrets create cloud-sql-password \
  --data-file=- \
  --replication-policy="automatic" \
  --project kashio-squad-nova

# Otorgar acceso al service account
gcloud secrets add-iam-policy-binding cloud-sql-password \
  --member="serviceAccount:215989210525-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project kashio-squad-nova
```

### Actualizar Cloud Run con secret

```bash
gcloud run services update aria-frontend \
  --region us-central1 \
  --update-secrets="DB_PASSWORD=cloud-sql-password:latest" \
  --project kashio-squad-nova
```

---

## 📊 Monitoreo y Performance

### Ver métricas en consola

```
https://console.cloud.google.com/sql/instances/aria-db/overview?project=kashio-squad-nova
```

**Métricas disponibles**:
- CPU utilization
- Memory usage
- Connections activas
- Query performance
- Storage usado

### Queries lentas

```sql
-- Ver queries más lentas
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 💰 Costos

| Componente | Costo/mes |
|------------|-----------|
| **Cloud SQL (db-f1-micro)** | $9.37 |
| **Storage (10GB SSD)** | Incluido |
| **Backups** | Incluido (7 días) |
| **Network egress** | $0.12/GB (después de 1GB) |
| **Total estimado** | **~$9.50/mes** |

---

## 🚀 Estado Actual

| Paso | Estado | Tiempo |
|------|--------|--------|
| 1. Habilitar API | ✅ Completado | - |
| 2. Crear instancia | 🔄 En progreso | 5-10 min |
| 3. Crear database | ⏭️ Pendiente | 2 min |
| 4. Ejecutar schema | ⏭️ Pendiente | 2 min |
| 5. Conectar Cloud Run | ⏭️ Pendiente | 2 min |
| 6. Testing | ⏭️ Pendiente | 5 min |

**Total**: 15-20 minutos (después de que instancia esté lista)

---

## 📞 Próximos Comandos

Ejecutar cuando instancia esté **RUNNABLE**:

```bash
# Verificar status
gcloud sql instances describe aria-db --project kashio-squad-nova | grep state

# Si dice "RUNNABLE", continuar con Paso 2
gcloud sql databases create aria --instance=aria-db
gcloud sql users create aria-user --instance=aria-db --password="PASSWORD"

# Paso 3
gcloud sql connect aria-db --user=postgres < migrations/001_initial_schema.sql

# Paso 4
gcloud run services update aria-frontend \
  --add-cloudsql-instances=kashio-squad-nova:us-central1:aria-db \
  --set-env-vars="DATABASE_URL=postgresql://aria-user:PASSWORD@/aria?host=/cloudsql/kashio-squad-nova:us-central1:aria-db"
```

---

**Última actualización**: Enero 16, 2026  
**Instancia en creación**: ETA 10 minutos  
**Próximo paso**: Esperar RUNNABLE status

