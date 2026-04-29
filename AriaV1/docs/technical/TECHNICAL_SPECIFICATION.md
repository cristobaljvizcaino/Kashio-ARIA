# Especificación Técnica Completa - ARIA Control Center
**Versión**: 3.0.0  
**Fecha**: Enero 2026  
**Autor**: Equipo de Arquitectura Kashio  
**Estado**: Producción  
**Plataforma Cloud**: Google Cloud Platform (GCP) + Supabase  
**Base de Datos**: Supabase PostgreSQL

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Infraestructura GCP](#infraestructura-gcp)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Modelo de Datos Completo](#modelo-de-datos-completo)
6. [Arquitectura Frontend](#arquitectura-frontend)
7. [Servicios Backend/AI](#servicios-backend-ai)
8. [Integraciones](#integraciones)
9. [Seguridad](#seguridad)
10. [Performance y Escalabilidad](#performance-y-escalabilidad)
11. [Deployment en GCP](#deployment-en-gcp)
12. [Monitoreo y Observabilidad](#monitoreo-y-observabilidad)
13. [Costos y Estimaciones GCP](#costos-y-estimaciones-gcp)
14. [Modelo de Datos Detallado](#modelo-de-datos-detallado)

---

## 1. Resumen Ejecutivo

### 1.1 Propósito del Sistema

**ARIA (Automated Requirements & Intelligent Artifacts)** es una aplicación web enterprise que automatiza la gestión del Product Development Life Cycle (PDLC) mediante:

- Generación automática de artefactos con IA
- Gestión de OEA/OKR alineados con iniciativas
- Control de gobernanza multi-gate (G0-G5)
- Repositorio centralizado de productos (KPC Catalog)

### 1.2 Alcance

- **Usuarios**: Product Managers, Tech Leads, PMO, Stakeholders
- **Volumen**: ~50 iniciativas activas, ~200 artefactos generados/mes
- **Disponibilidad**: 99.5% SLA
- **Latencia objetivo**: <2s para operaciones CRUD, <10s para generación AI

### 1.3 Objetivos de Arquitectura

1. ✅ **Modularidad**: Separación clara de concerns
2. ✅ **Type Safety**: TypeScript en toda la aplicación
3. ✅ **Performance**: Renderizado optimizado con React 19
4. ✅ **Mantenibilidad**: Código limpio y documentado
5. ✅ **Extensibilidad**: Fácil agregar nuevos módulos
6. ✅ **Observabilidad**: Logs y métricas integradas

---

## 2. Arquitectura General

### 2.1 Diagrama de Alto Nivel - Arquitectura GCP + Supabase

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD PLATFORM (GCP)                   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            Cloud Load Balancing + Cloud CDN                 │ │
│  │                  (SSL/TLS Termination)                      │ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Cloud Run (Frontend)                         ││
│  │            ARIA Web App (React 19 + TypeScript)              ││
│  │                                                               ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   ││
│  │  │   OEA    │  │Portfolio │  │  PDLC    │  │   KPC    │   ││
│  │  │ Strategy │  │Management │  │ Overview │  │ Catalog  │   ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   ││
│  │                                                               ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   ││
│  │  │  Intake  │  │   ARIA   │  │Inventory │  │Governance│   ││
│  │  │   Hub    │  │Generation│  │   View   │  │  & Audit │   ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   ││
│  │                                                               ││
│  │            Auto-scaling: 1-10 instances                      ││
│  └───────────────────────┬───────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Cloud Run (Backend API - Futuro)                ││
│  │                    Node.js/Express                           ││
│  │            Auto-scaling: 0-20 instances                      ││
│  └───────────┬─────────────────────┬──────────────────────────┘│
│              │                      │                            │
│              │                      ▼                            │
│              │         ┌────────────────────────────────┐       │
│              │         │      Vertex AI / Gemini        │       │
│              │         │                                │       │
│              │         │  • Gemini Pro (análisis)       │       │
│              │         │  • Gemini Flash (generación)   │       │
│              │         │  • Embeddings API              │       │
│              │         │  • Context Caching             │       │
│              │         │                                │       │
│              │         │  Managed AI Platform           │       │
│              │         └────────────────────────────────┘       │
│              │                                                   │
│              │         ┌────────────────────────────────┐       │
│              │         │    Secret Manager              │       │
│              │         │                                │       │
│              │         │  • Supabase Keys               │       │
│              │         │  • Gemini API Keys             │       │
│              │         │  • OAuth Credentials           │       │
│              │         │                                │       │
│              │         │  Auto-rotation: Enabled        │       │
│              │         └────────────────────────────────┘       │
│              │                                                   │
│              ▼                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                Infrastructure & Monitoring                    ││
│  │                                                               ││
│  │  • Cloud Logging      • Cloud Monitoring                     ││
│  │  • Cloud Trace        • Cloud Profiler                       ││
│  │  • Error Reporting    • Cloud Build (CI/CD)                  ││
│  │  • Cloud Armor (DDoS Protection)                             ││
│  └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE PLATFORM                        │
│                    (Backend-as-a-Service)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           Supabase PostgreSQL Database (Primary)             ││
│  │                                                               ││
│  │  • PostgreSQL 15 (Fully Managed)                             ││
│  │  • Connection Pooling (PgBouncer)                            ││
│  │  • Point-in-Time Recovery (PITR)                             ││
│  │  • Automated Backups (Daily)                                 ││
│  │  • High Availability + Read Replicas                         ││
│  │                                                               ││
│  │  Tables:                                                      ││
│  │    - oea, okr, key_result                                    ││
│  │    - portfolio_initiative                                    ││
│  │    - artifact, artifact_destination                          ││
│  │    - intake_request                                          ││
│  │    - kpc_product, kpc_module, kpc_service                    ││
│  │                                                               ││
│  │  Features:                                                    ││
│  │    ✅ Row Level Security (RLS)                               ││
│  │    ✅ Triggers & Functions                                   ││
│  │    ✅ Real-time Subscriptions                                ││
│  │    ✅ Full-text Search                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      Supabase Auth                            ││
│  │                                                               ││
│  │  • OAuth 2.0 + OIDC                                          ││
│  │  • Azure AD / Google / GitHub SSO                            ││
│  │  • JWT Tokens (HS256/RS256)                                  ││
│  │  • Magic Links                                               ││
│  │  • Row Level Security Integration                            ││
│  │  • User Management API                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Supabase Storage                           ││
│  │                                                               ││
│  │  Buckets:                                                     ││
│  │    - aria-artifacts (PDFs, DOCx generados)                   ││
│  │    - aria-assets (Plantillas, imágenes)                      ││
│  │    - aria-backups (Exports y backups)                        ││
│  │                                                               ││
│  │  Features:                                                    ││
│  │    ✅ S3-compatible API                                       ││
│  │    ✅ CDN integration                                         ││
│  │    ✅ Image transformation                                    ││
│  │    ✅ Access control con RLS                                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Supabase Auto-generated APIs                     ││
│  │                                                               ││
│  │  • REST API (PostgREST)                                      ││
│  │  • GraphQL API                                               ││
│  │  • Realtime Subscriptions (WebSockets)                       ││
│  │  • Edge Functions (Deno runtime)                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Supabase Vault                             ││
│  │                                                               ││
│  │  • Encrypted secrets storage                                 ││
│  │  • Database connection strings                               ││
│  │  • API keys encryption                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Region: us-east-1 (Primary) | Backup: us-west-2               │
│  Tier: Pro Plan ($25/mes)                                       │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  External Integrations                          │
│                                                                  │
│  • Confluence API      • Jira API                               │
│  • SharePoint API      • Read.me API                            │
│  • Slack Webhooks      • GitHub API                             │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 Arquitectura de Capas

```
┌─────────────────────────────────────────────┐
│           Presentation Layer                 │  ← React Components, Views
├─────────────────────────────────────────────┤
│          Business Logic Layer                │  ← Hooks, Utils, Helpers
├─────────────────────────────────────────────┤
│            Service Layer                     │  ← API calls, AI integration
├─────────────────────────────────────────────┤
│             Data Layer                       │  ← Types, Constants, State
└─────────────────────────────────────────────┘
```

### 2.3 Patrón de Diseño

- **Component-Based Architecture**: Reutilización de componentes
- **Container/Presentational Pattern**: Separación de lógica y UI
- **Service Layer Pattern**: Abstracción de servicios externos
- **Hook-based State Management**: Custom hooks para lógica compartida

---

## 3. Infraestructura GCP

### 3.1 Servicios GCP y Supabase Utilizados

#### Servicios Google Cloud Platform (GCP)

| Servicio GCP | Propósito | Tier/Config | Costo Estimado |
|--------------|-----------|-------------|----------------|
| **Cloud Run** | Frontend React + Backend API | 1-10 instancias, 2GB RAM, 2 vCPU | $50-150/mes |
| **Vertex AI** | Gemini Pro + Flash | Pay-per-use | $100-300/mes |
| **Secret Manager** | Gestión de secretos (Gemini API keys) | Por operación | $3/mes |
| **Cloud Load Balancing** | Balanceo de carga global | Premium Tier | $18/mes |
| **Cloud CDN** | Content Delivery Network | Global | $20-40/mes |
| **Cloud Logging** | Logs centralizados | 50GB/mes | $25/mes |
| **Cloud Monitoring** | Métricas y alertas | Standard | $15/mes |
| **Cloud Build** | CI/CD pipelines | 120 min/día gratis | $0-20/mes |
| **Cloud Armor** | DDoS protection y WAF | Estándar | $30/mes |

**Subtotal GCP**: $261-601 USD/mes

#### Supabase Platform

| Servicio Supabase | Propósito | Tier/Config | Costo Estimado |
|-------------------|-----------|-------------|----------------|
| **Supabase Pro Plan** | PostgreSQL + Auth + Storage + APIs | Database: 8GB RAM, 2 vCPU, 100GB storage | **$25/mes base** |
| **Database (incluido)** | PostgreSQL 15 managed | Connection pooling, Automated backups, PITR | Incluido |
| **Auth (incluido)** | OAuth 2.0, Azure AD SSO, JWT | 100,000 MAUs incluidos | Incluido |
| **Storage (incluido)** | File storage (artefactos) | 100GB storage, 200GB bandwidth | Incluido |
| **Realtime (incluido)** | WebSocket subscriptions | 200 concurrent connections | Incluido |
| **Edge Functions (incluido)** | Serverless functions (Deno) | 500k invocations/mes | Incluido |
| **Extra DB Compute** | Si se necesita escalar | +2 vCPU, +8GB RAM | $50/mes (opcional) |
| **Extra Storage** | Si se excede 100GB | Por 100GB adicionales | $25/mes (opcional) |
| **Extra Bandwidth** | Si se excede 200GB | Por 100GB adicionales | $9/mes (opcional) |

**Total Supabase**: $25-109 USD/mes

**Total General Estimado**: $286-710 USD/mes

**Ahorro vs Cloud SQL**: ~$177/mes (Cloud SQL era $180/mes vs Supabase $25/mes)

### 3.2 Arquitectura de Red

```
┌──────────────────────────────────────────────────────────────┐
│                     Global Load Balancer                      │
│                    (Premium Network Tier)                     │
│                    SSL: aria.kashio.com                       │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                       Cloud CDN                               │
│               (Cache static assets globally)                  │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌────────┐    ┌────────┐    ┌────────┐
   │Cloud Run│    │Cloud Run│    │Cloud Run│
   │us-east1│    │us-west1│    │eu-west1│
   └────────┘    └────────┘    └────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │   VPC Network       │
            │  (Private Subnet)   │
            └─────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    Cloud SQL    Cloud Storage   Vertex AI
   (Primary)                     
    us-central1
```

### 3.3 Regiones y Multi-Region

**Primary Region**: `us-central1` (Iowa)  
**Secondary Region**: `us-east1` (South Carolina) - Disaster Recovery  
**CDN**: Global (220+ ubicaciones)

**Justificación**:
- Latencia <50ms para usuarios en América
- Cumplimiento GDPR (región EU disponible)
- DR automático con Cloud SQL HA

### 3.4 Cloud Run - Configuración Frontend

**Dockerfile optimizado**:
```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

**Configuración Cloud Run**:
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: aria-frontend
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/kashio-prod/aria-frontend:latest
        ports:
        - containerPort: 8080
        resources:
          limits:
            memory: 2Gi
            cpu: "2"
        env:
        - name: VITE_API_URL
          value: "https://api.aria.kashio.com"
```

**Características**:
- ✅ Auto-scaling de 1 a 10 instancias
- ✅ Cold start <500ms (nginx + pre-built assets)
- ✅ 2GB RAM, 2 vCPU por instancia
- ✅ Concurrencia: 80 requests/instancia
- ✅ HTTPS automático con certificado gestionado

### 3.5 Supabase PostgreSQL Configuration

**Supabase Pro Plan Specs**:
- **Versión**: PostgreSQL 15
- **Compute**: 8GB RAM, 2 vCPU (shared)
- **Storage**: 100GB database + 100GB file storage (expandible)
- **Connection Pooling**: PgBouncer integrado (automático)
- **Backups**: Automáticos diarios + Point-in-Time Recovery (PITR hasta 7 días)
- **High Availability**: Multi-zone con read replicas
- **Encryption**: AES-256 at-rest, TLS 1.3 in-transit
- **Uptime SLA**: 99.9%

**Connection Configuration**:
```typescript
// Supabase Client SDK
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 
      'x-application': 'aria-control-center',
      'x-version': '3.0.0'
    }
  }
});

// Para backend (con service_role key - bypassing RLS)
const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export { supabaseAdmin };
```

**Direct PostgreSQL Connection** (para migrations/scripts):
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Connection string format:
// postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Supabase Features Habilitadas**:
- ✅ **Row Level Security (RLS)**: Control de acceso granular por fila
- ✅ **Realtime**: Subscripciones WebSocket a cambios en DB
- ✅ **Full-text Search**: Búsqueda avanzada con `tsvector`
- ✅ **PostgREST API**: REST API auto-generada
- ✅ **pg_stat_statements**: Performance monitoring
- ✅ **pgvector** (opcional): Para embeddings de IA

### 3.6 Supabase Auth

**Autenticación y Autorización**:

```typescript
// Login con Azure AD (OAuth)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'azure',
  options: {
    scopes: 'email profile',
    redirectTo: 'https://aria.kashio.com/auth/callback',
    queryParams: {
      tenant: process.env.AZURE_TENANT_ID,
      domain_hint: 'kashio.com'
    }
  }
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// User metadata
interface UserProfile {
  id: string;
  email: string;
  role: 'product_manager' | 'tech_lead' | 'pmo' | 'stakeholder';
  team: string;
  app_metadata: {
    provider: 'azure';
    kashio_employee_id: string;
  }
}
```

**Row Level Security (RLS) Policies**:
```sql
-- Ejemplo: Solo product managers pueden crear iniciativas
CREATE POLICY "Product managers can create initiatives"
ON portfolio_initiative
FOR INSERT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'product_manager'
);

-- Ejemplo: Todos pueden leer artefactos activos
CREATE POLICY "Everyone can read active artifacts"
ON artifact
FOR SELECT
TO authenticated
USING (status = 'ACTIVE');

-- Ejemplo: Solo el creador puede editar su intake request
CREATE POLICY "Users can edit own intake requests"
ON intake_request
FOR UPDATE
TO authenticated
USING (auth.uid() = requester_id);
```

**Roles y Permisos** (app_metadata):
- `product_manager`: Full access (CRUD en todas las tablas)
- `tech_lead`: Read + write artifacts G4-G5, read resto
- `pmo`: Read-only governance + metrics
- `stakeholder`: Read-only OEA/Portfolio

### 3.7 Supabase Storage

**Buckets Configurados**:

```typescript
// Create buckets (una sola vez)
await supabase.storage.createBucket('aria-artifacts', {
  public: false,
  fileSizeLimit: 52428800, // 50MB
  allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
});

await supabase.storage.createBucket('aria-assets', {
  public: true,
  fileSizeLimit: 10485760, // 10MB
  allowedMimeTypes: ['image/*']
});

// Upload artifact
const file = new File([pdfBlob], 'artifact-G2-001.pdf', { type: 'application/pdf' });
const { data, error } = await supabase.storage
  .from('aria-artifacts')
  .upload(`${initiativeId}/${artifactId}/v${version}.pdf`, file, {
    cacheControl: '3600',
    upsert: false
  });

// Get signed URL (expires in 1 hour)
const { data: { signedUrl } } = await supabase.storage
  .from('aria-artifacts')
  .createSignedUrl(`${initiativeId}/${artifactId}/v${version}.pdf`, 3600);

// Download file
const { data: fileBlob } = await supabase.storage
  .from('aria-artifacts')
  .download(`${initiativeId}/${artifactId}/v${version}.pdf`);
```

**Storage Structure**:
```
aria-artifacts/ (private)
├── {initiative-id}/
│   ├── {artifact-id}/
│   │   ├── v1.0.0.pdf
│   │   ├── v1.1.0.pdf
│   │   └── v2.0.0.pdf
│   └── brm/
│       └── brm-documento.docx

aria-assets/ (public)
├── templates/
│   ├── brm-template.docx
│   └── ficha-funcional-template.docx
├── images/
│   └── logos/
│       └── kashio-logo.svg

aria-backups/ (private)
└── exports/
    └── 2026-01-15-full-export.sql
```

**Features**:
- ✅ CDN integration (fast global delivery)
- ✅ Image transformation on-the-fly
- ✅ Resumable uploads (para archivos grandes)
- ✅ Access control con RLS
- ✅ Webhooks en eventos (upload, delete)

### 3.8 Vertex AI - Gemini Integration

**Modelos Configurados**:

| Modelo | Uso | Pricing | Contexto |
|--------|-----|---------|----------|
| **gemini-1.5-pro** | Análisis complejos, intake classification | $7/1M tokens input, $21/1M output | 1M tokens |
| **gemini-1.5-flash** | Generación rápida de artefactos, chatbot | $0.35/1M input, $1.05/1M output | 1M tokens |

**Configuración SDK**:
```typescript
import { VertexAI } from '@google-cloud/vertexai';

const vertexAI = new VertexAI({
  project: 'kashio-prod',
  location: 'us-central1'
});

const model = vertexAI.preview.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.7,
    topP: 0.8,
    topK: 40
  }
});
```

**Optimizaciones**:
- ✅ **Context Caching**: Cache de 50,000 tokens del contexto PDLC (90% reducción de costos)
- ✅ **Batch Requests**: Agrupar múltiples artefactos en una sola llamada
- ✅ **Rate Limiting**: 60 RPM por usuario

### 3.7 Secret Manager

**Secretos Almacenados**:
```bash
gcloud secrets create gemini-api-key \
  --data-file=./secrets/gemini-key.txt \
  --replication-policy="automatic" \
  --labels=env=prod,app=aria

gcloud secrets create cloud-sql-password \
  --data-file=./secrets/db-password.txt \
  --rotation-period="2592000s" \
  --next-rotation-time="2026-03-01T00:00:00Z"
```

**Acceso desde Cloud Run**:
```typescript
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

async function getSecret(name: string): Promise<string> {
  const [version] = await client.accessSecretVersion({
    name: `projects/kashio-prod/secrets/${name}/versions/latest`
  });
  return version.payload?.data?.toString() || '';
}
```

### 3.8 IAM y Permisos

**Service Accounts**:

| Service Account | Roles | Propósito |
|-----------------|-------|-----------|
| `aria-frontend@kashio-prod.iam` | Cloud Run Invoker, Secret Manager Accessor | Frontend en Cloud Run |
| `aria-backend@kashio-prod.iam` | Cloud SQL Client, Cloud Storage Object Admin, Vertex AI User | Backend API |
| `aria-cicd@kashio-prod.iam` | Cloud Build Editor, Artifact Registry Writer | CI/CD pipelines |

**Principle of Least Privilege aplicado**.

---

## 4. Stack Tecnológico

### 3.1 Frontend Core

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 19.2.3 | Framework UI principal |
| **TypeScript** | 5.8.2 | Type safety y developer experience |
| **Vite** | 6.2.0 | Build tool, HMR, dev server |
| **TailwindCSS** | Latest (CDN) | Sistema de diseño utility-first |

**Justificación de React 19**:
- Mejor performance con el nuevo compilador
- Server Components (preparación futura)
- Mejoras en Suspense y Concurrent Rendering
- Hooks más eficientes

**Justificación de Vite**:
- Build ~10x más rápido que Webpack
- HMR instantáneo
- Native ESM support
- Tree-shaking optimizado

### 3.2 Librerías UI

| Librería | Versión | Uso |
|----------|---------|-----|
| **lucide-react** | 0.562.0 | Iconografía SVG optimizada |
| **recharts** | 3.6.0 | Gráficos y visualización de datos |

### 4.3 AI/Backend - Google Cloud Services

| Servicio | Versión/Tier | Propósito |
|----------|--------------|-----------|
| **Vertex AI** | Production | Plataforma ML administrada |
| **Gemini 1.5 Pro** | Latest | Análisis complejos de intake |
| **Gemini 1.5 Flash** | Latest | Generación rápida de artefactos |
| **@google-cloud/vertexai** | 1.7.0 | SDK oficial de Vertex AI |
| **Cloud SQL (PostgreSQL)** | 15 | Base de datos relacional |
| **Cloud Storage** | Standard | Almacenamiento de artefactos |
| **Cloud Run** | Gen 2 | Hosting frontend y backend API |

**Modelos utilizados**:
- `gemini-1.5-flash`: Generación rápida (<3s), chatbot ARIA
- `gemini-1.5-pro`: Análisis complejos, clasificación intake
- **Context Caching**: Optimización de costos (90% reducción)

### 3.4 Tooling

| Tool | Propósito |
|------|-----------|
| **ESLint** | Linting de código |
| **Prettier** | Formateo automático |
| **TypeScript Compiler** | Type checking |
| **Git** | Control de versiones |

---

## 4. Modelo de Datos

### 4.1 Diagrama de Entidades

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│     OEA     │ 1     * │     OKR     │ 1     * │  Initiative  │
│             │─────────│             │─────────│  (Portfolio) │
│ - id        │         │ - id        │         │  - id        │
│ - name      │         │ - oeaId     │         │  - okrId     │
│ - owner     │         │ - name      │         │  - name      │
│ - progress  │         │ - owner     │         │  - status    │
│ - health    │         │ - health    │         │  - start/end │
└─────────────┘         │ - keyResults│         └──────────────┘
                        └─────────────┘
                                                        │
                                                        │ 1
                                                        │
                                                        │ *
                                                 ┌──────────────┐
                                                 │   Artifact   │
                                                 │              │
                                                 │ - id         │
                                                 │ - gate       │
                                                 │ - name       │
                                                 │ - status     │
                                                 │ - version    │
                                                 │ - type       │
                                                 └──────────────┘

┌──────────────┐         ┌──────────────┐
│     Gate     │ 1     * │   Artifact   │
│              │─────────│   (Master)   │
│ - id (G0-G5) │         │              │
│ - name       │         │ - id         │
│ - status     │         │ - category   │
│ - owner      │         │ - mandatory  │
│ - sla        │         │ - destination│
└──────────────┘         └──────────────┘

┌──────────────┐         ┌──────────────┐
│ KPC Product  │ 1     * │  KPC Module  │
│              │─────────│              │
│ - id         │         │ - code       │
│ - code       │         │ - name       │
│ - name       │         │ - mandatory  │
│ - status     │         │ - version    │
│ - version    │         │ - services   │
│ - pdlcId     │         └──────────────┘
└──────────────┘

┌──────────────┐
│   Intake     │
│   Request    │
│              │
│ - id         │
│ - requester  │
│ - type       │
│ - severity   │
│ - urgency    │
│ - problem    │
│ - outcome    │
│ - status     │
│ - ariaAnalysis│
└──────────────┘
```

### 4.2 Enums y Estados

#### GateStatus
```typescript
enum GateStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  BLOCKED = 'BLOCKED'
}
```

#### ArtifactStatus
```typescript
enum ArtifactStatus {
  NOT_STARTED = 'NOT_STARTED',
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  OBSOLETE = 'OBSOLETE',
  PENDING_HITL = 'PENDING_HITL',
  GENERATING = 'GENERATING'
}
```

### 4.3 Interfaces Principales

Ver archivo completo: `src/types/types.ts`

**Interfaces Core**:
- `Gate`: Representa un punto de control PDLC
- `Artifact`: Documento generado/vinculado a un gate
- `Initiative`: Proyecto/iniciativa del portafolio
- `PortfolioInitiative`: Extensión con metadata de portfolio
- `Oea`, `Okr`, `KeyResult`: Objetos estratégicos
- `IntakeRequest`: Solicitud de intake con análisis ARIA
- `KpcProduct`, `KpcModule`, `KpcService`: Catálogo de productos
- `ChatMessage`: Mensajes del chatbot ARIA

### 5.4 Almacenamiento de Datos - Supabase

**Fase 1 - MVP (Actual)**:
- ✅ **In-Memory (Constants)**: Datos mock en `src/constants/constants.tsx`
- ✅ **React State**: State local por componente
- ✅ **No persistencia**: Reload pierde datos

**Fase 2 - Producción (Q2 2026)** - **Supabase Platform**:

#### Supabase PostgreSQL (Base de Datos Principal)
- ✅ **PostgreSQL 15 Managed Database**
  - Compute: 8GB RAM, 2 vCPU
  - Storage: 100GB database (auto-expand hasta 500GB)
  - Connection Pooling: PgBouncer automático (max 200 connections)
  - Backups: Diarios + PITR (Point-in-Time Recovery 7 días)
  - HA: Multi-zone con read replicas automáticas
  - Encryption: AES-256 at-rest, TLS 1.3 in-transit

#### Supabase Storage (Archivos)
- ✅ **File Storage**
  - Buckets: `aria-artifacts`, `aria-assets`, `aria-backups`
  - Storage: 100GB incluidos en Pro plan
  - CDN: Integrado para delivery global
  - Access Control: Row Level Security (RLS)
  - Features: Image transformation, resumable uploads

#### Supabase Realtime (Opcional)
- ✅ **WebSocket Subscriptions**
  - Realtime updates en cambios de DB
  - 200 concurrent connections incluidas
  - Broadcast channels para colaboración
  - Presence tracking para usuarios online

**Esquema de Conexión**:
```typescript
// Supabase Client (Frontend)
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// Ejemplo: Query con RLS automático
const { data: initiatives, error } = await supabase
  .from('portfolio_initiative')
  .select(`
    *,
    okr (
      name,
      oea (name)
    )
  `)
  .eq('status', 'En Curso')
  .order('created_at', { ascending: false });

// Ejemplo: Realtime subscription
const channel = supabase
  .channel('artifacts-changes')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'artifact' },
    (payload) => {
      console.log('New artifact created:', payload.new);
    }
  )
  .subscribe();
```

**Ventajas de Supabase**:
1. ✅ **Costo**: $25/mes vs $180/mes (Cloud SQL) = **86% ahorro**
2. ✅ **Auto-generated APIs**: REST + GraphQL sin código
3. ✅ **Auth integrado**: OAuth con Azure AD built-in
4. ✅ **Realtime**: WebSockets nativos
5. ✅ **Row Level Security**: Seguridad granular en DB
6. ✅ **Dashboard**: UI visual para gestión de DB
7. ✅ **Storage integrado**: No necesita Cloud Storage separado
8. ✅ **Migraciones**: CLI para version control del schema
9. ✅ **Edge Functions**: Serverless functions en Deno
10. ✅ **Open Source**: Basado en PostgreSQL + PostgREST

---

## 5. Arquitectura Frontend

### 5.1 Estructura de Carpetas

```
src/
├── components/              # Componentes reutilizables
│   ├── Layout.tsx          # Layout principal con sidebar
│   ├── Timeline.tsx        # Timeline de gates
│   ├── GateDetailDrawer.tsx # Drawer lateral para gates
│   └── AriaAgentBot.tsx    # Chatbot flotante
│
├── views/                   # Vistas principales (pages)
│   ├── Overview.tsx        # Dashboard PDLC
│   ├── OeaStrategy.tsx     # Vista de OEA/OKR
│   ├── Portfolio.tsx       # Gestión de portafolio
│   ├── Prioritization.tsx  # Priorización de iniciativas
│   ├── Intake.tsx          # Intake hub
│   ├── Generation.tsx      # Pipeline de generación
│   ├── Inventory.tsx       # Inventario de artefactos
│   ├── Library.tsx         # Librería canónica
│   ├── KpcCatalog.tsx      # Catálogo KPC
│   └── Governance.tsx      # Auditoría y gobierno
│
├── services/               # Servicios externos
│   └── geminiService.ts   # Integración con Gemini AI
│
├── types/                  # TypeScript definitions
│   └── types.ts           # Todas las interfaces
│
├── constants/              # Datos estáticos
│   └── constants.tsx      # Mock data y configuración
│
├── hooks/                  # Custom React hooks
├── utils/                  # Utilidades generales
├── config/                 # Configuraciones
│
├── App.tsx                # Componente raíz
└── index.tsx              # Entry point
```

### 5.2 Componentes Principales

#### 5.2.1 Layout Component

**Responsabilidades**:
- Sidebar de navegación
- Header con contexto global
- Gestión de tab activo
- ARIA Agent Bot global

**Props**:
```typescript
interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeContext: {
    product: string;
    kpcVersion: string;
  };
}
```

#### 5.2.2 Timeline Component

**Responsabilidades**:
- Visualización horizontal de gates
- Estados visuales (APPROVED, IN_PROGRESS, BLOCKED)
- Interacción para abrir detalles

#### 5.2.3 AriaAgentBot

**Responsabilidades**:
- Chat flotante persistente
- Integración con Gemini AI
- Context awareness del sistema
- Sugerencias quick-action

### 5.3 Routing Strategy

**Actual (MVP)**:
- ✅ **Tab-based Navigation**: State-driven sin URL routing
- ✅ **Gestión de estado centralizada** en App.tsx

**Próxima Fase**:
- 🔜 **React Router**: Navegación con URLs
- 🔜 **Deep Linking**: Compartir URLs específicas
- 🔜 **Breadcrumbs**: Navegación contextual

### 5.4 State Management

**Estrategia Actual**:
- **Local State**: `useState` para UI state
- **Prop Drilling**: Props pasados hasta 2 niveles
- **Context API**: Para tema y configuración global (futuro)

**No se usa**:
- Redux/MobX: Overhead innecesario para MVP
- Zustand/Jotai: Complejidad no justificada aún

**Justificación**: Para 50-200 iniciativas, React state nativo es suficiente.

### 5.5 Performance Optimizations

1. **Code Splitting**: Vite automático por route
2. **Lazy Loading**: `React.lazy()` para vistas pesadas (futuro)
3. **Memoization**: `useMemo` para cálculos costosos
4. **Virtual Scrolling**: Para listas grandes (>100 items)
5. **Debouncing**: En búsquedas y filtros

---

## 6. Servicios Backend/AI

### 6.1 Gemini AI Integration

**Archivo**: `src/services/geminiService.ts`

#### 6.1.1 Configuración

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.API_KEY 
});
```

**Variables de Entorno**:
- `GEMINI_API_KEY`: API key de Google AI Studio
- Configurado en `vite.config.ts` como `process.env.API_KEY`

#### 6.1.2 Funciones Principales

##### `generateArtifactContent()`

**Propósito**: Generar contenido de artefactos PDLC

**Signature**:
```typescript
async function generateArtifactContent(
  artifactName: string, 
  gateLabel: string
): Promise<string>
```

**Modelo**: `gemini-3-flash-preview`

**Prompt Template**:
```
Generate a brief professional outline for a product document 
titled "${artifactName}" within the "${gateLabel}" gate of a 
PDLC for a Fintech called Kashio. 
Keep it to 3 main sections with bullet points.
```

**Parámetros**:
- `temperature: 0.7` (balance creatividad/consistencia)

**Output**: String con contenido generado en Markdown

**Error Handling**: Try-catch con fallback message

##### `analyzeIntakeRequest()`

**Propósito**: Analizar y clasificar intake requests

**Signature**:
```typescript
async function analyzeIntakeRequest(
  request: Partial<IntakeRequest>
): Promise<string>
```

**Modelo**: `gemini-3-flash-preview`

**Prompt Template**:
```
Analyze this product intake request for Kashio Fintech:
Type: ${request.type}
Severity: ${request.severity}
Problem: ${request.problem}
Outcome: ${request.outcome}
Scope: ${request.scope?.join(', ') || 'Not defined'}
Constraints: ${request.constraints || 'None mentioned'}

Provide a concise 2-sentence ARIA Analysis recommendation.
Indicate the PDLC Route (Fast Track, Discovery, or Standard) 
and the primary gate to start (G0 to G5).
```

**Parámetros**:
- `temperature: 0.5` (más determinístico para clasificación)

**Output**: String con análisis y recomendación

##### `chatWithAria()`

**Propósito**: Chatbot conversacional experto en PDLC

**Signature**:
```typescript
async function chatWithAria(
  message: string, 
  history?: ChatMessage[]
): Promise<string>
```

**Modelo**: `gemini-3-flash-preview`

**System Instruction**:
```
You are ARIA, the Kashio PDLC AI Agent. 
You are an expert in the Product Development Life Cycle, 
agile governance, and Kashio's product offerings 
(Conexión Única, Kashio Cards, etc.). 
Help users with questions about Gates, SLAs, 
Artifact generation, and strategic alignment. 
Keep answers professional, concise, and helpful.
```

**Parámetros**:
- `temperature: 0.8` (más conversacional)

**Features**:
- Context-aware responses
- Multi-turn conversations
- Product-specific knowledge

#### 6.1.3 Rate Limiting y Quotas

**Google Gemini Free Tier**:
- 60 requests/minute
- 1,500 requests/day
- Input: 32,000 tokens/request
- Output: 8,192 tokens/request

**Estrategia**:
- Debouncing en inputs (500ms)
- Loading states para UX
- Error handling con retry logic (futuro)

#### 6.1.4 Seguridad

✅ **API Key Management**:
- Nunca en código fuente
- Variable de entorno `.env.local`
- No comiteada en Git (`.gitignore`)

✅ **CORS**:
- Configurado en Vite para dev
- Proxy en producción (futuro)

---

## 7. Integraciones

### 7.1 Integraciones Actuales

| Sistema | Tipo | Estado |
|---------|------|--------|
| **Gemini AI** | API REST | ✅ Activo |

### 7.2 Integraciones Planificadas (Q2-Q3 2026)

#### 7.2.1 Confluence

**Propósito**: Publicación automática de artefactos

**API**: Confluence REST API v2

**Flujo**:
1. Usuario genera artefacto con ARIA
2. Revisa y aprueba draft
3. Click en "Publish to Confluence"
4. Sistema crea/actualiza página en Confluence
5. Mantiene versionado

**Campos a mapear**:
- Page Title: `artifact.name`
- Space: Basado en `product/domain`
- Content: Markdown → Confluence Storage Format
- Labels: `gate`, `version`, `initiative`

#### 7.2.2 Jira

**Propósito**: Crear Epics, Features, Stories desde artefactos G4

**API**: Jira REST API v3

**Flujo**:
1. Artefacto "Epics & Features" aprobado en G4
2. Parsing de contenido generado
3. Creación automática en Jira
4. Linkback desde ARIA

**Campos a mapear**:
- Epic: Nivel 1 del outline
- Story: Nivel 2 con criterios de aceptación
- Labels: `ARIA-generated`, `pdlc-id`

#### 7.2.3 SharePoint

**Propósito**: Almacenar PDFs de artefactos comerciales (G3, G5)

**API**: Microsoft Graph API

**Autenticación**: OAuth 2.0 con Azure AD

#### 7.2.4 Read.me (Developer Portal)

**Propósito**: Publicar documentación técnica para clientes

**API**: ReadMe API

**Contenido**: Docs técnicos de G3/G5

### 7.3 Arquitectura de Integraciones (Futura)

```
┌────────────────────────────────────────────────────┐
│              ARIA Frontend                          │
└────────────────────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────┐
│         Integration Service Layer (API)            │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐              │
│  │  Confluence  │  │     Jira     │              │
│  │  Connector   │  │  Connector   │              │
│  └──────────────┘  └──────────────┘              │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐              │
│  │  SharePoint  │  │   Read.me    │              │
│  │  Connector   │  │  Connector   │              │
│  └──────────────┘  └──────────────┘              │
└────────────────────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────┐
│             Message Queue (Opcional)                │
│                    RabbitMQ / SQS                   │
└────────────────────────────────────────────────────┘
```

---

## 8. Seguridad

### 8.1 Autenticación y Autorización

**Actual (MVP)**:
- ❌ Sin autenticación (demo interna)
- ❌ Sin roles/permisos

**Próxima Fase (Q2 2026)**:
- 🔜 **OAuth 2.0** con Azure AD (SSO Kashio)
- 🔜 **JWT Tokens** para sesiones
- 🔜 **RBAC** (Role-Based Access Control):
  - `product_manager`: Full access
  - `tech_lead`: Read + write artifacts G4-G5
  - `pmo`: Read-only governance
  - `stakeholder`: Read-only OEA/Portfolio

### 8.2 Seguridad de API Keys

✅ **Implementado**:
- API keys en variables de entorno
- `.env.local` en `.gitignore`
- No hardcoding en código

⚠️ **Mejorar**:
- Rotación periódica de keys
- Secrets management con Vault/AWS Secrets Manager
- Rate limiting por usuario

### 8.3 Validación de Inputs

✅ **Implementado**:
- TypeScript type checking
- Basic HTML escaping en Tailwind

🔜 **Próxima Fase**:
- Sanitización con DOMPurify
- Schema validation con Zod/Yup
- CSRF protection

### 8.4 HTTPS y CORS

✅ **Implementado**:
- Vite dev server con HTTP (local)
- CORS abierto en dev

🔜 **Producción**:
- TLS 1.3 obligatorio
- CORS restrictivo por dominio
- CSP headers

---

## 9. Performance y Escalabilidad

### 9.1 Métricas de Performance

**Target**:
- First Contentful Paint (FCP): <1.5s
- Time to Interactive (TTI): <3s
- Largest Contentful Paint (LCP): <2.5s
- API Response Time: <500ms (CRUD), <10s (AI generation)

**Actual (Medido)**:
- FCP: ~800ms ✅
- TTI: ~1.2s ✅
- LCP: ~1.5s ✅
- Gemini AI latency: 3-8s ⚠️ (depende de modelo)

### 9.2 Optimizaciones Implementadas

1. **Vite Build Optimization**
   - Tree-shaking automático
   - Minificación con ESBuild
   - Code splitting por route

2. **React Optimizations**
   - `useMemo` para cálculos pesados
   - `useCallback` en handlers frecuentes
   - Keys estables en listas

3. **Asset Optimization**
   - SVG icons (lucide-react)
   - TailwindCSS JIT (solo clases usadas)
   - No images pesadas (futura: lazy loading)

### 9.3 Escalabilidad

**Volumen Esperado**:
- Usuarios concurrentes: 10-20 (interno Kashio)
- Iniciativas: 50-100 activas
- Artefactos: 500-1000 generados/año
- Requests AI: ~100-200/día

**Estrategia**:
- Frontend estático (CDN) → Escala infinitamente
- Gemini AI → Managed by Google (auto-scaling)
- Futuro backend → Serverless functions (auto-scaling)

**Bottlenecks Potenciales**:
- ⚠️ Gemini rate limits (60 req/min)
- ⚠️ Client-side rendering de listas grandes

**Soluciones**:
- Request queuing para AI
- Virtual scrolling en tablas
- Pagination en vistas de inventario

---

## 11. Deployment en GCP

### 11.1 Pipeline CI/CD con Cloud Build

**Flujo Automatizado**:
```
GitHub Push → Cloud Build Trigger → Build → Test → Deploy to Cloud Run
```

**Cloud Build Configuration** (`cloudbuild.yaml`):

```yaml
steps:
  # Step 1: Install dependencies
  - name: 'node:18'
    entrypoint: npm
    args: ['ci']
    
  # Step 2: Run tests
  - name: 'node:18'
    entrypoint: npm
    args: ['test']
    
  # Step 3: Build application
  - name: 'node:18'
    entrypoint: npm
    args: ['run', 'build']
    env:
      - 'NODE_ENV=production'
    
  # Step 4: Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/aria-frontend:$SHORT_SHA'
      - '-t'
      - 'gcr.io/$PROJECT_ID/aria-frontend:latest'
      - '.'
    
  # Step 5: Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '--all-tags', 'gcr.io/$PROJECT_ID/aria-frontend']
    
  # Step 6: Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'aria-frontend'
      - '--image=gcr.io/$PROJECT_ID/aria-frontend:$SHORT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--min-instances=1'
      - '--max-instances=10'
      - '--memory=2Gi'
      - '--cpu=2'
      - '--port=8080'
      - '--set-env-vars=VITE_API_URL=https://api.aria.kashio.com'
      - '--set-secrets=GEMINI_API_KEY=gemini-api-key:latest'

images:
  - 'gcr.io/$PROJECT_ID/aria-frontend:$SHORT_SHA'
  - 'gcr.io/$PROJECT_ID/aria-frontend:latest'

options:
  machineType: 'E2_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY

timeout: '1200s'
```

**Trigger Configuration**:
```bash
gcloud builds triggers create github \
  --name="aria-frontend-deploy" \
  --repo-name="ARIA" \
  --repo-owner="kashio" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml"
```

### 11.2 Configuración de Cloud Run

**Deployment Completo**:

```bash
# 1. Build and tag Docker image
docker build -t gcr.io/kashio-prod/aria-frontend:v1.0.0 .
docker push gcr.io/kashio-prod/aria-frontend:v1.0.0

# 2. Deploy to Cloud Run
gcloud run deploy aria-frontend \
  --image gcr.io/kashio-prod/aria-frontend:v1.0.0 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 2Gi \
  --cpu 2 \
  --port 8080 \
  --concurrency 80 \
  --timeout 300 \
  --set-env-vars="VITE_API_URL=https://api.aria.kashio.com,NODE_ENV=production" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest" \
  --service-account=aria-frontend@kashio-prod.iam.gserviceaccount.com \
  --vpc-connector=aria-vpc-connector \
  --ingress=all \
  --labels=app=aria,env=prod,team=product

# 3. Map custom domain
gcloud run services update-traffic aria-frontend --to-latest
gcloud run domain-mappings create \
  --service aria-frontend \
  --domain aria.kashio.com \
  --region us-central1
```

**Dockerfile Optimizado**:
```dockerfile
# ========================================
# Stage 1: Build
# ========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application
ENV NODE_ENV=production
RUN npm run build

# ========================================
# Stage 2: Production
# ========================================
FROM nginx:1.25-alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Expose port (Cloud Run uses PORT env var)
EXPOSE 8080

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf**:
```nginx
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_comp_level 6;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 11.3 Multi-Region Deployment

**Configuración Global**:

```bash
# Deploy a múltiples regiones
REGIONS=("us-central1" "us-east1" "europe-west1")

for REGION in "${REGIONS[@]}"; do
  gcloud run deploy aria-frontend \
    --image gcr.io/kashio-prod/aria-frontend:latest \
    --region $REGION \
    --platform managed
done

# Configure Global Load Balancer
gcloud compute backend-services create aria-backend \
  --global \
  --protocol=HTTPS \
  --port-name=http \
  --health-checks=aria-health-check \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC

# Add backends (Cloud Run services) per region
for REGION in "${REGIONS[@]}"; do
  gcloud compute backend-services add-backend aria-backend \
    --global \
    --network-endpoint-group=aria-neg-$REGION \
    --network-endpoint-group-region=$REGION \
    --balancing-mode=UTILIZATION \
    --max-utilization=0.8
done
```

**Ventajas Multi-Region**:
- ✅ Latencia reducida (<50ms globalmente)
- ✅ Alta disponibilidad (99.95% SLA)
- ✅ Disaster recovery automático
- ✅ Balanceo de carga inteligente

### 11.4 Configuración de Entornos - GCP

**Development (Local)**:
- URL: `http://localhost:3000`
- Database: SQLite local o Cloud SQL Dev instance
- AI: Vertex AI con quota limitada
- Hot reload habilitado
- Cloud Run Emulator para testing

**Staging (GCP)**:
- URL: `https://aria-staging.kashio.com`
- Cloud Run: `aria-frontend-staging` (us-central1)
- Cloud SQL: `aria-db-staging` (db-f1-micro)
- Vertex AI: Quota compartida
- Data: Seed data sintética
- CD: Auto-deploy desde rama `develop`

**Production (GCP)**:
- URL: `https://aria.kashio.com`
- Cloud Run: `aria-frontend` (multi-region)
- Cloud SQL: `aria-db-prod` (HA, db-custom-2-7680)
- Vertex AI: Production quota
- SSL/TLS: Certificado gestionado automáticamente
- CDN: Cloud CDN habilitado
- Monitoreo: 24/7 con alertas
- CD: Deploy manual desde rama `main` (aprobación requerida)

**Variables de Entorno por Ambiente**:

```bash
# Development
export VITE_API_URL=http://localhost:8080
export VITE_ENV=development
export GOOGLE_CLOUD_PROJECT=kashio-dev

# Staging
export VITE_API_URL=https://api-staging.aria.kashio.com
export VITE_ENV=staging
export GOOGLE_CLOUD_PROJECT=kashio-staging

# Production
export VITE_API_URL=https://api.aria.kashio.com
export VITE_ENV=production
export GOOGLE_CLOUD_PROJECT=kashio-prod
```

### 11.5 Rollback Strategy - Cloud Run

**Rollback Instantáneo**:

```bash
# Listar revisiones disponibles
gcloud run revisions list \
  --service=aria-frontend \
  --region=us-central1

# Rollback a revisión anterior (< 1 minuto)
gcloud run services update-traffic aria-frontend \
  --to-revisions=aria-frontend-00042-abc=100 \
  --region=us-central1
```

**Traffic Splitting (Blue/Green Deployment)**:

```bash
# Deploy nueva versión sin tráfico
gcloud run deploy aria-frontend \
  --image gcr.io/kashio-prod/aria-frontend:v2.0.0 \
  --no-traffic

# Gradual rollout: 10% nuevo, 90% anterior
gcloud run services update-traffic aria-frontend \
  --to-revisions=aria-frontend-00043-new=10,aria-frontend-00042-old=90

# Si funciona OK, escalar a 100%
gcloud run services update-traffic aria-frontend \
  --to-latest
```

**Características**:
- ✅ Keep last 20 revisions (configurable)
- ✅ Instant rollback (<30 segundos)
- ✅ Traffic splitting para A/B testing
- ✅ Rollback automático en caso de errores >5%

### 11.6 Disaster Recovery

**Recovery Time Objective (RTO)**: <1 hora  
**Recovery Point Objective (RPO)**: <15 minutos

**Estrategia**:

1. **Cloud SQL HA**: Failover automático cross-zone (~2 min)
2. **Cloud Storage**: Geo-redundant (sync automático)
3. **Cloud Run**: Multi-region con load balancer (failover <1 min)
4. **Backups**: Automáticos cada 6 horas, retención 30 días

**Plan de DR**:
```bash
# 1. Restore Cloud SQL desde backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=aria-db-prod \
  --backup-project=kashio-prod

# 2. Deploy frontend en región secundaria
gcloud run deploy aria-frontend \
  --image gcr.io/kashio-prod/aria-frontend:latest \
  --region us-east1

# 3. Redirect traffic
gcloud compute url-maps set-default-service aria-load-balancer \
  --default-service=aria-backend-dr
```

---

## 12. Monitoreo y Observabilidad - GCP

### 12.1 Cloud Logging

**Configuración de Logging Estructurado**:

```typescript
import { Logging } from '@google-cloud/logging';

const logging = new Logging({ projectId: 'kashio-prod' });
const log = logging.log('aria-application');

interface LogEntry {
  severity: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  userId?: string;
  action?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export function logEvent(entry: LogEntry) {
  const metadata = {
    resource: { type: 'cloud_run_revision' },
    severity: entry.severity,
    labels: {
      app: 'aria',
      environment: process.env.VITE_ENV
    }
  };
  
  const logEntry = log.entry(metadata, {
    timestamp: new Date().toISOString(),
    ...entry
  });
  
  log.write(logEntry);
}

// Uso:
logEvent({
  severity: 'INFO',
  message: 'Artifact generated successfully',
  userId: 'user@kashio.com',
  action: 'generate_artifact',
  duration: 4500,
  metadata: {
    artifactId: 'ART-001',
    gate: 'G2',
    model: 'gemini-1.5-flash'
  }
});
```

**Logs Automáticos**:
- ✅ Requests HTTP (Cloud Run logs)
- ✅ Errores de aplicación
- ✅ Llamadas a Vertex AI
- ✅ Queries a Cloud SQL
- ✅ Acceso a Cloud Storage

**Retención**:
- Logs de aplicación: 30 días (Standard)
- Logs de auditoría: 400 días (Admin Activity)
- Logs de error: 90 días

**Queries Útiles**:
```sql
-- Errores en últimas 24 horas
resource.type="cloud_run_revision"
severity >= ERROR
timestamp >= "2026-01-14T00:00:00Z"

-- Generaciones de IA lentas (>10s)
jsonPayload.action="generate_artifact"
jsonPayload.duration > 10000

-- Usuarios más activos
resource.type="cloud_run_revision"
jsonPayload.userId != ""
| stats count() by jsonPayload.userId
| sort -count
```

### 12.2 Cloud Monitoring

**Métricas Automáticas (Cloud Run)**:
- Request count
- Request latency (p50, p95, p99)
- Container CPU utilization
- Container memory utilization
- Instance count
- Billable instance time

**Métricas Custom**:

```typescript
import { MetricServiceClient } from '@google-cloud/monitoring';

const client = new MetricServiceClient();

async function recordMetric(name: string, value: number, labels: Record<string, string> = {}) {
  const projectId = await client.getProjectId();
  const projectPath = client.projectPath(projectId);
  
  const dataPoint = {
    interval: {
      endTime: { seconds: Date.now() / 1000 }
    },
    value: { doubleValue: value }
  };
  
  const timeSeries = {
    metric: {
      type: `custom.googleapis.com/aria/${name}`,
      labels
    },
    resource: {
      type: 'cloud_run_revision',
      labels: {
        service_name: 'aria-frontend',
        location: 'us-central1'
      }
    },
    points: [dataPoint]
  };
  
  await client.createTimeSeries({
    name: projectPath,
    timeSeries: [timeSeries]
  });
}

// Business Metrics
await recordMetric('artifacts_generated', 1, { gate: 'G2', model: 'gemini-flash' });
await recordMetric('ai_generation_time', 4.5, { type: 'artifact' });
await recordMetric('hitl_approval_rate', 0.95, { gate: 'G3' });

// Technical Metrics
await recordMetric('api_calls_vertex_ai', 1, { endpoint: '/generate' });
await recordMetric('db_query_duration', 0.125, { table: 'artifacts' });
```

**Dashboards Configurados**:

1. **Application Health Dashboard**:
   - Request rate y latency
   - Error rate por endpoint
   - Instance scaling
   - Memory/CPU usage

2. **Business Metrics Dashboard**:
   - Artefactos generados/día
   - Tiempo promedio generación IA
   - Tasa de aprobación HITL
   - Uso por módulo

3. **AI Operations Dashboard**:
   - Vertex AI request count
   - AI model latency
   - Costos por modelo
   - Rate limiting events

4. **Database Dashboard**:
   - Query performance (p95, p99)
   - Connection pool usage
   - Slow queries
   - Storage utilization

### 12.3 Alerting Policies

**Políticas de Alerta Configuradas**:

```yaml
# alerting-policies.yaml
---
# Critical Alert: High Error Rate
- displayName: "ARIA - High Error Rate"
  conditions:
    - displayName: "Error rate > 5%"
      conditionThreshold:
        filter: |
          resource.type = "cloud_run_revision"
          AND metric.type = "run.googleapis.com/request_count"
          AND metric.labels.response_code_class = "5xx"
        comparison: COMPARISON_GT
        thresholdValue: 0.05
        duration: 300s
        aggregations:
          - alignmentPeriod: 60s
            perSeriesAligner: ALIGN_RATE
  notificationChannels:
    - projects/kashio-prod/notificationChannels/slack-critical
    - projects/kashio-prod/notificationChannels/pagerduty
  severity: CRITICAL

# Critical Alert: API Latency
- displayName: "ARIA - High API Latency"
  conditions:
    - displayName: "P95 latency > 10s"
      conditionThreshold:
        filter: |
          resource.type = "cloud_run_revision"
          AND metric.type = "run.googleapis.com/request_latencies"
        comparison: COMPARISON_GT
        thresholdValue: 10000
        duration: 180s
        aggregations:
          - alignmentPeriod: 60s
            perSeriesAligner: ALIGN_PERCENTILE_95
  notificationChannels:
    - projects/kashio-prod/notificationChannels/slack-critical
  severity: CRITICAL

# Warning: Cloud SQL High Connections
- displayName: "ARIA - Cloud SQL High Connections"
  conditions:
    - displayName: "DB connections > 80%"
      conditionThreshold:
        filter: |
          resource.type = "cloudsql_database"
          AND metric.type = "cloudsql.googleapis.com/database/postgresql/num_backends"
        comparison: COMPARISON_GT
        thresholdValue: 16
        duration: 300s
  notificationChannels:
    - projects/kashio-prod/notificationChannels/slack-warnings
  severity: WARNING

# Warning: Vertex AI Rate Limiting
- displayName: "ARIA - Vertex AI Rate Limit Approaching"
  conditions:
    - displayName: "AI requests > 50 RPM"
      conditionThreshold:
        filter: |
          resource.type = "aiplatform.googleapis.com/Endpoint"
          AND metric.type = "aiplatform.googleapis.com/prediction/request_count"
        comparison: COMPARISON_GT
        thresholdValue: 50
        duration: 60s
        aggregations:
          - alignmentPeriod: 60s
            perSeriesAligner: ALIGN_RATE
  notificationChannels:
    - projects/kashio-prod/notificationChannels/slack-warnings
  severity: WARNING

# Info: Unusual Traffic Spike
- displayName: "ARIA - Traffic Spike Detected"
  conditions:
    - displayName: "Request count 3x above baseline"
      conditionThreshold:
        filter: |
          resource.type = "cloud_run_revision"
          AND metric.type = "run.googleapis.com/request_count"
        comparison: COMPARISON_GT
        thresholdValue: 300
        duration: 300s
        aggregations:
          - alignmentPeriod: 60s
            perSeriesAligner: ALIGN_RATE
  notificationChannels:
    - projects/kashio-prod/notificationChannels/slack-info
  severity: INFO
```

**Canales de Notificación**:

1. **Slack Integration**:
```bash
gcloud alpha monitoring channels create \
  --display-name="ARIA Critical Alerts" \
  --type=slack \
  --channel-labels=url=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX \
  --description="Slack channel for ARIA critical alerts"
```

2. **Email Notifications**:
```bash
gcloud alpha monitoring channels create \
  --display-name="Tech Leads Email" \
  --type=email \
  --channel-labels=email_address=aria-tech-leads@kashio.com
```

3. **PagerDuty** (solo críticos):
```bash
gcloud alpha monitoring channels create \
  --display-name="PagerDuty Oncall" \
  --type=pagerduty \
  --channel-labels=service_key=YOUR_PAGERDUTY_SERVICE_KEY
```

**Escalación**:
- **INFO**: Slack `#aria-info` (log only)
- **WARNING**: Slack `#aria-alerts` + Email tech leads
- **CRITICAL**: Slack `#aria-critical` + Email + PagerDuty (24/7)

---

## 13. Costos y Estimaciones GCP

### 13.1 Desglose de Costos Mensuales (Arquitectura Supabase)

#### Google Cloud Platform (GCP)

| Servicio | Configuración | Uso Estimado | Costo/Mes |
|----------|---------------|--------------|-----------|
| **Cloud Run (Frontend)** | 2GB RAM, 2 vCPU | 500k requests, 5k vCPU-hrs | $85 |
| **Cloud Run (Backend API)** | 4GB RAM, 2 vCPU | 300k requests, 3k vCPU-hrs | $65 |
| **Vertex AI - Gemini Flash** | $1.05/1M tokens output | 20M tokens/mes | $21 |
| **Vertex AI - Gemini Pro** | $21/1M tokens output | 2M tokens/mes | $42 |
| **Vertex AI - Context Caching** | 90% discount | Cache 50k tokens | $3 |
| **Cloud Load Balancing** | Premium Tier | 50GB ingress | $18 |
| **Cloud CDN** | Global | 200GB egress | $30 |
| **Secret Manager** | API calls | 5k operations | $2 |
| **Cloud Logging** | Standard | 50GB/mes | $25 |
| **Cloud Monitoring** | Standard metrics | - | $15 |
| **Cloud Build** | Standard | 200 build-min/mes | $10 |
| **Cloud Armor** | Standard rules | 1M requests | $30 |

**Subtotal GCP**: **$346/mes**

#### Supabase Platform

| Servicio | Configuración | Incluido en Plan | Costo/Mes |
|----------|---------------|------------------|-----------|
| **Supabase Pro Plan** | Base plan | PostgreSQL 15, Auth, Storage, APIs | **$25** |
| **Database** | 8GB RAM, 2 vCPU, 100GB storage | Incluido | $0 |
| **Database Bandwidth** | 200GB egress/mes | Incluido | $0 |
| **Auth** | OAuth, JWT, 100k MAUs | Incluido | $0 |
| **Storage** | 100GB files | Incluido | $0 |
| **Realtime** | 200 concurrent connections | Incluido | $0 |
| **Edge Functions** | 500k invocations | Incluido | $0 |

**Subtotal Supabase**: **$25/mes**

---

**Total General**: **$371 USD/mes** (ambiente producción)

**Comparación con arquitectura anterior**:
- Arquitectura Cloud SQL: $761/mes
- Arquitectura Supabase: $371/mes
- **Ahorro**: **$390/mes (51%)** 💰

**Ahorro Anual**: ~$4,680 USD/año

### 13.2 Costos por Ambiente

| Ambiente | Configuración | Costo/Mes |
|----------|---------------|-----------|
| **Development** | Local + Supabase Free Tier | **$0** |
| **Staging** | Cloud Run (min) + Supabase Pro | **$95** |
| **Production** | Full stack (cálculo anterior) | **$371** |

**Total Multi-Ambiente**: **~$466 USD/mes**

**Comparación**:
- Antes (Cloud SQL): $881/mes
- Ahora (Supabase): $466/mes
- **Ahorro**: **$415/mes (47%)** 💰

### 13.3 Optimizaciones de Costos

**Implementadas**:
1. ✅ **Context Caching** (Vertex AI): 90% reducción en tokens repetidos
2. ✅ **Cloud Run min=1**: Evitar cold starts sin costo excesivo
3. ✅ **Cloud SQL Scheduled Backups**: Solo fuera de horario peak
4. ✅ **Cloud Storage Lifecycle**: Archive después de 90 días

**Próximas**:
1. 🔜 **Committed Use Discounts**: 37% descuento en Cloud SQL (1 año)
2. 🔜 **Sustained Use Discounts**: Automático en Cloud Run
3. 🔜 **Cloud CDN Cache Longer**: Reducir egress 30%
4. 🔜 **Request Batching**: Agrupar llamadas a Vertex AI

**Potencial ahorro anual**: ~$180 USD (20%)

### 13.4 Proyección Anual (Arquitectura Supabase)

| Año | Usuarios | Iniciativas | Requests/mes | Costo/mes | Costo/año |
|-----|----------|-------------|--------------|-----------|-----------|
| 2026 (Q2-Q4) | 20 | 50 | 500k | **$371** | **$3,339** (9 meses) |
| 2027 | 50 | 100 | 1.2M | **$550** | **$6,600** |
| 2028 | 100 | 200 | 3M | **$950** | **$11,400** |

**Comparación de Costos**:

| Métrica | Cloud SQL | Supabase | Ahorro |
|---------|-----------|----------|--------|
| **Costo Año 1** | $6,849 | $3,339 | **$3,510 (51%)** |
| **Costo Año 2** | $13,800 | $6,600 | **$7,200 (52%)** |
| **Costo Año 3** | $26,400 | $11,400 | **$15,000 (57%)** |
| **Total 3 años** | $47,049 | $21,339 | **$25,710 (55%)** 💰 |

**ROI Mejorado**:
- Inversión Año 1: $110k (dev) + **$3.3k (infra)** = **$113.3k**
- Ahorro operativo anual: **$150k**
- Ahorro adicional en infra vs Cloud SQL: **$3.5k/año**
- **Break-even**: **8-9 meses** (1 mes más rápido)
- **ROI 3 años**: **310%** (vs 285% antes)

**Beneficios Adicionales de Supabase**:
- ✅ Menor complejidad operativa (fully managed)
- ✅ Auth + Storage incluidos (no extra services)
- ✅ APIs auto-generadas (menos código backend)
- ✅ Realtime incluido (no WebSocket infrastructure)

---

## 14. Consideraciones de Infraestructura GCP

### 14.1 Requisitos de Recursos

**Cloud Run (Frontend)**:
- Container size: ~150MB (Alpine + nginx)
- Build artifact: ~2MB (gzipped: ~500KB)
- Memory: 2GB por instancia
- CPU: 2 vCPU por instancia
- Min instances: 1 (evitar cold starts)
- Max instances: 10 (autoscaling)
- Bandwidth: <200GB/mes egress

**Cloud Run (Backend API - Futuro)**:
- Container size: ~250MB (Node.js Alpine)
- Memory: 4GB por instancia
- CPU: 2 vCPU
- Min instances: 0 (scale to zero OK)
- Max instances: 20
- Connection pool: Max 20 conexiones DB

**Cloud SQL**:
- Storage: 100GB SSD (auto-expand a 500GB)
- IOPS: 3,000 garantizados
- Connections: Max 100 (pool 20 por backend)
- Replication: Sync entre zonas (HA)

**Vertex AI Quotas**:
- Requests per minute: 60 (default)
- Tokens per minute: 1M input, 100k output
- Increase quota si > 100 usuarios concurrentes

### 14.2 Backup y Disaster Recovery - GCP

**Cloud SQL Automated Backups**:
```bash
gcloud sql instances patch aria-db-prod \
  --backup-start-time="03:00" \
  --enable-bin-log \
  --retained-backups-count=30 \
  --transaction-log-retention-days=7
```

**Configuración**:
- ✅ Backups automáticos diarios a las 3:00 AM UTC
- ✅ Retención: 30 backups (30 días)
- ✅ Transaction logs: 7 días (Point-in-Time Recovery)
- ✅ Geo-replication: us-central1 → us-east1

**Cloud Storage Backups**:
```bash
# Lifecycle policy para archival
gsutil lifecycle set lifecycle.json gs://kashio-aria-artifacts

# lifecycle.json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
        "condition": {"age": 90}
      },
      {
        "action": {"type": "SetStorageClass", "storageClass": "ARCHIVE"},
        "condition": {"age": 365}
      }
    ]
  }
}
```

**DR Strategy**:
- **RTO (Recovery Time Objective)**: <1 hora
- **RPO (Recovery Point Objective)**: <15 minutos
- **Failover automático**: Cloud SQL HA (cross-zone)
- **Manual failover**: Region switch (<30 min)

**DR Test** (trimestral):
```bash
# 1. Create test instance from backup
gcloud sql backups create --instance=aria-db-prod
gcloud sql instances clone aria-db-prod aria-db-dr-test

# 2. Deploy frontend en región DR
gcloud run deploy aria-frontend-dr \
  --image gcr.io/kashio-prod/aria-frontend:latest \
  --region us-east1

# 3. Validate functionality
curl https://aria-dr-test.kashio.com/health

# 4. Cleanup
gcloud sql instances delete aria-db-dr-test
gcloud run services delete aria-frontend-dr --region us-east1
```

### 14.3 Compliance y Regulaciones - GCP

**Certificaciones GCP**:
- ✅ ISO 27001, ISO 27017, ISO 27018
- ✅ SOC 2 Type II, SOC 3
- ✅ PCI DSS (no aplicable a ARIA pero disponible)
- ✅ GDPR compliant
- ✅ HIPAA compliant (infraestructura, no aplicable a ARIA)

**Data Residency**:
- **Cloud Run**: us-central1 (primary), us-east1 (DR)
- **Cloud SQL**: us-central1 con replicación a us-east1
- **Cloud Storage**: Multi-region US (geographically distributed)
- **Vertex AI**: us-central1 (data not leaves US)
- **GDPR Option**: Desplegar en europe-west1 si se requiere

**Data Classification**:

| Tipo de Dato | Clasificación | Encriptación | Retención |
|--------------|---------------|--------------|-----------|
| Emails corporativos | Internal | At-rest + in-transit | Indefinida |
| Artefactos PDLC | Confidential | At-rest + in-transit | 5 años |
| Logs de aplicación | Internal | At-rest | 90 días |
| Logs de auditoría | Confidential | At-rest + in-transit | 7 años |
| API Keys / Secrets | Highly Confidential | Secret Manager | Rotación 90 días |

**Controles de Seguridad**:
```bash
# VPC Service Controls
gcloud access-context-manager perimeters create aria-perimeter \
  --title="ARIA Security Perimeter" \
  --resources=projects/kashio-prod \
  --restricted-services=sqladmin.googleapis.com,storage.googleapis.com \
  --access-levels=aria-access-level

# Cloud Armor Security Policy
gcloud compute security-policies create aria-security-policy \
  --description="ARIA DDoS and WAF protection"

gcloud compute security-policies rules create 1000 \
  --security-policy=aria-security-policy \
  --expression="origin.region_code == 'CN' || origin.region_code == 'RU'" \
  --action=deny-403

gcloud compute security-policies rules create 2000 \
  --security-policy=aria-security-policy \
  --expression="evaluateRecaptcha()" \
  --action=deny-403

# DLP (Data Loss Prevention) Scanning
gcloud dlp inspection-templates create aria-pii-scanner \
  --location=us-central1 \
  --display-name="ARIA PII Scanner" \
  --info-types=EMAIL_ADDRESS,PHONE_NUMBER,CREDIT_CARD_NUMBER
```

**Audit Logging**:
- ✅ Admin Activity Logs: Always ON (400 días retención)
- ✅ Data Access Logs: Enabled para Cloud SQL, Storage
- ✅ System Event Logs: Automático
- ✅ Cloud Audit Logs export a BigQuery (análisis)

---

---

## 15. Modelo de Datos Completo

### 15.1 Diagrama Entidad-Relación Detallado

```
                         ┌───────────────────┐
                         │       OEA         │
                         │  (Objetivo        │
                         │   Estratégico)    │
                         ├───────────────────┤
                         │ id: string        │
                         │ name: string      │
                         │ owner: string     │
                         │ period: string    │
                         │ progress: number  │
                         │ health: enum      │
                         │ impact: number    │
                         └─────────┬─────────┘
                                   │
                                   │ 1
                                   │
                                   │ has many
                                   │
                                   ▼ *
                         ┌───────────────────┐
                         │       OKR         │
                         │  (Objective &     │
                         │   Key Results)    │
                         ├───────────────────┤
                         │ id: string        │
                         │ oeaId: string FK  │
                         │ name: string      │
                         │ owner: string     │
                         │ health: enum      │
                         │ keyResults: []    │
                         └─────────┬─────────┘
                                   │
                                   │ 1
                                   │
                                   │ tracks
                                   │
                                   ▼ *
                 ┌─────────────────────────────────┐
                 │    PortfolioInitiative          │
                 ├─────────────────────────────────┤
                 │ id: string                      │
                 │ kpcCode?: string                │
                 │ kpcVersion?: string             │
                 │ portfolio: string               │
                 │ name: string                    │
                 │ start: string (date)            │
                 │ end: string (date)              │
                 │ owner: string                   │
                 │ lead: string                    │
                 │ techLead: string                │
                 │ squads: string                  │
                 │ status: string                  │
                 │ brmLink?: string (URL)          │
                 │ domainL1: string                │
                 │ domainL2: string                │
                 │ domainL3: string                │
                 │ itServices: string              │
                 │ okrId?: string FK               │
                 └─────────────┬───────────────────┘
                               │
                               │ 1
                               │
                               │ generates
                               │
                               ▼ *
                 ┌─────────────────────────────────┐
                 │          Artifact               │
                 │     (Documento/Output)          │
                 ├─────────────────────────────────┤
                 │ id: string                      │
                 │ gate: string (G0-G5)            │
                 │ name: string                    │
                 │ category: string                │
                 │ version: string (semver)        │
                 │ status: ArtifactStatus          │
                 │ destination: string[]           │
                 │ link?: string (URL)             │
                 │ initiativeName?: string         │
                 │ artifactType: 'Input'|'Output'  │
                 │ content?: string                │
                 │ generatedBy?: 'ARIA'|'Manual'   │
                 │ createdAt?: Date                │
                 │ updatedAt?: Date                │
                 │ approvedBy?: string             │
                 └─────────────────────────────────┘


        ┌──────────────────┐
        │      Gate        │
        │  (Control Point) │
        ├──────────────────┤
        │ id: string       │
        │ name: string     │
        │ label: string    │
        │ status: enum     │
        │ owner: string    │
        │ sla: string      │
        │ blocks: number   │
        └──────────────────┘


        ┌──────────────────────────────┐
        │       IntakeRequest          │
        ├──────────────────────────────┤
        │ id: string                   │
        │ requester: string            │
        │ area: string                 │
        │ type: enum                   │
        │ product: string              │
        │ domain: string               │
        │ region: string               │
        │ impactType: string           │
        │ severity: 'P0'|'P1'|'P2'|'P3'│
        │ urgency: 'Now'|'Next'|'Later'│
        │ problem: string (text)       │
        │ outcome: string (text)       │
        │ scope?: string[]             │
        │ constraints?: string         │
        │ alternatives?: string        │
        │ kpi?: string                 │
        │ status: string               │
        │ createdAt: string (date)     │
        │ ariaAnalysis?: string (AI)   │
        └──────────────────────────────┘


        ┌─────────────────────────────────────┐
        │          KpcProduct                 │
        │      (Product Catalog)              │
        ├─────────────────────────────────────┤
        │ id: string                          │
        │ code: string (unique)               │
        │ name: string                        │
        │ status: enum                        │
        │ version: string (semver)            │
        │ pdlcInitiativeId: string FK         │
        │ pdlcGate: string                    │
        │ owner: string                       │
        │ domain: string                      │
        │ targetSegment: string               │
        │ region: string                      │
        │ modules: KpcModule[]                │
        │ configs: KpcConfig[]                │
        │ offering: KpcOffering               │
        └───────────┬─────────────────────────┘
                    │
                    │ 1
                    │
                    │ contains
                    │
                    ▼ *
        ┌─────────────────────────────────────┐
        │          KpcModule                  │
        ├─────────────────────────────────────┤
        │ code: string                        │
        │ name: string                        │
        │ mandatory: boolean                  │
        │ version: string                     │
        │ services: KpcService[]              │
        └───────────┬─────────────────────────┘
                    │
                    │ 1
                    │
                    │ provides
                    │
                    ▼ *
        ┌─────────────────────────────────────┐
        │          KpcService                 │
        ├─────────────────────────────────────┤
        │ code: string                        │
        │ name: string                        │
        │ type: 'Core'|'Shared'|'AI'|'Ext'   │
        │ source: string                      │
        └─────────────────────────────────────┘
```

### 15.2 Esquema Cloud SQL (PostgreSQL 15)

```sql
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
CREATE INDEX idx_okr_health ON okr(health);

-- KeyResult (embedded en OKR)
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
  scope TEXT[], -- PostgreSQL array
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
  offering_name VARCHAR(255),
  offering_pricing VARCHAR(255),
  offering_sla VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kpc_code ON kpc_product(code);
CREATE INDEX idx_kpc_status ON kpc_product(status);
CREATE INDEX idx_kpc_initiative ON kpc_product(pdlc_initiative_id);

-- KpcModule
CREATE TABLE kpc_module (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(20) REFERENCES kpc_product(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  mandatory BOOLEAN DEFAULT false,
  version VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_module_product ON kpc_module(product_id);

-- KpcService
CREATE TABLE kpc_service (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES kpc_module(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('Core', 'Shared', 'AI', 'External')),
  source VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_service_module ON kpc_service(module_id);

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

CREATE TRIGGER update_portfolio_initiative_updated_at BEFORE UPDATE ON portfolio_initiative
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artifact_updated_at BEFORE UPDATE ON artifact
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intake_request_updated_at BEFORE UPDATE ON intake_request
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpc_product_updated_at BEFORE UPDATE ON kpc_product
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 15.3 Interfaces TypeScript Completas

Ver archivo: `src/types/types.ts`

```typescript
// ========================================
// ENUMS
// ========================================

export enum GateStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  BLOCKED = 'BLOCKED'
}

export enum ArtifactStatus {
  NOT_STARTED = 'NOT_STARTED',
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  OBSOLETE = 'OBSOLETE',
  PENDING_HITL = 'PENDING_HITL',
  GENERATING = 'GENERATING'
}

export type Health = 'Healthy' | 'At Risk' | 'Critical';

export type ArtifactType = 'Input' | 'Output';

export type Severity = 'P0' | 'P1' | 'P2' | 'P3';

export type Urgency = 'Now' | 'Next' | 'Later';

// ========================================
// INTERFACES CORE
// ========================================

export interface Oea {
  id: string;
  name: string;
  owner: string;
  period: string;
  progress: number;
  health: Health;
  impact: number;
}

export interface KeyResult {
  id: string;
  description: string;
  target: number;
  current: number;
  unit: string;
}

export interface Okr {
  id: string;
  oeaId: string;
  name: string;
  owner: string;
  health: Health;
  keyResults: KeyResult[];
}

export interface PortfolioInitiative {
  id: string;
  kpcCode?: string;
  kpcVersion?: string;
  portfolio: string;
  name: string;
  start: string;
  end: string;
  owner: string;
  lead: string;
  techLead: string;
  squads: string;
  status: string;
  brmLink?: string;
  domainL1: string;
  domainL2: string;
  domainL3: string;
  itServices: string;
  okrId?: string;
}

export interface Artifact {
  id: string;
  gate: string;
  name: string;
  category: string;
  version: string;
  status: ArtifactStatus;
  destination: string[];
  link?: string;
  initiativeName?: string;
  artifactType: ArtifactType;
  content?: string;
  generatedBy?: 'ARIA' | 'Manual';
  createdAt?: Date;
  updatedAt?: Date;
  approvedBy?: string;
}

export interface Gate {
  id: string;
  name: string;
  label: string;
  status: GateStatus;
  owner: string;
  sla: string;
  blocks: number;
}

export interface IntakeRequest {
  id: string;
  requester: string;
  area: string;
  type: 'Bug' | 'Mejora' | 'Estratégica' | 'Regulatorio' | 'Deuda Técnica';
  product: string;
  domain: string;
  region: string;
  impactType: string;
  severity: Severity;
  urgency: Urgency;
  problem: string;
  outcome: string;
  scope?: string[];
  constraints?: string;
  alternatives?: string;
  kpi?: string;
  status: string;
  createdAt: string;
  ariaAnalysis?: string;
}

export interface KpcProduct {
  id: string;
  code: string;
  name: string;
  status: 'Active' | 'Archived' | 'Deprecated' | 'Draft';
  version: string;
  pdlcInitiativeId: string;
  pdlcGate: string;
  owner: string;
  domain: string;
  targetSegment: string;
  region: string;
  modules: KpcModule[];
  configs: KpcConfig[];
  offering: KpcOffering;
}

export interface KpcModule {
  code: string;
  name: string;
  mandatory: boolean;
  version: string;
  services: KpcService[];
}

export interface KpcService {
  code: string;
  name: string;
  type: 'Core' | 'Shared' | 'AI' | 'External';
  source: string;
}

export interface KpcConfig {
  key: string;
  description: string;
  defaultValue: string;
  editable: boolean;
}

export interface KpcOffering {
  name: string;
  modules: string[];
  pricing: string;
  sla: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

### 15.4 Reglas de Negocio

**RN-001: Progresión de Gates**
- No se puede avanzar a Gate N+1 sin aprobar Gate N
- Validación: `current.status === GateStatus.APPROVED`

**RN-002: Artefactos Obligatorios**
- Todos los artefactos "mandatory" deben estar ACTIVE para aprobar gate
- Query: `SELECT COUNT(*) FROM artifact WHERE gate = $1 AND status != 'ACTIVE' AND mandatory = true`

**RN-003: Versionado Semántico**
- Formato: `vMAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features (compatible)
- PATCH: Bug fixes

**RN-004: Linking OKR ↔ Initiative**
- Una iniciativa puede vincularse a 0 o 1 OKR (no múltiples)
- Constraint: `UNIQUE(initiative_id, okr_id)`

**RN-005: Health Calculation**
```sql
-- Health de OEA calculado desde OKRs
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
```

---

## 16. Apéndices

### 16.1 Glosario de Términos

- **ARIA**: Automated Requirements & Intelligent Artifacts
- **PDLC**: Product Development Life Cycle
- **OEA**: Objetivos Estratégicos Anuales
- **OKR**: Objectives & Key Results
- **KPC**: Kashio Product Catalog
- **HITL**: Human-in-the-Loop
- **Gate**: Punto de control en el PDLC (G0-G5)
- **GCP**: Google Cloud Platform
- **Cloud Run**: Serverless container platform (GCP)
- **Vertex AI**: Managed AI platform (GCP)
- **Cloud SQL**: Managed PostgreSQL/MySQL (GCP)

### 16.2 Referencias Técnicas

**Frontend & Build**:
- [React 19 Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

**Google Cloud Platform**:
- [GCP Documentation](https://cloud.google.com/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Gemini API Reference](https://ai.google.dev/gemini-api/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Cloud Storage](https://cloud.google.com/storage/docs)
- [Cloud Monitoring](https://cloud.google.com/monitoring/docs)
- [Cloud Logging](https://cloud.google.com/logging/docs)
- [Identity Platform](https://cloud.google.com/identity-platform/docs)

**Best Practices**:
- [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework)
- [PostgreSQL Best Practices](https://cloud.google.com/sql/docs/postgres/best-practices)
- [Cloud Run Best Practices](https://cloud.google.com/run/docs/best-practices)
- [Vertex AI Best Practices](https://cloud.google.com/vertex-ai/docs/start/best-practices)

### 16.3 Contactos del Proyecto

| Rol | Nombre/Equipo | Email | Responsabilidad |
|-----|---------------|-------|-----------------|
| **Product Owner** | Rosa María Orellana | rosa.orellana@kashio.com | Visión de producto y roadmap |
| **Tech Lead** | Arley / Dennys | tech-leads@kashio.com | Desarrollo y arquitectura técnica |
| **Arquitecto Cloud** | [Equipo GCP] | cloud-arch@kashio.com | Diseño infraestructura GCP |
| **DevOps Engineer** | [Nombre] | devops@kashio.com | CI/CD, deployment, monitoreo |
| **Security Lead** | [Nombre] | security@kashio.com | IAM, compliance, auditoría |
| **DBA** | [Nombre] | dba@kashio.com | Cloud SQL, backups, performance |

**Canales de Comunicación**:
- Slack: `#aria-dev` (desarrollo), `#aria-alerts` (alertas), `#aria-critical` (incidentes)
- Email: `aria-team@kashio.com`
- PagerDuty: ARIA Oncall Rotation

---

## 17. Historial de Cambios

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0.0 | 2026-01-15 | Arquitectura | Versión inicial (Vercel/Netlify) |
| 2.0.0 | 2026-01-15 | Arquitectura | **Migración completa a GCP**: Cloud Run, Cloud SQL, Vertex AI, Cloud Storage, consolidación modelo de datos |
| 3.0.0 | 2026-01-15 | Arquitectura | **Migración a Supabase**: Reemplazo de Cloud SQL + Identity Platform + Cloud Storage por Supabase PostgreSQL + Auth + Storage. **Ahorro: 51% ($390/mes)**. Features adicionales: RLS, Realtime, APIs auto-generadas, Edge Functions |

---

## 18. Checklist de Implementación (Arquitectura Supabase)

### Fase 1: Setup Inicial GCP + Supabase (1 semana)
- [ ] Crear proyecto GCP (`kashio-prod`, `kashio-staging`, `kashio-dev`)
- [ ] Configurar billing y presupuestos GCP
- [ ] Enable APIs necesarias (Cloud Run, Vertex AI, Cloud Build)
- [ ] Configurar IAM y Service Accounts
- [ ] Configurar Secret Manager con Gemini API keys
- [ ] **Crear proyecto Supabase** (Pro plan)
- [ ] Configurar organization en Supabase
- [ ] Obtener Supabase API keys (anon + service_role)

### Fase 2: Supabase Database Setup (1 semana)
- [ ] **Crear esquema PostgreSQL en Supabase**
  - [ ] Ejecutar migrations para todas las tablas
  - [ ] Crear índices para performance
  - [ ] Configurar triggers y functions
  - [ ] Setup full-text search
- [ ] **Configurar Row Level Security (RLS)**
  - [ ] Policies para cada tabla
  - [ ] Roles y permisos por usuario
- [ ] **Migrar datos mock a Supabase**
  - [ ] Seed data de OEAs, OKRs, iniciativas
  - [ ] Master artifact list
  - [ ] KPC catalog data
- [ ] **Configurar backups automáticos**
  - [ ] PITR enabled (7 días)
  - [ ] Daily backups (retención 30 días)
- [ ] **Setup Supabase Storage buckets**
  - [ ] aria-artifacts (private)
  - [ ] aria-assets (public)
  - [ ] aria-backups (private)
  - [ ] Configurar storage policies

### Fase 2B: Supabase Auth Setup (3-4 días)
- [ ] **Configurar OAuth providers**
  - [ ] Azure AD integration
  - [ ] Google (opcional)
  - [ ] GitHub (opcional)
- [ ] **Configurar custom email templates**
- [ ] **Setup JWT secrets**
- [ ] **Configurar redirect URLs**
- [ ] **Test auth flow completo**

### Fase 3: Cloud Run Deployment (1 semana)
- [ ] Crear Dockerfile optimizado
- [ ] Setup Container Registry
- [ ] Configurar Cloud Build triggers
- [ ] Deploy frontend a Cloud Run
- [ ] Configurar custom domain (aria.kashio.com)
- [ ] Enable Cloud CDN
- [ ] Setup SSL certificate

### Fase 4: Vertex AI Integration (1 semana)
- [ ] Migrar de Gemini API a Vertex AI
- [ ] Implementar context caching
- [ ] Configurar quotas y rate limiting
- [ ] Optimizar prompts para costos
- [ ] Testing de generación de artefactos

### Fase 5: Monitoring & Security (1 semana)
- [ ] Configurar Cloud Logging
- [ ] Setup Cloud Monitoring dashboards
- [ ] Crear alerting policies
- [ ] Integrar Slack notifications
- [ ] Configure Cloud Armor (DDoS protection)
- [ ] Setup VPC Service Controls
- [ ] Enable audit logging

### Fase 6: Testing & Go-Live (1 semana)
- [ ] Load testing (Cloud Run autoscaling)
- [ ] DR drill (disaster recovery test)
- [ ] Performance benchmarks
- [ ] Security scan (Cloud Security Command Center)
- [ ] User acceptance testing (UAT)
- [ ] Documentación de runbooks
- [ ] **Go Live Production** 🚀

**Timeline Total**: 6-7 semanas

---

**Documento generado para**: Área de Arquitectura Kashio  
**Próxima revisión**: Q2 2026 (después de deployment GCP + Supabase)  
**Estado**: ✅ Especificación Completa Aprobada - Deployment en GCP + Supabase

**Plataforma Cloud**: Google Cloud Platform (GCP) + Supabase  
**Deployment Target**: Cloud Run + Supabase PostgreSQL + Vertex AI  
**Versión Documento**: 3.0.0 (Migración a Supabase)

---

## 19. Supabase vs Cloud SQL: Análisis de Decisión

### ¿Por qué Supabase?

#### Ventajas Técnicas

| Feature | Cloud SQL | Supabase | Ganador |
|---------|-----------|----------|---------|
| **PostgreSQL** | ✅ v15 | ✅ v15 | Empate |
| **Auto-scaling** | Manual | ✅ Automático | Supabase |
| **Connection Pooling** | Requiere configuración | ✅ Built-in (PgBouncer) | Supabase |
| **Backups** | ✅ Diarios + PITR | ✅ Diarios + PITR | Empate |
| **HA/Replication** | ✅ Multi-zone | ✅ Multi-zone + Read replicas | Empate |
| **Auth integrada** | ❌ (Identity Platform separado) | ✅ Built-in | **Supabase** |
| **Storage integrada** | ❌ (Cloud Storage separado) | ✅ Built-in | **Supabase** |
| **APIs auto-generadas** | ❌ | ✅ REST + GraphQL | **Supabase** |
| **Realtime** | ❌ | ✅ WebSockets nativos | **Supabase** |
| **Row Level Security** | ✅ | ✅ + UI para policies | **Supabase** |
| **Dashboard** | ✅ Cloud Console | ✅ Supabase Studio (mejor UX) | **Supabase** |
| **Migraciones** | Manual SQL | ✅ CLI + version control | **Supabase** |
| **Edge Functions** | ❌ (Cloud Functions separado) | ✅ Built-in (Deno) | **Supabase** |

#### Ventajas Operativas

1. **✅ Menor Complejidad**
   - 1 plataforma vs 3 servicios GCP (Cloud SQL + Identity + Storage)
   - Single dashboard para DB + Auth + Storage
   - Menos configuración y mantenimiento

2. **✅ Developer Experience Superior**
   - APIs auto-generadas (no escribir endpoints CRUD)
   - TypeScript types generados automáticamente
   - Realtime sin configuración adicional
   - CLI potente para migrations

3. **✅ Tiempo de Desarrollo Reducido**
   - No necesita implementar backend API para CRUD
   - Auth OAuth ya configurado
   - Storage con signed URLs built-in
   - Menos código = menos bugs

4. **✅ Open Source**
   - Basado en PostgreSQL + PostgREST
   - Sin vendor lock-in
   - Puede self-hosted si es necesario

#### Ventajas Económicas

| Métrica | Cloud SQL | Supabase | Ahorro |
|---------|-----------|----------|--------|
| **Costo Base** | $180/mes | $25/mes | **$155/mes** |
| **+ Identity Platform** | $15/mes | Incluido | **$15/mes** |
| **+ Cloud Storage** | $25/mes | Incluido | **$25/mes** |
| **Total** | **$220/mes** | **$25/mes** | **$195/mes (89%)** 💰 |
| **Anual** | $2,640 | $300 | **$2,340/año** |
| **3 años** | $7,920 | $900 | **$7,020** |

#### Consideraciones (Trade-offs)

| Aspecto | Consideración |
|---------|---------------|
| **Vendor Lock-in** | Menor que Cloud SQL (Supabase es open-source, puede migrarse) |
| **SLA** | Supabase Pro: 99.9% (igual que Cloud SQL Standard) |
| **Soporte** | Supabase: Email + Discord. Cloud SQL: Enterprise support (mejor para grandes empresas) |
| **Escalabilidad** | Supabase Pro: hasta 8GB RAM. Cloud SQL: ilimitado (pero muy caro) |
| **Compliance** | Ambos: SOC 2, GDPR compliant |
| **Multi-cloud** | Cloud SQL solo en GCP. Supabase puede integrarse con cualquier cloud |

### Recomendación Final

**✅ Supabase es la mejor opción para ARIA porque**:
1. **Ahorro masivo**: 89% menos costo ($195/mes ahorrados)
2. **Velocidad de desarrollo**: 30-40% más rápido (APIs auto-generadas)
3. **Menor complejidad**: 1 plataforma vs 3 servicios
4. **Features modernos**: Realtime, RLS, Edge Functions incluidos
5. **Developer-friendly**: Excelente DX con CLI y dashboard
6. **Open-source**: Sin lock-in, puede self-hosted

**Para escenarios donde Cloud SQL sería mejor**:
- Empresas con presupuesto >$10k/mes
- Necesidad de soporte enterprise 24/7
- Bases de datos >500GB
- Requerimientos de compliance muy específicos
- Ya tiene infraestructura compleja en GCP

**Conclusión**: Para un proyecto como ARIA (50-100 usuarios, startup/scale-up), Supabase es **claramente superior** en relación costo-beneficio y velocidad de desarrollo.

