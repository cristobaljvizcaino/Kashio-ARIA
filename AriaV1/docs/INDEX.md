# Índice de Documentación - ARIA

Bienvenido a la documentación completa del proyecto ARIA (Automated Requirements & Intelligent Artifacts).

---

## 📚 Estructura de Documentación

```
docs/
├── technical/           # Documentación técnica
├── architecture/        # Diagramas y diseños
└── business/           # Documentación de negocio
```

---

## 🎯 Guías Rápidas

### Para Desarrolladores
1. [README Principal](../README.md) - Introducción y setup
2. [Especificación Técnica](technical/TECHNICAL_SPECIFICATION.md) - Arquitectura completa
3. [Modelo de Datos](technical/DATA_MODEL.md) - Entidades y relaciones

### Para Arquitectos
1. [Especificación Técnica](technical/TECHNICAL_SPECIFICATION.md) - Stack, integraciones, seguridad
2. [Arquitectura de Datos](technical/DATA_MODEL.md) - Esquemas y relaciones

### Para Product Managers
1. [README Principal](../README.md) - Features y roadmap
2. Assets de negocio en [`/assets`](../assets/)

---

## 📖 Documentos Técnicos

### Core Technical Documentation

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| [TECHNICAL_SPECIFICATION.md](technical/TECHNICAL_SPECIFICATION.md) | ⭐⭐⭐ **ESPECIFICACIÓN TÉCNICA CONSOLIDADA v3.0.0**: Stack completo, arquitectura GCP + **Supabase** (Cloud Run, Supabase PostgreSQL, Vertex AI), deployment, seguridad, monitoreo + Modelo de Datos completo integrado. **Ahorro: 51% vs Cloud SQL** | Arquitectos, Tech Leads, DBAs |

**NOTA**: 
- El documento incluye TODO el modelo de datos consolidado (antes DATA_MODEL.md separado)
- **v3.0.0**: Migración a **Supabase** como plataforma de base de datos (PostgreSQL + Auth + Storage)

### Futuros Documentos (Q2 2026)

- `technical/API_REFERENCE.md` - Documentación de APIs internas
- `technical/INTEGRATION_GUIDE.md` - Guía de integraciones (Confluence, Jira, etc.)
- `technical/DEPLOYMENT_GUIDE.md` - Procedimientos de deployment
- `technical/TESTING_STRATEGY.md` - Plan de pruebas y QA

---

## 🏗️ Documentos de Arquitectura

### Diagramas Disponibles

(Próximamente)

- `architecture/SYSTEM_ARCHITECTURE.png` - Diagrama de alto nivel
- `architecture/DATA_FLOW.png` - Flujo de datos
- `architecture/DEPLOYMENT_ARCHITECTURE.png` - Arquitectura de deployment
- `architecture/INTEGRATION_DIAGRAM.png` - Mapa de integraciones

---

## 📊 Documentación de Negocio

### Assets de Referencia

Ubicados en [`/assets`](../assets/):

#### Excel Files (`assets/excel/`)
- `AI Product Content Inventario de Plantillas.xlsx` - Inventario de plantillas de contenido
- `Kashio_OEA_OKR_Iniciativas_2026.xlsx` - OEAs y OKRs 2026
- `PDLC_ARIA_Artefactos_Kashio.xlsx` - Artefactos del PDLC

#### CSV Files (`assets/csv/`)
- `Kashio proyecto 2026 - iniciativas 2026.csv` - Lista de iniciativas
- `Kashio_2026_Portfolio_Matrix_KPC_L3_ITServices - *.csv` - Matrices de portafolio

#### PDF Files (`assets/pdf/`)
- `KPC Catalog Kashio_Product_Playbook.pdf` - Playbook de productos

#### Word Files (`assets/word/`)
- `Arquitectura ARIA_ Ciclo de Vida y Flujo de Valor Técnico.docx` - Arquitectura y flujo

---

## 🔄 Proceso de Actualización

### Frecuencia de Revisión

| Documento | Frecuencia | Responsable |
|-----------|-----------|-------------|
| TECHNICAL_SPECIFICATION.md (v2.0.0 consolidado) | Trimestral o al modificar infraestructura GCP | Arquitecto de Solución + Cloud Architect |
| README.md | Mensual | Product Owner |

### Versionado

Todos los documentos técnicos incluyen:
- **Versión** (semver)
- **Fecha de última actualización**
- **Historial de cambios** al final

Ejemplo:
```markdown
**Versión**: 1.0.0
**Última actualización**: Enero 2026
```

---

## 🤝 Contribución a Documentación

### Reglas para Actualizar Docs

1. ✅ **Siempre actualizar después de cambios técnicos**
2. ✅ **Incluir diagramas cuando sea posible**
3. ✅ **Usar Markdown estándar**
4. ✅ **Ejemplos de código con syntax highlighting**
5. ✅ **Mantener TOC (tabla de contenidos) actualizado**

### Formato Estándar

````markdown
# Título del Documento

**Versión**: X.Y.Z
**Fecha**: Mes Año
**Autor**: Nombre

---

## Tabla de Contenidos

1. [Sección 1](#sección-1)
2. [Sección 2](#sección-2)

---

## Sección 1

Contenido...

```typescript
// Código de ejemplo
interface Example {
  field: string;
}
```

---

## Historial de Cambios

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0.0 | 2026-01-15 | Equipo | Versión inicial |
````

---

## 📞 Contacto

Para preguntas sobre la documentación:

- **Documentación Técnica**: Tech Leads (Arley, Dennys)
- **Documentación de Negocio**: Product Owner (Rosa María Orellana)
- **Arquitectura**: Arquitecto de Solución

---

## 🗺️ Roadmap de Documentación

### Q1 2026
- [x] README principal
- [x] Especificación técnica
- [x] Modelo de datos
- [ ] API Reference (cuando se implemente backend)

### Q2 2026
- [ ] Integration Guide (Confluence, Jira)
- [ ] Deployment Guide
- [ ] Testing Strategy
- [ ] Architecture diagrams

### Q3 2026
- [ ] User Guide completo
- [ ] Admin Guide
- [ ] Troubleshooting Guide

---

**Última actualización**: Enero 2026  
**Mantenido por**: Equipo ARIA

