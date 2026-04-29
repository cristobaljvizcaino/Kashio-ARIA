# Repositorio Git - ARIA Control Center

## 📦 Información del Repositorio

| Aspecto | Detalle |
|---------|---------|
| **Plataforma** | Bitbucket |
| **URL** | https://bitbucket.org/kashio-2025/aria |
| **Workspace** | kashio-2025 |
| **Repositorio** | aria |
| **Rama Principal** | `main` |
| **Remote** | `origin` |

---

## 🚀 Commits Iniciales

### Commit 1: Initial Commit
```
feat: Initial commit - ARIA Control Center v1.0.0

- Frontend completo con React 19 + TypeScript
- 10 módulos funcionales: OEA Strategy, Portfolio, Intake Hub, ARIA Generation, etc.
- Integración con Gemini API para generación de artefactos con IA
- Generación de PDFs profesionales con jsPDF
- Cloud Storage GCP configurado (2 buckets)
- Documentación técnica completa (v3.0.0)
- Deployment en Vercel funcionando
- Stack: React 19, TypeScript, Vite, TailwindCSS, Gemini AI, jsPDF
- Arquitectura: GCP + Supabase ready
```

**Archivos**: 52 archivos, 15,148 líneas de código

### Commit 2: Merge
```
chore: Merge with remote repository, resolve .gitignore conflict
```

---

## 📂 Estructura del Repositorio

```
aria/
├── src/                      # Código fuente
│   ├── components/          # 4 componentes React
│   ├── views/               # 10 vistas principales
│   ├── services/            # 3 servicios (gemini, pdf, storage)
│   ├── types/               # TypeScript definitions
│   └── constants/           # Mock data
├── docs/                    # Documentación
│   ├── technical/          # Spec técnica v3.0.0
│   ├── GEMINI_API_SETUP.md
│   └── CLOUD_STORAGE_SETUP.md
├── assets/                  # Assets de negocio
│   ├── excel/              # 3 archivos
│   ├── csv/                # 5 archivos
│   ├── pdf/                # 1 archivo
│   └── word/               # 1 archivo
├── public/                  # Archivos estáticos
├── Dockerfile              # Para Cloud Run
├── cloudbuild.yaml         # CI/CD GCP
├── package.json            # Dependencias
└── README.md               # Documentación principal
```

---

## 🔧 Comandos Git Útiles

### Clonar el Repositorio
```bash
git clone https://bitbucket.org/kashio-2025/aria.git
cd aria
npm install
```

### Pull Últimos Cambios
```bash
git pull origin main
```

### Crear Nueva Rama
```bash
git checkout -b feature/nueva-funcionalidad
```

### Commit y Push
```bash
git add .
git commit -m "feat(module): descripción del cambio"
git push origin feature/nueva-funcionalidad
```

### Ver Historial
```bash
git log --oneline --graph
```

---

## 🔐 Configuración de Acceso

### SSH (Recomendado para desarrollo)

1. Generar SSH key:
```bash
ssh-keygen -t ed25519 -C "arley.gutierrez@kashio.us"
```

2. Agregar a Bitbucket:
   - Ve a: https://bitbucket.org/account/settings/ssh-keys/
   - Agrega tu clave pública (`~/.ssh/id_ed25519.pub`)

3. Cambiar remote a SSH:
```bash
git remote set-url origin git@bitbucket.org:kashio-2025/aria.git
```

### HTTPS (Actual)
- URL: `https://bitbucket.org/kashio-2025/aria.git`
- Requiere username + app password en cada push
- Credenciales se guardan en keychain

---

## 👥 Colaboración

### Branching Strategy

Usar **Git Flow** simplificado:

```
main (producción)
  ↑
develop (desarrollo)
  ↑
feature/* (features)
  ↑
hotfix/* (fixes críticos)
```

### Naming Conventions

| Tipo | Prefijo | Ejemplo |
|------|---------|---------|
| Nueva feature | `feature/` | `feature/supabase-integration` |
| Bug fix | `fix/` | `fix/pdf-generation-error` |
| Documentación | `docs/` | `docs/update-api-guide` |
| Refactoring | `refactor/` | `refactor/components-structure` |
| Performance | `perf/` | `perf/optimize-bundle-size` |

### Pull Requests

1. Crear feature branch
2. Desarrollar y commitear
3. Push a origin
4. Crear PR en Bitbucket
5. Code review
6. Merge a main

---

## 📋 .gitignore Configurado

El repositorio ya tiene `.gitignore` que excluye:

```
# Dependencies
node_modules/

# Build outputs
dist/
build/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store

# Logs
logs/
*.log

# Temporary
tmp/
temp/
```

**IMPORTANTE**: `.env.local` con Gemini API key NO está en Git (seguridad).

---

## 🔄 CI/CD con Bitbucket Pipelines

### Configurar Bitbucket Pipelines (Futuro)

Crear `bitbucket-pipelines.yml`:

```yaml
image: node:18

pipelines:
  default:
    - step:
        name: Build and Test
        caches:
          - node
        script:
          - npm ci
          - npm run build
          - npm test
  
  branches:
    main:
      - step:
          name: Deploy to Production
          deployment: production
          script:
            - npm ci
            - npm run build
            - npx vercel --prod --token=$VERCEL_TOKEN
```

---

## 📊 Estado del Repositorio

| Métrica | Valor |
|---------|-------|
| **Archivos** | 52 |
| **Líneas de código** | 15,148 |
| **Commits** | 2 |
| **Branches** | 1 (main) |
| **Contributors** | 1 (Arley Gutierrez) |
| **Último push** | Enero 15, 2026 |

---

## 🔗 Integración con Vercel

Vercel ya tiene el proyecto linkeado localmente (`.vercel/`), pero puedes conectarlo a Git:

### Conectar Vercel con Bitbucket

1. Ve a: https://vercel.com/arleygutierrez-5018s-projects/aria-control-center/settings/git
2. Conecta con Bitbucket
3. Selecciona repositorio `kashio-2025/aria`
4. Configura:
   - Production branch: `main`
   - Auto-deploy: Enabled

**Beneficio**: Cada push a `main` → Deploy automático en Vercel

---

## 📞 Soporte

**Issues**: https://bitbucket.org/kashio-2025/aria/issues  
**Pull Requests**: https://bitbucket.org/kashio-2025/aria/pull-requests  
**Pipelines**: https://bitbucket.org/kashio-2025/aria/pipelines

---

## ✅ Checklist Post-Setup

- [x] Repositorio inicializado
- [x] Remote configurado (Bitbucket)
- [x] Commit inicial (52 archivos)
- [x] Push a main exitoso
- [ ] Configurar SSH keys (recomendado)
- [ ] Invitar colaboradores al repo
- [ ] Configurar branch protection rules
- [ ] Setup Bitbucket Pipelines (CI/CD)
- [ ] Conectar Vercel con Git para auto-deploy

---

**Última actualización**: Enero 15, 2026  
**Mantenido por**: Equipo ARIA Kashio

