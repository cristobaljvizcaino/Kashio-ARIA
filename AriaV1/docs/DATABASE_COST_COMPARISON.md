# Comparativa de Bases de Datos - Alternativas a Supabase

**Fecha**: Enero 2026  
**Para**: ARIA Control Center  
**Necesidades**: PostgreSQL + Auth (opcional) + Storage (opcional) + APIs REST

---

## 🎯 Requerimientos de ARIA

| Feature | Necesario | Alternativa |
|---------|-----------|-------------|
| **PostgreSQL 15** | ✅ Sí | - |
| **50-100 iniciativas** | ✅ Sí | ~10MB data |
| **500-1000 artefactos/año** | ✅ Sí | ~50MB metadata |
| **Auth OAuth** | ⚠️ Futuro | Identity Platform GCP |
| **File Storage** | ⚠️ Futuro | Cloud Storage GCP (ya tienes) |
| **REST APIs** | ⚠️ Nice to have | Cloud Functions |
| **Realtime** | ❌ No necesario | - |
| **Backups** | ✅ Sí | Automáticos |
| **HA** | ⚠️ Futuro | Multi-zone |

---

## 💰 Comparativa de Precios (Ordenado por Costo)

### 1. **Neon (PostgreSQL Serverless - MÁS BARATO)** ⭐⭐⭐

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | PostgreSQL serverless (AWS) |
| **Free Tier** | ✅ **Gratis hasta 10GB** 🎉 |
| **Paid** | $19/mes (Pro: 50GB) |
| **Compute** | 1 vCPU, 1GB RAM |
| **Storage** | 10GB gratis, luego $0.08/GB |
| **Backups** | 7 días retención |
| **Branching** | ✅ Database branching (como Git) |
| **Scale to Zero** | ✅ Auto-pause cuando no se usa |
| **Connection Pooling** | ✅ Built-in |
| **Website** | https://neon.tech |

**Costo para ARIA**: **$0/mes** (bien dentro de free tier) 💰

**Ventajas**:
- ✅ Completamente gratis para tu volumen
- ✅ Scale to zero (no pagas cuando no usas)
- ✅ Database branching (dev/staging/prod fácil)
- ✅ Compatible 100% con PostgreSQL

**Desventajas**:
- ❌ No tiene Auth built-in
- ❌ No tiene Storage built-in
- ❌ Externo a GCP (latencia ~30-50ms)

---

### 2. **Railway (All-in-One - Económico)** ⭐⭐⭐

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | PostgreSQL + Deploy platform |
| **Free Tier** | $5 créditos/mes gratis |
| **Paid** | $5/mes base + $0.02/GB storage |
| **Compute** | Variable (pay-per-use) |
| **Storage** | 100GB incluidos en $5 |
| **Backups** | ✅ Automáticos |
| **Integración** | ✅ Deploy app + DB en un lugar |
| **Website** | https://railway.app |

**Costo para ARIA**: **$0-2/mes**

**Ventajas**:
- ✅ Muy económico
- ✅ Puede hospedar frontend + backend + DB
- ✅ CLI excelente
- ✅ Deploy fácil

**Desventajas**:
- ❌ No tiene Auth built-in
- ❌ Menor en features que Supabase

---

### 3. **Cloud SQL (GCP Nativo)** ⭐⭐⭐

| Aspecto | Detalle |
|---------|---------|
| **Tier Micro** | db-f1-micro: $9/mes |
| **Tier Small** | db-g1-small: $50/mes |
| **Tier Medium** | db-custom-2-7680: $180/mes |
| **Compute** | 0.6GB-64GB RAM (escalable) |
| **Storage** | Desde 10GB, auto-expand |
| **Backups** | ✅ Automáticos, PITR |
| **HA** | ✅ Multi-zone disponible |
| **Integración GCP** | ✅ Nativa (VPC privada) |
| **Latencia** | ~5-10ms (desde Cloud Run) |

**Costo para ARIA**: **$9-50/mes** (según tier)

**Ventajas**:
- ✅ Integración perfecta con Cloud Run
- ✅ Latencia mínima (misma VPC)
- ✅ Compliance GCP
- ✅ Monitoreo integrado
- ✅ Ya tienes infraestructura GCP

