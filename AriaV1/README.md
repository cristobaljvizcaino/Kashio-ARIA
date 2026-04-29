# ARIA - AI-Powered Product Development Life Cycle Control Center

<div align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/react-19.2.3-61dafb" alt="React">
  <img src="https://img.shields.io/badge/typescript-5.8.2-3178c6" alt="TypeScript">
  <img src="https://img.shields.io/badge/vite-6.2.0-646cff" alt="Vite">
  <img src="https://img.shields.io/badge/AI-Gemini-4285f4" alt="Gemini AI">
</div>

## 📋 Descripción

**ARIA** (Automated Requirements & Intelligent Artifacts) es un sistema de gestión y gobernanza del Product Development Life Cycle (PDLC) enterprise-grade que integra generación automática de artefactos mediante IA, flujos de trabajo Human-in-the-Loop (HITL) y publicación multi-plataforma.

### 🆕 Nueva Funcionalidad: Persistencia PostgreSQL

**Versión 2.1.0** incluye:
- ✅ **10 Cloud Functions nuevas** para CRUD de datos
- ✅ **Persistencia real en PostgreSQL** (Cloud SQL o Supabase)
- ✅ **Flujo completo:** Intake → DB → Initiative → Artifacts
- ✅ **Fallback automático** a localStorage
- ✅ **Scripts automatizados** de deployment

Ver [RESUMEN_POSTGRESQL.md](RESUMEN_POSTGRESQL.md) para detalles completos.

### Características Principales

- 🤖 **Generación Automática de Artefactos** con Gemini AI
- 🎯 **Gestión de OEA/OKR** alineados con iniciativas estratégicas
- 📊 **Portfolio Management** con priorización inteligente
- 🚪 **Sistema de Gates** (G0-G5) con control de gobernanza
- 📝 **Intake Hub** con análisis automático de requerimientos
- 📦 **KPC Catalog** - Single Source of Truth de productos
- 🔄 **Workflow HITL** para validación humana
- 📈 **Dashboard de Métricas** y analytics en tiempo real
- 🌐 **Multi-destino Publishing** (Confluence, Jira, SharePoint, etc.)

---

## 🏗️ Estructura del Proyecto

