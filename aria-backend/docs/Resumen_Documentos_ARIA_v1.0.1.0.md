# Cuadro Resumen de Documentos Generados por ARIA

**Proyecto:** ARIA 2.0 (Automated Research & Intelligence Agent)
**Producto:** KashioOS
**Versión del documento:** 1.0.1.0
**Fecha de generación:** 2026-05-11
**Mantenido por:** Project Manager — Proyecto ARIA
**Fuentes:**

- `config/ARIA_config_v1.0.0.0.md` (versiones activas de prompts y plantillas)
- `context/MAI_Canonical_v2.1.0.0.xlsx` (Master Artifact Inventory canónico — columnas K, N, O, P, Q, R, T)

---

## 1. Propósito

Este documento consolida, en un único cuadro resumen, **todos los documentos que ARIA genera automáticamente** dentro del ciclo de vida del producto KashioOS. Para cada documento se indica:

- La **fase** del ciclo de vida en la que se genera.
- El **orden de generación** dentro de la fase.
- El **tipo de iniciativa** al que aplica (New / Change).
- El **tipo de producto** al que aplica (Offering / Sellable / Non-Sellable).
- El **prompt** y la **plantilla** activos que ARIA utiliza para producir el documento.

El cuadro se basa en el inventario canónico (MAI v2.1.0.0) y refleja únicamente los artefactos cuyo campo "¿En ARIA?" está marcado como **Sí**.

---

## 2. Definiciones

### 2.1 Fases del Ciclo de Vida de KashioOS

| Fase | Nombre | Propósito | ¿ARIA genera documentos? |
|------|--------|-----------|:------------------------:|
| Phase 1 | Research | Investigación de mercado, regulaciones, tendencias y visión inicial del producto. | ⬜ No |
| Phase 2 | Analysis | Análisis funcional: definición de requisitos, historias de usuario, capacidades y funcionalidades. | ✅ Sí |
| Phase 3 | Design | Diseño de arquitectura y de flujos del producto. | ✅ Sí |
| Phase 4 | Frontend Development | Construcción de la capa de presentación. | ⬜ No |
| Phase 5 | Backend Development | Construcción de la capa de servicios, contratos e integraciones. | ✅ Sí |
| Phase 6 | Testing | Aseguramiento de calidad y pruebas. | ⬜ No |
| Phase 7 | Deployment | Despliegue, comercialización, soporte operativo y gobernanza del producto. | ✅ Sí |
| Phase 8 | Monitoring | Monitoreo operativo y mejora continua. | ⬜ No |

**Nota:** ARIA produce artefactos únicamente en las fases marcadas con ✅. Las demás fases consumen estos artefactos como insumo o producen artefactos por canales fuera de ARIA.

### 2.2 Tipo de Iniciativa (columna **N** del MAI)

Indica el tipo de iniciativa de negocio al cual aplica cada documento.

| Valor | Significado | Equivalencia |
|-------|-------------|--------------|
| **New** | Iniciativa correspondiente a **una nueva funcionalidad** del producto. Implica un **proyecto completo** que va desde la concepción hasta el despliegue. | Build / Project |
| **Change** | Iniciativa correspondiente a **un mantenimiento o mejora** sobre una funcionalidad existente. | Maintenance / Enhancement |

> **Representación en el cuadro:** Al igual que con los tipos de producto, las columnas **New** y **Change** se muestran de forma independiente, marcadas con ✅ (aplica) o — (no aplica). Si un documento aplica a ambas, presentará ✅ en las dos columnas.
> **Convención:** Cuando una iniciativa es de tipo **Change** (mantenimiento), no se regeneran todos los artefactos: solo aquellos cuya columna *Change* esté marcada con ✅.

### 2.3 Tipo de Producto (columna **O** del MAI)

Clasifica cada documento según el tipo de producto al que aplica dentro del portafolio KashioOS.