**Desventajas**:
- ❌ Más caro que alternativas
- ❌ No tiene Auth/Storage/APIs built-in

---

### 4. **Supabase (Original)** ⭐⭐

| Aspecto | Detalle |
|---------|---------|
| **Free Tier** | 500MB database, 1GB storage |
| **Pro** | $25/mes (8GB RAM, 100GB storage) |
| **Auth** | ✅ OAuth, JWT, Magic Links |
| **Storage** | ✅ 100GB file storage |
| **APIs** | ✅ REST + GraphQL auto-generadas |
| **Realtime** | ✅ WebSocket subscriptions |
| **Edge Functions** | ✅ Deno serverless |
| **Dashboard** | ✅ UI visual excelente |

**Costo para ARIA**: **$0-25/mes**

**Ventajas**:
- ✅ All-in-one (DB + Auth + Storage + APIs)
- ✅ Developer experience excelente
- ✅ Open source
- ✅ Features premium incluidos

**Desventajas**:
- ❌ Externo a GCP
- ❌ Latencia mayor (~50ms)

---

### 5. **PlanetScale (MySQL Serverless)** ⭐⭐

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | MySQL serverless (compatible Vitess) |
| **Free Tier** | ✅ 1 database gratis |
| **Paid** | $29/mes (Scaler plan) |
| **Storage** | 10GB gratis, $0.02/GB adicional |
| **Branching** | ✅ Database branching (único!) |
| **Scale to Zero** | ✅ Auto-sleep |
| **Connections** | 1,000 concurrent |

**Costo para ARIA**: **$0-10/mes**

⚠️ **Limitación**: MySQL, no PostgreSQL (requiere migración schema)

---

### 6. **CockroachDB Serverless** ⭐

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | PostgreSQL compatible, distribuido |
| **Free Tier** | ✅ 10GB storage + 50M RUs gratis |
| **Paid** | $0.50/GB storage/mes |
| **Compute** | Pay-per-use (Request Units) |
| **Multi-region** | ✅ Global distribution |
| **ACID** | ✅ Full ACID compliance |

**Costo para ARIA**: **$0-5/mes**

**Ventajas**:
- ✅ Geo-distributed
- ✅ Muy escalable
- ✅ PostgreSQL wire-compatible

**Desventajas**:
- ❌ Sintaxis ligeramente diferente
- ❌ Más complejo de aprender

---

### 7. **Firebase Firestore (NoSQL)** ⭐

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | NoSQL document database |
| **Free Tier** | 1GB storage, 50k reads/día |
| **Paid** | $0.18/GB storage, $0.06/100k reads |
| **Auth** | ✅ Firebase Auth incluido |
| **Storage** | ✅ Firebase Storage incluido |
| **Realtime** | ✅ Built-in |
| **Integración GCP** | ✅ Nativa |

**Costo para ARIA**: **$0-3/mes**

⚠️ **Limitación**: NoSQL (cambio de paradigma, no SQL)

---

## 📊 Comparativa Completa

| Servicio | Costo/mes | PostgreSQL | Auth | Storage | APIs | Latencia GCP | Recomendado |
|----------|-----------|------------|------|---------|------|--------------|-------------|
| **Neon** | **$0** 💰 | ✅ Serverless | ❌ | ❌ | ❌ | ~50ms | ⭐⭐⭐ **MEJOR PRECIO** |
| **Railway** | **$0-2** | ✅ | ❌ | ✅ | ❌ | ~40ms | ⭐⭐⭐ |
| **Cloud SQL (Micro)** | **$9** | ✅ | ❌ | ❌ | ❌ | **~5ms** | ⭐⭐⭐ **MEJOR INTEGRACIÓN** |
| **CockroachDB** | **$0-5** | ✅ Compatible | ❌ | ❌ | ❌ | ~30ms | ⭐⭐ |
| **Supabase** | **$0-25** | ✅ | ✅ | ✅ | ✅ | ~50ms | ⭐⭐ |
| **PlanetScale** | **$0-10** | ❌ MySQL | ❌ | ❌ | ❌ | ~40ms | ⭐ |
| **Cloud SQL (Small)** | **$50** | ✅ | ❌ | ❌ | ❌ | **~5ms** | ⭐ |
| **Firestore** | **$0-3** | ❌ NoSQL | ✅ | ✅ | ✅ | **~5ms** | ⭐ |