```
ARIA/
├── src/                      # Código fuente de la aplicación
│   ├── components/          # Componentes React reutilizables
│   │   ├── Layout.tsx
│   │   ├── Timeline.tsx
│   │   ├── GateDetailDrawer.tsx
│   │   └── AriaAgentBot.tsx
│   ├── views/               # Vistas principales de la aplicación
│   │   ├── Overview.tsx
│   │   ├── OeaStrategy.tsx
│   │   ├── Portfolio.tsx
│   │   ├── Prioritization.tsx
│   │   ├── Intake.tsx
│   │   ├── Generation.tsx
│   │   ├── Inventory.tsx
│   │   ├── Library.tsx
│   │   ├── KpcCatalog.tsx
│   │   └── Governance.tsx
│   ├── services/            # Servicios y API calls
│   │   └── geminiService.ts
│   ├── types/               # Definiciones de TypeScript
│   │   └── types.ts
│   ├── constants/           # Constantes y datos mock
│   │   └── constants.tsx
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utilidades y helpers
│   ├── config/              # Configuraciones
│   ├── App.tsx             # Componente raíz
│   └── index.tsx           # Entry point
├── public/                  # Archivos públicos estáticos
│   └── index.html
├── docs/                    # Documentación
│   ├── technical/          # Documentación técnica
│   ├── architecture/       # Diagramas y arquitectura
│   └── business/           # Documentación de negocio
├── assets/                  # Assets de referencia
│   ├── excel/              # Archivos Excel de negocio
│   ├── csv/                # Datos CSV
│   ├── pdf/                # Documentos PDF
│   └── word/               # Documentos Word
├── scripts/                 # Scripts de automatización
├── .github/                 # GitHub workflows y configuración
│   └── workflows/
├── package.json            # Dependencias y scripts NPM
├── tsconfig.json           # Configuración TypeScript
├── vite.config.ts          # Configuración Vite
├── .env.local              # Variables de entorno (no commitear)
├── .env.example            # Ejemplo de variables de entorno
├── .gitignore              # Archivos ignorados por Git
└── README.md               # Este archivo

```

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Gemini API Key** (obtener en [Google AI Studio](https://ai.google.dev/))

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd ARIA
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Editar `.env.local` y agregar tu Gemini API Key:
```env
GEMINI_API_KEY=tu_api_key_aqui
```

4. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

---

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo

# Producción
npm run build            # Construye para producción
npm run preview          # Preview del build de producción

# Utilidades
npm run lint             # Ejecuta linter
npm run format           # Formatea código con Prettier
npm run type-check       # Verifica tipos TypeScript
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19.2.3** - Framework UI
- **TypeScript 5.8.2** - Tipado estático
- **Vite 6.2.0** - Build tool y dev server
- **TailwindCSS** - Estilos utility-first
- **Lucide React** - Iconografía
- **Recharts 3.6.0** - Visualización de datos

### Backend/AI - Google Cloud Platform
- **Cloud Run** - Hosting serverless frontend (1-10 instancias auto-scaling)
- **Cloud Functions** - Backend API serverless (13 funciones)
  - **IA (3 funciones):** generateArtifact, analyzeIntake, ariaChat
  - **Database (10 funciones):** CRUD completo para Intake/Initiatives/Artifacts
- **Cloud SQL PostgreSQL 15** - Base de datos relational managed ($10/mes)
  - Instancia: db-f1-micro
  - Storage: 10GB SSD
  - Backups automáticos
  - Conexión Unix socket interna
- **Gemini 2.5 Flash** - IA generativa (Jun 2025)
- **Secret Manager** - Gestión segura de API keys y DB passwords
- **Cloud Storage** - Almacenamiento de artefactos
- **Identity Platform** - Autenticación Microsoft 365

**Costo total estimado: $30/mes** (Cloud Run $15 + Functions $5 + Cloud SQL $10)

### Arquitectura
- **Component-Based Architecture** - React
- **Type-Safe** - TypeScript en todo el stack
- **Modular Design** - Separación por features
- **Service Layer** - Para lógica de negocio
- **Cloud-Native** - GCP Serverless Architecture

---

## 📊 Modelo de Datos

El sistema maneja las siguientes entidades principales:

### Entidades Core

1. **OEA (Objetivos Estratégicos Anuales)**
   - Objetivos de alto nivel de la organización
   - Vinculados a OKRs e iniciativas

2. **OKR (Objectives & Key Results)**
   - Resultados clave medibles
   - Linkean con iniciativas del portafolio

3. **Portfolio Initiative**
   - Iniciativas/proyectos del portafolio 2026
   - Status, timelines, squads, owners

4. **Gate**
   - Puntos de control en el PDLC (G0-G5)
   - Estados: NOT_STARTED, IN_PROGRESS, APPROVED, BLOCKED

5. **Artifact**
   - Documentos generados en cada gate
   - Estados: NOT_STARTED, DRAFT, ACTIVE, OBSOLETE, PENDING_HITL, GENERATING
   - Tipos: Input, Output

6. **KPC Product**
   - Catálogo de productos Kashio
   - Módulos, servicios, configuraciones, offerings

7. **Intake Request**
   - Solicitudes de nuevo desarrollo
   - Clasificación automática con ARIA

Ver [docs/technical/DATA_MODEL.md](docs/technical/DATA_MODEL.md) para más detalles.

---

## 🎯 Funcionalidades por Módulo

### 1. **OEA Strategy Hub**
- Visualización de OEAs con progreso
- Drilling down a OKRs
- Vinculación con iniciativas PDLC

### 2. **Portfolio Management**
- Vista completa de iniciativas 2026
- Filtros por portafolio, squad, quarter
- Enlaces a documentación BRM

### 3. **Prioritization**
- Vista Swimlane por quarters
- Scoring automático con ARIA
- Criterios: Business Value, Strategic Fit, Urgency, Effort

### 4. **PDLC Overview**
- Timeline de gates
- KPIs del pipeline
- Selector de iniciativas
- Chat con ARIA Governance AI

### 5. **Intake Hub**
- Formulario multi-sección
- Análisis automático con Gemini
- Clasificación de urgencia/severidad
- Ruta estratégica recomendada

- **✨ Persistencia en base de datos**
- **✨ Conversión automática a Initiatives**

### 6. **ARIA Generation**
- Pipeline de generación de artefactos
- Navegación por gates
- Preview y edición manual
- Publicación automática

### 7. **Inventory**
- Repositorio de artefactos generados
- Filtros avanzados
- Trazabilidad por iniciativa
- Links a destinos publicados

### 8. **Library (Source Repository)**
- Master artifact list canónico
- Matriz por gate
- Reglas de gobernanza
- Control de versiones

### 9. **KPC Catalog**
- Catálogo de productos Kashio
- Vista detallada: Identity, Architecture, Offering, Governance
- Vinculación PDLC-KPC
- Historial de versiones

### 10. **Governance & Audit**
- Métricas SLA por gate
- Bloqueos y alertas
- Precisión ARIA
- Gráficos de salud

---

## 🔄 Flujo Intake → Generation

ARIA implementa un flujo completo desde la solicitud inicial hasta la generación de artefactos:

### 1. **Intake Hub → Base de Datos**
```
Usuario completa formulario
    ↓
ARIA analiza con Gemini AI
    ↓
Se guarda en PostgreSQL/localStorage
    ↓
Disponible para conversión
```

### 2. **Conversión a Initiative**
```
Generation: Click "Desde Intake"
    ↓
Selección de intake request
    ↓
Confirmación y conversión
    ↓
Initiative creada con artifacts iniciales
```

### 3. **Generación de Artefactos**
```
Seleccionar artifact por gate
    ↓
ARIA genera contenido
    ↓
Se crea PDF automático
    ↓
Guardado y publicación
```

**Servicios implementados:**
- `databaseService.ts`: CRUD completo + conversión
- Fallback a localStorage cuando backend no disponible
- Logging detallado en consola

Ver [docs/INTAKE_PERSISTENCE_IMPLEMENTATION.md](docs/INTAKE_PERSISTENCE_IMPLEMENTATION.md) para detalles completos.

---

## 🤖 Integración con Gemini AI

ARIA utiliza Google Gemini AI para:

1. **Generación de Artefactos**
   - Generación automática de documentos PDLC
   - Contexto: Gate, producto, iniciativa
   - Output: Borradores estructurados

2. **Análisis de Intake**
   - Clasificación automática de requerimientos
   - Recomendación de ruta (Fast Track, Discovery, Standard)
   - Gate de inicio sugerido

3. **ARIA Chatbot**
   - Asistente conversacional
   - Experto en PDLC y productos Kashio
   - Respuestas contextuales

### Configuración AI

```typescript
// src/services/geminiService.ts (Frontend directo)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// functions/api/index.js (Cloud Functions backend)
const genAI = new GoogleGenerativeAI(apiKey);

// Estrategia de Fallback Automática (3 modelos verificados ✅)
const GEMINI_MODELS = [
  "gemini-2.5-flash",   // Primario - Estable (Jun 2025), 1M tokens
  "gemini-2.5-pro",     // Fallback #1 - Más potente
  "gemini-2.0-flash"    // Fallback #2 - Versión anterior estable
];

// Si un modelo falla, automáticamente intenta con el siguiente
// Solo falla si los 3 modelos están caídos
```

**Mejoras 2026:**
- ✅ Fallback automático entre 3 modelos diferentes
- ✅ Modelos verificados y funcionales (12 Feb 2026)
- ✅ Manejo robusto de errores 404/503
- ✅ Logs detallados de cuál modelo respondió
- ✅ Sin interrupciones de servicio por modelos deprecados
- ✅ Soporta hasta 1M tokens de input

### Verificar Estado de Modelos
```bash
# Listar todos los modelos disponibles en tu API key
node list-available-models.js

# Probar la estrategia de fallback
node test-gemini-fallback.js
```


### Cloud Functions Endpoints

```
📝 Generación: https://us-central1-kashio-squad-nova.cloudfunctions.net/generateArtifact
🔍 Análisis:   https://us-central1-kashio-squad-nova.cloudfunctions.net/analyzeIntake
💬 Chat:       https://us-central1-kashio-squad-nova.cloudfunctions.net/ariaChat
```

### Debugging y Logs

ARIA tiene logging detallado en:
- **Browser Console:** Logs de requests/responses del frontend
- **Cloud Functions Logs:** Logs detallados de backend

Ver [docs/LOGS_DEBUGGING.md](docs/LOGS_DEBUGGING.md) para guía completa de debugging.

---

## 🔐 Seguridad y Mejores Prácticas

- ✅ Variables de entorno para credenciales sensibles
- ✅ No incluir API keys en el código
- ✅ Validación de tipos con TypeScript
- ✅ Sanitización de inputs
- ✅ CORS configurado apropiadamente
- ✅ HTTPS en producción

---

## 🚢 Deployment en Google Cloud Platform

**Plataforma**: Google Cloud Run (GCP únicamente)

### URL de Producción
🔗 **https://aria-frontend-215989210525.us-central1.run.app**

#### Última actualización: 8 Feb 2026 - 20:00
- ✅ Modelo Gemini: `gemini-2.5-flash` (Jun 2025 - Probado ✓)
- ✅ Revisión Frontend: **PENDIENTE DE DEPLOYMENT** (ver instrucciones abajo)
- ✅ **NUEVA FUNCIONALIDAD:** Persistencia de Intake → Initiative
- ✅ Cloud Functions: Actualizadas con logs detallados
  - generateArtifact (rev 00004-lij)
  - analyzeIntake (rev 00002-hok)
  - ariaChat (rev 00002-zoq)
- ✅ Build: Completado sin errores ✓
- ✅ Logging: Frontend + Backend mejorado

#### 🚀 Deployment Options

**Solo Frontend (sin base de datos):**
```bash
cd /Users/jules/Kashio/ARIA
gcloud auth login  # Si es necesario
./deploy.sh
```

**Full Stack (PostgreSQL + Cloud Functions + Frontend):**
```bash
cd /Users/jules/Kashio/ARIA
gcloud auth login  # Si es necesario
./deploy-full-stack.sh  # Script interactivo que despliega todo
```

**Ver guías completas:**
- [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md) - Frontend solamente
- [POSTGRESQL_IMPLEMENTATION_GUIDE.md](POSTGRESQL_IMPLEMENTATION_GUIDE.md) - Guía completa con PostgreSQL

### Deployment a Cloud Run

```bash
cd /Users/jules/Kashio/ARIA

# Deploy con auto-build desde Dockerfile
gcloud run deploy aria-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --project kashio-squad-nova

# O usando Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

### Infraestructura Completa en GCP

- **Cloud Run**: Frontend React serverless (auto-scaling 1-10 instancias, 2Gi RAM, 2 vCPU)
- **Cloud Functions**: Backend API serverless (generateArtifact, analyzeIntake, ariaChat)
- **Cloud SQL PostgreSQL 15**: Base de datos managed (db-f1-micro, 10GB SSD)
- **Gemini API**: IA generativa vía Cloud Functions con Secret Manager
- **Identity Platform**: Autenticación Microsoft 365 (Azure AD)
- **Secret Manager**: API keys y credenciales seguras
- **Cloud Storage**: 2 buckets (artifacts + templates)
- **Supabase Storage**: Archivos (PDFs, DOCx) con CDN
- **Supabase Realtime**: WebSocket subscriptions
- **Auto-generated APIs**: REST + GraphQL
- **Row Level Security**: Seguridad granular

### Variables de Entorno

Configuradas en Cloud Run:
```bash
# GCP
VITE_VERTEX_AI_PROJECT=kashio-prod
GOOGLE_CLOUD_PROJECT=kashio-prod

# Supabase
VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhb...
```

Secrets en Secret Manager (GCP):
- `gemini-api-key` - API key de Vertex AI
- `supabase-service-role-key` - Key para backend

### Ventajas de esta Arquitectura

- ✅ **Ahorro**: 51% menos costo ($390/mes ahorrados vs Cloud SQL)
- ✅ **Velocidad**: APIs auto-generadas, menos código backend
- ✅ **Simplicidad**: 1 plataforma (Supabase) vs 3 servicios GCP
- ✅ **Modernidad**: Realtime, RLS, Edge Functions incluidos
- ✅ **Escalabilidad**: Auto-scaling en ambas plataformas

### CI/CD Pipeline

- **Trigger**: Push a rama `main`
- **Build**: Cloud Build (Docker container)
- **Deploy**: Automático a Cloud Run
- **Database**: Migrations automáticas con Supabase CLI
- **Rollback**: Instantáneo (<30 segundos)

Ver [docs/technical/TECHNICAL_SPECIFICATION.md](docs/technical/TECHNICAL_SPECIFICATION.md) v3.0.0 para detalles completos.

---

## 📝 Contribución

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Proyecto propietario de **Kashio** - Todos los derechos reservados © 2026

---

## 📞 Contacto y Soporte

- **Product Owner**: DPI (Rosa María Orellana)
- **Tech Lead**: Arley / Dennys
- **Documentación**: [docs/](docs/)
- **Especificación Técnica**: [docs/technical/TECHNICAL_SPECIFICATION.md](docs/technical/TECHNICAL_SPECIFICATION.md)

---

## 🗺️ Roadmap

### Q1 2026
- [x] MVP de ARIA Control Center
- [x] Integración Gemini AI
- [ ] Publicación automática a Confluence
- [ ] Publicación automática a Jira

### Q2 2026
- [ ] Integración con SharePoint
- [ ] Webhooks para actualizaciones en tiempo real
- [ ] Dashboard avanzado de analytics

### Q3 2026
- [ ] Mobile responsive optimization
- [ ] Exportación masiva de artefactos
- [ ] Integraciones con herramientas adicionales

---

## 🙏 Agradecimientos

Gracias a todos los equipos que han contribuido al desarrollo de ARIA:
- **Product Team**: Definición de features y UX
- **Tech Team**: Desarrollo e implementación
- **AI Team**: Integración y optimización de modelos
- **PMO**: Gobierno y procesos

---

**Built with ❤️ by Kashio Team**