| Tipo | Descripción |
|------|-------------|
| **Offering** | Producto ofrecido como servicio o plataforma (propuesta de valor principal). Requiere documentación que sustente la definición, el diseño y la operación tecnológica de la oferta. |
| **Sellable** | Producto comercializable (vendible a clientes finales). Requiere documentación comercial, de marketing, soporte y operación además de la documentación técnica. |
| **Non-Sellable** | Producto no comercializable de manera directa (componentes internos, infraestructura o servicios de soporte). Requiere documentación técnica y operativa para su funcionamiento interno. |

> En el cuadro principal se utilizan tres columnas (Offering, Sellable, Non-Sellable) con la convención ✅ = aplica / — = no aplica, para facilitar la lectura visual.

### 2.4 Prompt y Plantilla

| Elemento | Definición |
|----------|------------|
| **Prompt** | Instrucción estructurada (archivo `.md` en la carpeta `prompts/`) que ARIA ejecuta para producir un documento. Define qué información debe extraer, cómo razonar y cómo poblar la plantilla. Es el "cómo razonar". |
| **Plantilla** | Esqueleto del documento (archivo `.md` en la carpeta `templates/`) con la estructura, secciones y formato esperados del entregable final. Es el "cómo presentar". |

Las versiones reportadas son las versiones **activas** según `config/ARIA_config_v1.0.0.0.md`. En caso de existir múltiples versiones, se selecciona la mayor según el algoritmo `Major > Minor > Patch > Build`.

### 2.5 Orden de Generación

El identificador `P{fase}.{orden}` indica el orden de generación dentro de la fase. Los documentos se generan secuencialmente y los posteriores pueden depender de los anteriores. En Phase 7 los documentos están organizados además en niveles internos (Nivel 1 → Nivel 4) según sus dependencias intra-fase.

---

## 3. Cuadro Resumen de Documentos por Fase

### 3.1 Phase 2 — Analysis

**Total de documentos:** 5 · **Pre-requisitos:** insumos de Phase 1 (Market Research, Service Blueprint, Benchmark, Regulaciones, Tendencias, Visión de Producto)

| Orden | Documento | New | Change | Offering | Sellable | Non-Sellable | Prompt (versión activa) | Plantilla (versión activa) |
|:-----:|-----------|:---:|:------:|:--------:|:--------:|:------------:|-------------------------|----------------------------|
| P2.1 | PRD (Product Requirements Document) | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_PRD_Producto_v1.0.0.0.md` | `Plantilla_PRD_Producto_v1.2.0.0.md` |
| P2.2 | (USM) Epics & Release Stories Map | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_USM_Inicial_v1.0.0.0.md` | `Plantilla_USM_Inicial_v1.0.0.6.md` |
| P2.3 | SRS / Spec Funcional + NFR | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_SRS_v1.0.0.3.md` | `Plantilla_Kashio_SRS_v1.0.0.5.md` |
| P2.4 | Mapa de Capacidades | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_capacidades_v1.1.0.3.md` | `Plantilla_capacidades_v1.1.0.0.md` |
| P2.5 | Funcionalidades (catálogo) | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_funcionalidades_v1.1.0.0.md` | `Plantilla_Funcionalidades_v1.0.0.0.md` |

### 3.2 Phase 3 — Design

**Total de documentos:** 4 · **Pre-requisitos:** Phase 2 completa (PRD, USM, SRS)

| Orden | Documento | New | Change | Offering | Sellable | Non-Sellable | Prompt (versión activa) | Plantilla (versión activa) |
|:-----:|-----------|:---:|:------:|:--------:|:--------:|:------------:|-------------------------|----------------------------|
| P3.1 | SAD (Software Architecture Document) | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_SAD_v1.0.0.3.md` | `Plantilla_Kashio_SAD_v1.0.0.5.md` |
| P3.2 | SDD (Software Design Document) | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_SDD_v1.0.0.3.md` | `Plantilla_Kashio_SDD_v1.0.0.5.md` |
| P3.3 | Arquitectura (C4 + ADRs) | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_arquitectura_v1.1.0.0.md` | `Plantilla_arquitectura_v1.0.0.0.md` |
| P3.4 | Flujos (secuencia / BPMN) | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_flujos_v1.1.0.0.md` | `Plantilla_Flujo_v1.0.0.0.md` |

### 3.3 Phase 5 — Backend Development

**Total de documentos:** 1 · **Pre-requisitos:** Phase 2 (SRS) y Phase 3 (SAD, SDD) completas

| Orden | Documento | New | Change | Offering | Sellable | Non-Sellable | Prompt (versión activa) | Plantilla (versión activa) |
|:-----:|-----------|:---:|:------:|:--------:|:--------:|:------------:|-------------------------|----------------------------|
| P5.1 | APIs / Contratos (OpenAPI / AsyncAPI) | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_api_v1.1.0.0.md` | `Plantilla_api_v1.0.0.0.md` |