---

## 🏆 TOP 3 RECOMENDACIONES

### #1: **Neon** (PostgreSQL Serverless) - MÁXIMO AHORRO ⭐⭐⭐

**Mejor para**: Minimizar costos sin sacrificar PostgreSQL

```
Costo: $0/mes (hasta 10GB)
Pros: Gratis, scale-to-zero, database branching
Contras: Externo a GCP (latencia +40ms vs Cloud SQL)
```

**Setup**:
```bash
# 1. Crear cuenta en https://neon.tech (gratis)
# 2. Crear proyecto
# 3. Obtener connection string
# 4. Usar en Cloud Run:
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/aria
```

---

### #2: **Cloud SQL db-f1-micro** - MEJOR INTEGRACIÓN GCP ⭐⭐⭐

**Mejor para**: Integración nativa GCP, mínima latencia

```
Costo: $9/mes
Pros: Nativo GCP, latencia ~5ms, compliance
Contras: Más caro que Neon, no scale-to-zero
```

**Setup**: Ver `docs/CLOUD_SQL_SETUP.md`

---

### #3: **Railway** - BALANCE PRECIO/FEATURES ⭐⭐

**Mejor para**: Todo en un solo lugar (app + DB)

```
Costo: $0-2/mes (con $5 créditos gratis)
Pros: Fácil, deploy todo junto, económico
Contras: Plataforma menor conocida
```

---

## 💡 Estrategia Híbrida (Recomendada)

### Para Desarrollo/Testing:
**Neon Free Tier** ($0/mes)
- Database development
- Testing de queries
- Seed data

### Para Producción:
**Cloud SQL db-f1-micro** ($9/mes)
- Cuando valides el producto
- Integración nativa GCP
- Performance óptimo

**Costo total**: $9/mes (vs $25 Supabase = **36% ahorro**)

---

## 📊 Comparativa de Features

| Feature | Neon | Railway | Cloud SQL | Supabase | CockroachDB |
|---------|------|---------|-----------|----------|-------------|
| **PostgreSQL** | ✅ 15 | ✅ 15 | ✅ 15 | ✅ 15 | ✅ Compatible |
| **Free Tier** | ✅ 10GB | ✅ $5/mes | ❌ | ✅ 500MB | ✅ 10GB |
| **Scale to Zero** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Connection Pooling** | ✅ | ✅ | ⚠️ Manual | ✅ | ✅ |
| **Backups** | 7 días | ✅ | ✅ 30 días | ✅ | ✅ |
| **PITR** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **HA/Replication** | ❌ | ❌ | ✅ $180+/mes | ✅ Pro | ✅ |
| **Latencia GCP** | ~50ms | ~40ms | **~5ms** | ~50ms | ~30ms |
| **Auth Built-in** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Storage Built-in** | ❌ | ✅ | ❌ | ✅ | ❌ |
| **REST APIs** | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 💰 Proyección de Costos Anuales

| Servicio | Mes | Año | 3 Años | Ahorro vs Supabase |
|----------|-----|-----|--------|---------------------|
| **Neon (Free)** | **$0** | **$0** | **$0** | **$300** 💰 |
| **Railway** | **$2** | **$24** | **$72** | **$228** |
| **Cloud SQL (Micro)** | **$9** | **$108** | **$324** | **$576** |
| **CockroachDB** | **$5** | **$60** | **$180** | **$120** |
| **Supabase** | $25 | $300 | $900 | Baseline |
| **Cloud SQL (Small)** | $50 | $600 | $1,800 | -$900 |

**Ahorro 3 años con Neon**: **$900** (100%) 🎉

---

## 🔧 Setup Comparado

### Neon (Más Simple)

```bash
# 1. Crear cuenta en https://neon.tech
# 2. Crear proyecto (1 click)
# 3. Copiar connection string
# 4. Listo!

# Connection string:
postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/aria?sslmode=require

# En Cloud Run:
gcloud run services update aria-frontend \
  --set-env-vars="DATABASE_URL=postgresql://..." \
  --region us-central1
```

**Tiempo**: 5 minutos

### Cloud SQL (Más Configuración)

```bash
# 1. Crear instancia (5 min)
gcloud sql instances create aria-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# 2. Crear database (1 min)
gcloud sql databases create aria --instance=aria-db

# 3. Crear usuario (1 min)
gcloud sql users create aria-user --instance=aria-db --password=xxx

# 4. Configurar Cloud Run connector (5 min)
gcloud run services update aria-frontend \
  --add-cloudsql-instances=kashio-squad-nova:us-central1:aria-db

# 5. Setup VPC connector si es necesario (10 min)
```

**Tiempo**: 20-30 minutos

---

## 🎯 Decisión por Escenario

### Escenario 1: Minimizar Costos (Startup/MVP)
**Usa: Neon Free Tier**
- $0/mes
- Suficiente para 50-100 usuarios
- Migrar a Cloud SQL cuando escales

### Escenario 2: Todo en GCP (Compliance/Integración)
**Usa: Cloud SQL db-f1-micro**
- $9/mes
- Integración nativa
- Cumple org policies
- Performance óptimo

### Escenario 3: Features All-in-One (Auth + Storage + APIs)
**Usa: Supabase**
- $25/mes
- Auth OAuth incluido
- Storage incluido
- APIs auto-generadas
- Desarrollo más rápido

### Escenario 4: Balance (ARIA específico)
**Usa: Railway**
- $0-2/mes
- PostgreSQL + hosting
- Simple de usar
- Económico

---

## 🏆 MI RECOMENDACIÓN PARA ARIA

### **CORTO PLAZO** (Ahora - 3 meses):

**Neon PostgreSQL Free Tier** ($0/mes)

**Por qué**:
1. ✅ **$0/mes** (ahorro $300/año vs Supabase)
2. ✅ **PostgreSQL puro** (sin vendor lock-in)
3. ✅ **10GB suficiente** para ARIA (~2MB data actual)
4. ✅ **Scale to zero** (no pagas cuando no usas)
5. ✅ **Fácil migrar** a Cloud SQL después

**Contras aceptables**:
- Latencia ~50ms (vs 5ms Cloud SQL) → No crítico para ARIA
- Externo a GCP → Pero ARIA no es latency-sensitive

---

### **LARGO PLAZO** (6+ meses, si escalas):

**Cloud SQL db-f1-micro** ($9/mes)

**Cuándo migrar**:
- Cuando tengas >100 usuarios activos
- Cuando necesites <10ms latency
- Cuando tengas presupuesto aprobado
- Cuando necesites compliance estricto

**Migración**: Trivial (PostgreSQL dump/restore)

---

## 🛠️ Setup Rápido: Neon (5 minutos)

### Paso 1: Crear cuenta
```
https://neon.tech
Sign up con Google (gratis, sin tarjeta)
```

### Paso 2: Crear proyecto
```
Nombre: aria-production
Región: US East (Ohio) - Más cercano a Cloud Run us-central1
PostgreSQL: 15
```

### Paso 3: Copiar connection string
```
postgresql://neondb_owner:xxxxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Paso 4: Configurar en Cloud Run
```bash
gcloud run services update aria-frontend \
  --set-env-vars="DATABASE_URL=postgresql://..." \
  --region us-central1 \
  --project kashio-squad-nova