### 3.4 Phase 7 — Deployment

**Total de documentos:** 26 · **Pre-requisitos:** Phases 2, 3 y 5 completas

Los documentos de Phase 7 están organizados en cuatro niveles según sus dependencias intra-fase. Dentro de cada nivel se mantiene el orden de generación P7.x.

#### Phase 7 — Nivel 1: Documentos sin dependencias intra-Phase 7 (P7.1 – P7.10)

| Orden | Documento | New | Change | Offering | Sellable | Non-Sellable | Prompt (versión activa) | Plantilla (versión activa) |
|:-----:|-----------|:---:|:------:|:--------:|:--------:|:------------:|-------------------------|----------------------------|
| P7.1 | Product Marketing Strategy | ✅ | — | ✅ | ✅ | — | `Prompt_ProductMarketingStrategy_v1.0.0.0.md` | _(sin plantilla)_ |
| P7.2 | Impacto COGS | ✅ | ✅ | — | ✅ | — | `Prompt_Impacto_COGS_v1.0.0.0.md` | `Plantilla_Impacto_COGS_v1.0.0.0.md` |
| P7.3 | Reportes financieros requeridos | ✅ | — | — | ✅ | — | `Prompt_Reportes_Financieros_Requeridos_v1.0.0.0.md` | `Plantilla_Reportes_Financieros_Requeridos_v1.0.0.0.md` |
| P7.4 | Runbook N1 | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_Runbook_Nivel_1_v1.0.0.3.md` | `Plantilla_Runbook_N1_v1.0.0.0.md` |
| P7.5 | Manejo de Objeciones | ✅ | — | — | ✅ | — | `Prompt_Manejo_de_Objeciones_Producto_v1.0.0.0.md` | `Artefacto_Manejo_de_Objeciones_v1.0.0.0.md` |
| P7.6 | Guía de Usuario | ✅ | — | ✅ | ✅ | ✅ | `Prompt_Guia_Usuario_v1.0.0.0.md` | `Plantilla_Guia_Usuario_v1.0.0.0.md` |
| P7.7 | One-pager | ✅ | — | ✅ | ✅ | — | `Prompt_One_Pager_Producto_v1.0.0.0.md` | `Artefacto_One_Pager_Producto_v1.0.0.0.md` |
| P7.8 | Pitch Deck (Presentación de Producto) | ✅ | — | ✅ | ✅ | — | `Prompt_Presentacion_Producto_v1.0.0.0.md` | `Artefacto_Presentación_Producto_v1.0.0.0.md` |
| P7.9 | Brochure Producto | ✅ | — | — | ✅ | — | `Prompt_Brochure_Producto_v1.0.0.0.md` | `Artefacto_Brochure_Producto_v1.0.0.0.md` |
| P7.10 | Manual de Producto (operación + reglas) | ✅ | — | — | ✅ | — | `Prompt_manual_de_Producto_v1.0.0.0.md` | `Artefacto_Manual_de_Producto_v1.0.0.0.md` |

#### Phase 7 — Nivel 2: Documentos con dependencias del Nivel 1 (P7.11 – P7.20)

| Orden | Documento | New | Change | Offering | Sellable | Non-Sellable | Prompt (versión activa) | Plantilla (versión activa) |
|:-----:|-----------|:---:|:------:|:--------:|:--------:|:------------:|-------------------------|----------------------------|
| P7.11 | ICP & Segmentos objetivo | ✅ | — | ✅ | ✅ | — | `Prompt_ICP_Producto_v1.0.0.0.md` | `Artefacto_ICP_v1.0.0.0.md` |
| P7.12 | Playbook de Ventas | ✅ | — | — | ✅ | — | `Prompt_Playbook_de_Ventas_v1.0.0.0.md` | `Artefacto_Playbook_de_Ventas_v1.0.0.0.md` |
| P7.13 | Runbook N2 | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_Runbook_Nivel_2_v1.0.0.2.md` | `Plantilla_Runbook_N2_v1.0.0.0.md` |
| P7.14 | Exposición de riesgo (financiero / fraude) | ✅ | — | ✅ | ✅ | — | `Prompt_Exposicion_Riesgo_Financiero_Fraude_v1.0.0.0.md` | `Plantilla_Exposicion_Riesgo_Financiero_Fraude_v1.0.0.0.md` |
| P7.15 | Quick-start Guide | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_Quick_Start_Guide_v1.0.0.0.md` | `Plantilla_Quick_Start_Guide_v1.0.0.0.md` |
| P7.16 | How-tos | ✅ | — | — | ✅ | — | `Prompt_How_To_v1.0.0.0.md` | `Plantilla_How_To_v1.0.0.0.md` |
| P7.17 | Training: Onboarding / Success | ✅ | — | — | ✅ | ✅ | `Prompt_Training_v1.0.0.0.md` | `Plantilla_Training_v1.0.0.0.md` |
| P7.18 | Documentación Técnica Cliente (Readme / Portal) | ✅ | — | — | ✅ | — | `Prompt_Documentacion_Tecnica_Cliente_v1.0.0.0.md` | `Plantilla_Documentacion_Tecnica_Cliente_v1.0.0.0.md` |
| P7.19 | Casos de Uso | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_Casos_de_Uso_Producto_v1.0.0.0.md` | `Artefacto_Caso_de_Uso_v1.0.0.0.md` |
| P7.20 | Ficha Funcional | ✅ | — | — | ✅ | ✅ | `Prompt_Ficha_Funcional_Producto_v1.0.0.0.md` | `Artefacto_Ficha_Funcional_Producto_v1.0.0.0.md` |

#### Phase 7 — Nivel 3: Documentos con dependencias del Nivel 2 (P7.21 – P7.23)

| Orden | Documento | New | Change | Offering | Sellable | Non-Sellable | Prompt (versión activa) | Plantilla (versión activa) |
|:-----:|-----------|:---:|:------:|:--------:|:--------:|:------------:|-------------------------|----------------------------|
| P7.21 | Runbook N3 | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_Runbook_Nivel_3_v1.0.0.1.md` | `Plantilla_Runbook_N3_v1.0.0.0.md` |
| P7.22 | Contingencias por rail / territorio | ✅ | — | ✅ | ✅ | — | `Prompt_Contingencias_Rail_Territorio_v1.0.0.0.md` | `Plantilla_Contingencias_Rail_Territorio_v1.0.0.0.md` |
| P7.23 | Killswitch & Rollback | ✅ | ✅ | ✅ | ✅ | ✅ | `Prompt_Killswitch_Rollback_v1.0.0.0.md` | `Plantilla_Killswitch_Rollback_v1.0.0.0.md` |

#### Phase 7 — Nivel 4: Documentos de consolidación (P7.24 – P7.26)

| Orden | Documento | New | Change | Offering | Sellable | Non-Sellable | Prompt (versión activa) | Plantilla (versión activa) |
|:-----:|-----------|:---:|:------:|:--------:|:--------:|:------------:|-------------------------|----------------------------|
| P7.24 | Criterios de 'operación estable' | ✅ | — | — | ✅ | ✅ | `Prompt_Criterios_Operacion_Estable_v1.0.0.0.md` | `Plantilla_Criterios_Operacion_Estable_v1.0.0.0.md` |
| P7.25 | Checklist de adopción por área | ✅ | — | — | ✅ | ✅ | `Prompt_Checklist_Adopcion_Area_v1.0.0.0.md` | `Plantilla_Checklist_Adopcion_Area_v1.0.0.0.md` |
| P7.26 | General de Producto (Overview) | ✅ | — | — | ✅ | — | `Prompt_Artefacto_General_de_Producto_v1.0.0.0.md` | `Artefacto_General_de_Producto_v1.0.0.0.md` |

---

## 4. Resumen Estadístico

### 4.1 Conteo de documentos por fase

| Fase | Documentos ARIA | Prompts | Plantillas | Offering | Sellable | Non-Sellable |
|------|:---------------:|:-------:|:----------:|:--------:|:--------:|:------------:|
| Phase 2: Analysis | 5 | 5 | 5 | 5 | 5 | 5 |
| Phase 3: Design | 4 | 4 | 4 | 4 | 4 | 4 |
| Phase 5: Backend Development | 1 | 1 | 1 | 1 | 1 | 1 |
| Phase 7: Deployment | 26 | 26 | 25 *(¹)* | 12 | 26 | 12 |
| **Total** | **36** | **36** | **35** | **22** | **36** | **22** |

*(¹) Product Marketing Strategy (P7.1) es el único artefacto que cuenta con prompt pero no tiene plantilla asociada.*

### 4.2 Conteo de documentos por tipo de iniciativa

| Tipo de Iniciativa | Documentos aplicables | % del total | Comentario |
|--------------------|:---------------------:|:-----------:|------------|
| **New** | 36 | 100% | Todos los documentos generados por ARIA se producen para iniciativas nuevas (proyecto completo). |
| **Change** | 17 | 47% | Subconjunto núcleo (funcional + técnico + operativo) que también se regenera en iniciativas de mantenimiento o mejora. |

**Detalle de los 17 documentos aplicables a iniciativas Change:**

| Fase | Documentos con Change ✅ |
|------|--------------------------|
| Phase 2 | PRD, USM, SRS, Mapa de Capacidades, Funcionalidades |
| Phase 3 | SAD, SDD, Arquitectura, Flujos |
| Phase 5 | APIs / Contratos |
| Phase 7 | Impacto COGS, Runbook N1, Runbook N2, Quick-start Guide, Casos de Uso, Runbook N3, Killswitch & Rollback |

### 4.3 Conteo de documentos por tipo de producto

| Tipo de Producto | Documentos aplicables | % del total |
|------------------|:---------------------:|:-----------:|
| **Sellable** | 36 | 100% |
| **Offering** | 22 | 61% |
| **Non-Sellable** | 22 | 61% |

> Los productos **Sellable** requieren la totalidad del corpus documental (técnico + comercial + operativo).
> Los productos **Offering** y **Non-Sellable** comparten los 10 documentos núcleo (Phases 2, 3 y 5) y se diferencian principalmente en los artefactos de Phase 7 (comerciales vs. operativos / técnicos).

---

## 5. Aclaraciones y Notas Importantes

1. **Versiones activas:** Las versiones reportadas en las columnas *Prompt* y *Plantilla* corresponden a la última versión activa publicada en `config/ARIA_config_v1.0.0.0.md`. Si se publica una nueva versión, debe actualizarse este cuadro junto con el archivo de configuración.
2. **Nomenclatura normalizada:** Los nombres de archivos en el cuadro están en formato normalizado (`{Nombre}_v{Major}.{Minor}.{Patch}.{Build}.md`). El MAI Excel puede contener nombres en formato antiguo (por ejemplo `Plantilla Kashio SRS 1.0.0.5.md` → normalizado a `Plantilla_Kashio_SRS_v1.0.0.5.md`).
3. **Aplicabilidad por tipo de iniciativa:**
   - Para una iniciativa **New**, se generan **todos** los documentos cuya columna *New* esté marcada con ✅ (los 36 documentos del cuadro).
   - Para una iniciativa **Change**, se generan solo los documentos cuya columna *Change* esté marcada con ✅ (17 documentos: el subconjunto núcleo funcional, técnico, operativo y de gobernanza — PRD, USM, SRS, Capacidades, Funcionalidades, SAD, SDD, Arquitectura, Flujos, APIs, COGS, Runbook N1/N2/N3, Quick-start, Casos de Uso y Killswitch).
   - Cuando un documento presenta ✅ en *ambas* columnas, significa que se regenera en cualquiera de los dos tipos de iniciativa.
4. **Aplicabilidad por tipo de producto:** Si un documento aplica a varios tipos de producto (por ejemplo *Offering / Sellable / Non-Sellable*), se genera **una única vez por iniciativa** y se reutiliza en todos los flujos aplicables.
5. **Phase 7 — Niveles internos:** Aunque la columna *Orden* sigue la numeración secuencial P7.1 → P7.26, los niveles (1 a 4) indican grupos de documentos cuya generación puede paralelizarse (los del mismo nivel) siempre y cuando se respeten las dependencias.
6. **Artefactos no mapeados:** El prompt `Prompt_Caso_de_Exito_v1.0.0.0.md` existe en el repositorio pero **no está incluido en el MAI canónico v2.1.0.0** y por tanto no aparece en este cuadro. Su clasificación quedará pendiente hasta su inclusión formal.
7. **Diferencias entre MAI v2.1.0.0 y `ARIA_config_v1.0.0.0`:** En P7.22 (Contingencias por rail / territorio), la columna O del MAI Excel indica *Offering / Sellable* mientras que la matriz de aplicabilidad por flujos del archivo de configuración marca también *Non-Sellable* como aplicable. Este cuadro respeta la columna O del MAI v2.1.0.0 como fuente oficial; se recomienda alinear ambas fuentes en una próxima revisión.
8. **Fases sin documentos ARIA:** Phases 1, 4, 6 y 8 no producen documentos automáticos a través de ARIA. Sus artefactos (investigación, frontend, QA y monitoreo) se gestionan por canales separados y, cuando aplica, se utilizan como **insumos** o **salidas downstream** de ARIA.

---

## 6. Referencias Cruzadas

| Referencia | Ubicación |
|------------|-----------|
| Configuración de versiones activas | `config/ARIA_config_v1.0.0.0.md` |
| MAI canónico (fuente de la tabla) | `context/MAI_Canonical_v2.1.0.0.xlsx` |
| MAI en formato Markdown | `context/Master_Artifact_Inventory_ARIA_v1.0.0.0.md` |
| Histórico de versiones (prompts y plantillas) | `context/Version_config_promts&templates_v1.0.0.2.md` |
| Carpeta de prompts activos | `prompts/` |
| Carpeta de plantillas activas | `templates/` |

---

**Versión del documento:** 1.0.1.0
**Última actualización:** 2026-05-11
**Mantenido por:** Project Manager — Proyecto ARIA
**Referencia canónica del MAI:** `context/MAI_Canonical_v2.1.0.0.xlsx`

### Bitácora de versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0.0.0 | 2026-05-11 | Versión inicial del cuadro resumen. |
| 1.0.1.0 | 2026-05-11 | Se desdobla la columna *Tipo de Iniciativa* en dos columnas independientes (`New` y `Change`) con marcas ✅ / —. Se reclasifica el PRD de `Run / New` a `New / Change` (✅ en ambas columnas). Se eliminan los valores `Run / New` y `New / Change` del cuadro principal. Se actualiza el resumen estadístico de la sección 4.2 y la nota 3 de la sección 5. |