```

### Paso 5: Ejecutar migrations
```bash
psql "postgresql://..." -f migrations/001_initial_schema.sql
```

**Total**: 5-10 minutos  
**Costo**: $0/mes

---

## 📈 Crecimiento y Escalamiento

### Volumen de Datos Proyectado para ARIA

| Año | Iniciativas | Artefactos | Tamaño DB | Tier Recomendado | Costo/mes |
|-----|-------------|------------|-----------|------------------|-----------|
| 2026 | 50 | 500 | ~5MB | **Neon Free** | **$0** |
| 2027 | 100 | 1,500 | ~15MB | **Neon Free** | **$0** |
| 2028 | 200 | 3,000 | ~35MB | **Neon Free** | **$0** |
| 2029 | 500 | 8,000 | ~100MB | **Neon Free** | **$0** |
| 2030 | 1,000 | 20,000 | ~250MB | **Neon Free** | **$0** |

**Neon free tier (10GB) te dura 10+ años** con el volumen de ARIA.

---

## 🆚 Neon vs Cloud SQL - Head to Head

| Aspecto | Neon (Free) | Cloud SQL (Micro) | Ganador |
|---------|-------------|-------------------|---------|
| **Costo** | **$0/mes** | $9/mes | **Neon** 💰 |
| **Storage** | 10GB | 10GB | Empate |
| **Latencia** | ~50ms | ~5ms | Cloud SQL ⚡ |
| **Scale to Zero** | ✅ | ❌ | Neon |
| **Integración GCP** | ❌ | ✅ | Cloud SQL |
| **Setup** | 5 min | 20 min | Neon ⏱️ |
| **Backups** | 7 días | 7 días | Empate |
| **Branching** | ✅ | ❌ | Neon 🌿 |
| **Compliance** | AWS | GCP | Cloud SQL 🔒 |

**Para ARIA**: **Neon gana** (costo $0 es decisivo, latencia no crítica)

---

## 💡 Mi Recomendación Final

### AHORA (Siguiente 30 minutos):

**Implementa Neon** porque:
1. ✅ **$0/mes** (vs $9-25 alternativas)
2. ✅ **Setup en 5 minutos** (vs 20-30 min Cloud SQL)
3. ✅ **PostgreSQL puro** (SQL estándar, fácil migrar)
4. ✅ **10GB suficiente** para años de uso de ARIA
5. ✅ **Scale to zero** (no pagas si no usas)

**Latencia ~50ms es aceptable** porque:
- ARIA no es app transaccional de alta frecuencia
- Generas 1-2 artefactos por sesión (no miles)
- UX ya tiene loading states
- 50ms humano no lo percibe (<100ms es imperceptible)

### DESPUÉS (Si necesitas):
- Migrar a Cloud SQL cuando tengas presupuesto
- Usar HA/replication si es crítico
- Todo tu SQL funciona igual (PostgreSQL estándar)

---

## 🎁 Features de Neon que te Gustarán

1. **Database Branching**: Crea branches de DB como Git
   ```bash
   # Branch para development
   neon branches create dev
   # Branch para staging  
   neon branches create staging
   ```

2. **Autoscaling**: Escala compute automáticamente

3. **SQL Editor Web**: Console visual para queries

4. **Monitoring**: Dashboards de performance

5. **Instant provisioning**: DB en <1 segundo

---

## 📊 Costo Total de ARIA con Neon

| Componente | Costo/mes |
|------------|-----------|
| Vercel (Frontend) | $0 |
| Groq (IA) | $0 |
| Neon (Database) | **$0** |
| Cloud Storage | $0.01 |
| **TOTAL** | **$0.01/mes** 🎉 |

**vs Arquitectura Original (Gemini + Supabase)**: $25.36/mes

**AHORRO**: $25.35/mes = **$304/año** = **$912/3 años** 💰💰💰

---

## 🚀 Plan de Acción Recomendado

### Migración Dual (Máximo Ahorro + Performance)

**Paso 1**: Migra IA a Groq (10 min)
- Ahorro: $4.32/año
- Mejora: 5x velocidad

**Paso 2**: Implementa Neon (10 min)
- Ahorro: $300/año
- Mejora: Persistencia de datos

**Tiempo total**: 20 minutos  
**Ahorro total**: **$304/año**  
**ARIA costo final**: **$0.01/mes**

---

¿Quieres que implemente Neon PostgreSQL ahora? Es gratis y toma solo 10 minutos. 🚀

O prefieres primero migrar a Groq (IA gratis y más rápida)? Puedo hacer ambas en 20 minutos total.

