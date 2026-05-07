# 📘 Product Requirements Document (PRD) – ARIA 2.0

## 1. Encabezado
- **Proyecto / Producto:** ARIA 2.0 (AI-Ready Information Architecture)  
- **Artefacto:** PRD  
- **Versión del documento:** v1.0.0.0  
- **Fecha:** 2026-04-08  
- **Autor / Responsable PRD:** Product Manager — Proyecto ARIA  
- **Dominio / Línea de negocio:** Gobierno Documental del Product Development Lifecycle (PDLC)  
- **Stakeholders clave:** Dirección de FinOps VAR, Dirección de Tecnología / Product, Equipos de Ingeniería, Product Managers, Technical Product Owners  
- **Estado del documento:** Borrador  

---

## 2. Introducción

### 2.1 Propósito del documento

Describir de forma clara y estructurada los **requerimientos de producto (PRD)** para ARIA 2.0, incluyendo su contexto, objetivos, alcance, capacidades, requisitos funcionales y no funcionales, flujos de usuario, riesgos y métricas de éxito.  
Este documento sirve como **fuente de verdad** para los equipos de negocio, producto, tecnología y demás áreas involucradas durante el ciclo de vida de ARIA 2.0 como módulo independiente integrado en KashioOS.

### 2.2 Alcance del producto / módulo

ARIA 2.0 es un módulo independiente dentro de KashioOS que se enfoca exclusivamente en la **generación, versionado y gobierno de los artefactos documentales del PDLC** para las iniciativas gestionadas en la plataforma. A diferencia de su versión anterior, ARIA 2.0 no gestiona requerimientos ni alineación con OKR corporativos —esas responsabilidades residen en KashioOS—. El alcance detallado (In-Scope / Out-of-Scope) se desarrolla en la sección 4.

### 2.3 Audiencia objetivo

- Product Management  
- Tecnología (Arquitectura, Desarrollo, QA, DevOps)  
- Operaciones y Soporte  
- Data / Analytics  
- Stakeholders de negocio relevantes (Dirección de FinOps VAR)  

### 2.4 Definiciones, acrónimos y abreviaturas

| Acrónimo | Significado |
|----------|-------------|
| ARIA | AI-Ready Information Architecture |
| PDLC | Product Development Lifecycle |
| KashioOS | Plataforma central de gestión de iniciativas y portafolio de producto de Kashio |
| PRD | Product Requirements Document |
| BPRD | Business Process Requirements Document |
| SRS | Software Requirements Specification |
| SAD | Software Architecture Document |
| SDD | Software Design Document |
| USM | User Story Map |
| API | Application Programming Interface |
| MAI | Master Artifact Inventory |
| OKR | Objectives and Key Results |
| COBIT | Control Objectives for Information and Related Technologies |
| ITIL | Information Technology Infrastructure Library |
| TOGAF | The Open Group Architecture Framework |
| PCI DSS | Payment Card Industry Data Security Standard |
| GDPR | General Data Protection Regulation |
| ADR | Architecture Decision Record |
| BPMN | Business Process Model and Notation |
| C4 | Modelo de arquitectura Context, Container, Component, Code |
| ICP | Ideal Customer Profile |
| COGS | Cost of Goods Sold |
| NFR | Non-Functional Requirements |

### 2.5 Referencias relacionadas

- Descripción de Requerimiento ARIA 2.0 (`input/ARIA 2.0/ARIA_2_Descripcion_de_Requerimiento.md`)  
- Master Artifact Inventory ARIA v1.0.0.0 (`context/Master_Artifact_Inventory_ARIA_v1.0.0.0.md`)  
- Archivo de Configuración ARIA v1.0.0.0 (`config/ARIA_config_v1.0.0.0.md`)  
- Configuración de Versiones de Prompts y Plantillas v1.0.0.2 (`context/Version_config_promts&templates_v1.0.0.2.md`)  
- Presentación ARIA (`input/ARIA 2.0/ARIA.pptx`)  

---

## 3. Visión general del producto

### 3.1 Resumen ejecutivo
**ARIA 2.0** (AI-Ready Information Architecture) es un módulo independiente de generación y gobierno documental que se integra dentro de KashioOS para automatizar la creación, versionado y control formal de los artefactos del Product Development Lifecycle (PDLC). ARIA 2.0 resuelve el problema de la generación manual, inconsistente y no trazable de la documentación de producto, proporcionando a los equipos de Product Management, Tecnología y Operaciones un sistema estandarizado y gobernado que produce hasta **36 tipos de artefactos** a lo largo de 8 fases del PDLC.

A diferencia de la versión original de ARIA —que operaba como sistema integral e independiente, abarcando tanto la gestión de requerimientos como la generación documental—, ARIA 2.0 se especializa exclusivamente en la **capa documental**, consumiendo la información de las iniciativas desde KashioOS vía APIs. Esto posiciona a ARIA 2.0 como el componente de inteligencia documental que complementa la gestión centralizada del portafolio de iniciativas que reside en KashioOS.

El valor principal de ARIA 2.0 es la **aceleración y estandarización de la documentación de producto**, asegurando trazabilidad, consistencia y control formal sin reemplazar el criterio experto, aplicable a los tres flujos de producto: Offering, Sellable y Non-Sellable.

### 3.2 Objetivos del producto
#### 3.2.1 Objetivos de negocio

- **Reducir el tiempo de generación documental** del PDLC, acelerando el ciclo de vida de las iniciativas gestionadas en KashioOS.  
- **Estandarizar la calidad de los artefactos** de producto mediante el uso de prompts y plantillas versionadas, eliminando inconsistencias entre equipos y proyectos.  
- **Asegurar trazabilidad completa** entre las fases del PDLC, desde la estrategia hasta la operación, permitiendo auditar qué artefactos se generaron, con qué versión de fuentes y en qué momento.  
- **Reducir el esfuerzo manual** de los Product Managers y Technical Product Owners en la redacción de documentación repetitiva, liberando capacidad para actividades de mayor valor estratégico.  
- **Integrar ARIA como componente nativo de KashioOS**, eliminando la duplicación de gestión de iniciativas y consolidando una fuente única de verdad.  

#### 3.2.2 Objetivos de usuario

- Facilitar que los **Product Managers** generen documentación completa del PDLC con menor esfuerzo y mayor consistencia, sin necesidad de conocer cada plantilla en detalle.  
- Permitir que los **Technical Product Owners** accedan a artefactos técnicos (SAD, SDD, APIs, Runbooks) generados de forma coherente con los requisitos de producto.  
- Dar mayor transparencia a los **stakeholders** sobre el estado de la documentación de cada iniciativa, con versionado y control formal.  
- Reducir la necesidad de soporte o intervención manual en la creación de documentos estándar del PDLC.  

#### 3.2.3 Métricas de éxito (KPIs)

- **Métrica:** Tiempo promedio de generación de un artefacto PDLC  
  - **Definición:** Tiempo transcurrido desde la solicitud de generación hasta la disponibilidad del artefacto finalizado  
  - **Fuente de datos:** Logs de ARIA Generation / KashioOS  
  - **Meta objetivo:** Reducción del 70% respecto al proceso manual actual  
  - **Horizonte de medición:** 6 meses post-lanzamiento  

- **Métrica:** Tasa de completitud de documentación por iniciativa  
  - **Definición:** Porcentaje de artefactos obligatorios generados respecto al total requerido según la matriz de aplicabilidad del flujo de producto  
  - **Fuente de datos:** Módulo de Configuración de Artefactos  
  - **Meta objetivo:** ≥ 95% de completitud en iniciativas activas  
  - **Horizonte de medición:** 3 meses post-lanzamiento  

- **Métrica:** Tasa de adopción de ARIA 2.0 por los equipos de producto  
  - **Definición:** Porcentaje de nuevas iniciativas en KashioOS que utilizan ARIA 2.0 para generar al menos un artefacto  
  - **Fuente de datos:** KashioOS / ARIA Generation  
  - **Meta objetivo:** ≥ 80% de nuevas iniciativas  
  - **Horizonte de medición:** 6 meses post-lanzamiento  

- **Métrica:** Consistencia de artefactos generados  
  - **Definición:** Porcentaje de artefactos que cumplen con la estructura definida en las plantillas versionadas sin requerir correcciones manuales mayores  
  - **Fuente de datos:** Revisiones de calidad / feedback de Product Managers  
  - **Meta objetivo:** ≥ 90%  
  - **Horizonte de medición:** 3 meses post-lanzamiento  

### 3.3 Contexto y oportunidad
#### 3.3.1 Contexto actual

En la versión original de ARIA, el sistema operaba de forma integral e independiente, abarcando tanto la gestión de requerimientos como la generación automatizada de los documentos asociados al PDLC. Con la evolución del ecosistema de Kashio, la gestión de requerimientos y su alineación con los OKR corporativos pasaron a ser responsabilidad de **KashioOS**, la plataforma central de gestión de portafolio de iniciativas.

Actualmente, ARIA utiliza un modelo **Stage-Gate** con seis gates (Gate 0: Intent → Gate 5: Value) para organizar la generación documental, y clasifica las iniciativas en dos tipos: **Run** (mantenimientos estándar) y **Change** (nuevas funcionalidades). La generación se basa en una librería de prompts, plantillas y documentos de contexto, y produce artefactos que se almacenan en un repositorio centralizado.

El proceso manual actual de generación documental presenta las siguientes fricciones:
- Inconsistencia en la estructura y nivel de detalle entre documentos de diferentes equipos y proyectos.
- Duplicación de esfuerzo al mantener iniciativas tanto en ARIA como en KashioOS.
- Dificultad para rastrear qué versión de un artefacto corresponde a qué estado de la iniciativa.
- Falta de alineación entre la clasificación de iniciativas en ARIA (Run/Change) y la de KashioOS (Change/New Product).

#### 3.3.2 Problemas u oportunidades detectadas

- **Problema 1 — Duplicación de gestión de iniciativas:** ARIA y KashioOS mantienen registros paralelos de iniciativas, generando riesgo de desalineación y esfuerzo redundante.  
- **Problema 2 — Desalineación de clasificaciones:** La tipificación Run/Change de ARIA no coincide con la tipificación Change/New Product de KashioOS, lo que dificulta la trazabilidad cruzada.  
- **Problema 3 — Modelo de fases obsoleto:** El modelo Stage-Gate de ARIA (6 gates) no se alinea con las fases del PDLC definidas en KashioOS (8 phases), creando confusión en la correspondencia de artefactos.  
- **Oportunidad 1 — Integración nativa:** Al integrar ARIA como módulo de KashioOS, se elimina la duplicación y se aprovecha la fuente única de verdad del portafolio de iniciativas.  
- **Oportunidad 2 — Clasificación por flujo de producto:** La nueva clasificación en tres flujos (Offering, Sellable, Non-Sellable) permite una matriz de aplicabilidad más precisa que la clasificación binaria anterior.  
- **Oportunidad 3 — Estandarización ampliada:** Con 36 tipos de artefactos configurables, ARIA 2.0 cubre el ciclo completo del PDLC, desde la investigación hasta el monitoreo.  

#### 3.3.3 Motivación estratégica

ARIA 2.0 contribuye directamente a los siguientes objetivos estratégicos de Kashio:

- **Eficiencia operativa:** Automatiza la generación documental, reduciendo el tiempo dedicado por los equipos de producto a tareas repetitivas y liberando capacidad para innovación.  
- **Gobernanza y trazabilidad:** Fortalece los controles de gobierno al asegurar que cada iniciativa del portafolio cuente con documentación estandarizada, versionada y auditable, alineándose con los marcos COBIT, ITIL y TOGAF.  
- **Consolidación de plataforma:** Al integrarse en KashioOS, ARIA 2.0 refuerza la visión de KashioOS como plataforma única para la gestión del ciclo de vida de producto, eliminando herramientas fragmentadas.  
- **Escalabilidad:** La parametrización de la matriz de aplicabilidad por flujo y fase permite escalar a nuevos productos y mercados sin rediseñar el proceso de documentación.  

Si ARIA 2.0 no se construyera, la organización enfrentaría una fragmentación creciente entre la gestión de iniciativas (KashioOS) y la generación documental (ARIA v1), con duplicación de datos, desalineación de clasificaciones y pérdida progresiva de trazabilidad.

---

## 4. Alcance y capacidades del producto

### 4.1 Alcance del producto
#### 4.1.1 Alcance (In-Scope)

El producto ARIA 2.0 en esta versión permitirá:

- **Integración con KashioOS vía APIs:** Consumir los datos de las iniciativas registradas en KashioOS (datos generales, clasificación, fase del PDLC) sin gestionar iniciativas internamente.  
- **Conservación de los cuatro módulos funcionales:**  
  - **ARIA Generation:** Generación documental contextualizada por fase e iniciativa.  
  - **Artefactos Generados:** Repositorio centralizado con historial completo de documentos producidos.  
  - **Librería de Fuentes:** Gestión de prompts, plantillas y documentos de contexto versionados, con operaciones de alta, modificación y eliminación.  
  - **Configuración de Artefactos:** Parametrización de la matriz de aplicabilidad por flujo de producto y fase del PDLC.  
- **Clasificación por tipo de flujo de producto:** Soporte a tres flujos (Offering, Sellable, Non-Sellable) que determinan qué artefactos documentales aplican para cada iniciativa.  
- **Adopción de las fases del PDLC de KashioOS:** Migración del modelo Stage-Gate (Gate 0 a Gate 5) a las 8 fases de KashioOS (Phase 1: Research → Phase 8: Monitoring).  
- **Mapeo de tipos de iniciativa:** Establecer la correspondencia entre la tipificación Run/Change de ARIA v1 y la tipificación Change/New Product de KashioOS.  
- **Generación de hasta 36 tipos de artefactos** distribuidos en las fases del PDLC, según la matriz de aplicabilidad por flujo.  
- **Versionado y control formal** de todos los artefactos generados, con trazabilidad completa.  
- **Usuarios internos:** Equipos de Product Management, Tecnología, Operaciones y stakeholders de negocio de Kashio.  

#### 4.1.2 Fuera de alcance (Out-of-Scope)

- **Gestión de iniciativas:** ARIA 2.0 no registrará, creará ni administrará iniciativas. Toda la gestión del portafolio de iniciativas permanece en KashioOS.  
- **Alineación con OKR corporativos:** La vinculación de iniciativas con objetivos estratégicos es responsabilidad exclusiva de KashioOS.  
- **Generación de documentos de Phase 1 (Research), Phase 4 (Frontend Development), Phase 6 (Testing) y Phase 8 (Monitoring):** Según el MAI, estas fases no tienen artefactos generados automáticamente por ARIA.  
- **Interfaz de usuario final para clientes externos:** ARIA 2.0 es un componente Non-Sellable de uso interno; no se contempla una experiencia de usuario orientada a clientes de Kashio.  
- **Exportación automática a Confluence:** Aunque existe funcionalidad de exportación en la configuración histórica de ARIA, su integración con ARIA 2.0 se evaluará en fases posteriores.  

### 4.2 Capacidades del producto
Las capacidades principales de ARIA 2.0 se organizan por módulo:

**C1 — Consumo de iniciativas desde KashioOS**  
El sistema consume vía API la información de las iniciativas registradas en KashioOS, incluyendo datos generales, clasificación (Change / New Product), tipo de flujo de producto (Offering, Sellable, Non-Sellable) y la fase del PDLC en la que se encuentran.

**C2 — Generación documental contextualizada (ARIA Generation)**  
El sistema genera los artefactos documentales correspondientes a cada fase del PDLC para una iniciativa dada, aplicando los prompts y plantillas configurados. La generación se ajusta automáticamente a la fase activa de la iniciativa y al flujo de producto, según la matriz de aplicabilidad.

**C3 — Gestión del repositorio de artefactos (Artefactos Generados)**  
El sistema almacena todos los documentos producidos en un repositorio centralizado con trazabilidad completa: historial de versiones, iniciativa asociada, fase de generación y fecha de creación.

**C4 — Gestión de la librería de fuentes (Librería de Fuentes)**  
El sistema permite gestionar los prompts, plantillas y documentos de contexto utilizados para la generación documental. Soporta operaciones de alta, modificación y eliminación de fuentes, manteniendo versionado y consistencia.

**C5 — Configuración de la matriz de aplicabilidad (Configuración de Artefactos)**  
El sistema permite parametrizar qué artefactos son obligatorios u opcionales para cada combinación de tipo de flujo de producto (Offering, Sellable, Non-Sellable) y fase del PDLC, controlando la generación documental de forma granular.

**C6 — Mapeo de fases PDLC**  
El sistema implementa la correspondencia entre los Gates del modelo Stage-Gate original de ARIA y las fases del PDLC de KashioOS, permitiendo migrar la configuración existente de artefactos documentales.

**C7 — Mapeo de tipos de iniciativa**  
El sistema establece y gestiona la correspondencia entre la tipificación de ARIA (Run/Change) y la de KashioOS (Change/New Product), asegurando coherencia en el flujo de generación documental.

**C8 — Control de dependencias entre artefactos**  
El sistema respeta y valida la cadena de dependencias definida en el MAI, asegurando que los artefactos de una fase se generen solo cuando sus dependencias de fases anteriores estén disponibles.

**C9 — Versionado de artefactos**  
El sistema aplica un esquema de versionado estándar (`v{Major}.{Minor}.{Patch}.{Build}`) a todos los artefactos generados, prompts y plantillas, permitiendo la selección automática de la versión más reciente.

---

## 5. Usuarios y personas
Los usuarios de ARIA 2.0 son exclusivamente **internos** de Kashio, dado que el producto se clasifica como Non-Sellable.

- **Persona 1 — Product Manager (PM):**  
  - Rol / perfil: Responsable de la definición y gestión del ciclo de vida de un producto o iniciativa en Kashio.  
  - Objetivos: Generar de forma rápida y estandarizada la documentación del PDLC para sus iniciativas, asegurando completitud y trazabilidad.  
  - Dolor actual: Dedica tiempo significativo a la redacción manual de documentos (PRD, SRS, USM, etc.), con inconsistencias entre proyectos y riesgo de omitir secciones obligatorias.  
  - Entorno de uso: Trabaja desde PC en oficina, accede a KashioOS y ARIA a través de la plataforma web.  

- **Persona 2 — Technical Product Owner (TPO):**  
  - Rol / perfil: Responsable de traducir los requisitos de producto en especificaciones técnicas y asegurar la alineación entre negocio y tecnología.  
  - Objetivos: Acceder a artefactos técnicos (SAD, SDD, APIs, Runbooks) generados de forma coherente con el PRD y el SRS, para alimentar el trabajo de los equipos de ingeniería.  
  - Dolor actual: Los documentos técnicos a veces no reflejan fielmente los requisitos definidos en el PRD, generando retrabajos y desalineación.  
  - Entorno de uso: Trabaja desde PC en oficina, accede a ARIA principalmente para consulta y validación de artefactos técnicos.  

- **Persona 3 — Arquitecto de Software:**  
  - Rol / perfil: Define la arquitectura técnica de los productos y valida que los artefactos de diseño sean consistentes.  
  - Objetivos: Contar con documentos SAD, SDD y arquitectura C4 generados con la estructura estándar de Kashio, que sirvan como base para revisiones técnicas.  
  - Dolor actual: La documentación de arquitectura varía en formato y profundidad entre proyectos, dificultando las revisiones cruzadas.  
  - Entorno de uso: Trabaja desde PC en oficina, consume artefactos generados por ARIA como insumo para decisiones de diseño.  

- **Persona 4 — Líder de Operaciones / Soporte:**  
  - Rol / perfil: Responsable de la operación estable de los productos en producción.  
  - Objetivos: Acceder a Runbooks (N1, N2, N3), guías de usuario, contingencias y procedimientos de killswitch generados de forma estandarizada para cada producto.  
  - Dolor actual: La documentación operativa no siempre está disponible o actualizada al momento del despliegue.  
  - Entorno de uso: Trabaja desde PC en oficina y accede a la documentación operativa durante incidentes o despliegues.  

---

## 6. Requisitos del producto

### 6.1 Requisitos funcionales (alto nivel)
| ID | Descripción (alto nivel) | Capacidad relacionada | Prioridad | Notas / Aclaraciones |
|---|---|---|---|---|
| RF_001 | El sistema debe consumir las iniciativas registradas en KashioOS a través de APIs, obteniendo datos generales, clasificación y fase del PDLC. | C1 | Alta | ARIA 2.0 no gestionará iniciativas de forma directa. |
| RF_002 | El sistema debe generar artefactos documentales aplicando los prompts y plantillas configurados para la fase e iniciativa correspondiente. | C2 | Alta | La generación se contextualiza con la información de la iniciativa consumida desde KashioOS. |
| RF_003 | El sistema debe clasificar cada iniciativa por tipo de flujo de producto (Offering, Sellable, Non-Sellable) y aplicar la matriz de aplicabilidad correspondiente. | C5 | Alta | Sustituye la tipificación actual Run/Change. |
| RF_004 | El sistema debe adoptar las 8 fases del PDLC de KashioOS (Phase 1 a Phase 8) en sustitución de los 6 Gates del modelo Stage-Gate original. | C6 | Alta | Correspondencia definida en el requerimiento: Gate 0→Phase 1, Gate 1→Phase 2, Gate 2→Phase 3, Gate 3→Phase 4/5/6, Gate 4→Phase 7, Gate 5→Phase 8. |
| RF_005 | El sistema debe establecer y mantener la correspondencia entre los tipos de iniciativa de ARIA (Run/Change) y los de KashioOS (Change/New Product). | C7 | Alta | Garantiza coherencia del flujo de generación documental. |
| RF_006 | El sistema debe almacenar todos los artefactos generados en un repositorio centralizado con trazabilidad de versión, iniciativa y fase. | C3 | Alta | Repositorio de consulta y auditoría. |
| RF_007 | El sistema debe permitir agregar, modificar y eliminar fuentes (prompts, plantillas, documentos de contexto) en la Librería de Fuentes. | C4 | Alta | Mantiene estandarización y versionado de fuentes. |
| RF_008 | El sistema debe permitir configurar qué artefactos son obligatorios u opcionales para cada combinación de flujo de producto y fase del PDLC. | C5 | Alta | Matriz de aplicabilidad parametrizable. |
| RF_009 | El sistema debe validar que las dependencias de un artefacto estén disponibles antes de iniciar su generación. | C8 | Alta | Sigue la cadena de dependencias del MAI. |
| RF_010 | El sistema debe versionar todos los artefactos generados con el formato estándar `v{Major}.{Minor}.{Patch}.{Build}`. | C9 | Alta | Permite selección automática de la versión más reciente. |
| RF_011 | El sistema debe generar los 5 artefactos de Phase 2 (Analysis): PRD, USM, SRS, Mapa de Capacidades, Funcionalidades. | C2 | Alta | Todos aplican para los tres flujos de producto. |
| RF_012 | El sistema debe generar los 4 artefactos de Phase 3 (Design): SAD, SDD, Arquitectura (C4+ADRs), Flujos (secuencia/BPMN). | C2 | Alta | Todos aplican para los tres flujos de producto. |
| RF_013 | El sistema debe generar el artefacto de Phase 5 (Backend): APIs/Contratos (OpenAPI/AsyncAPI). | C2 | Alta | Aplica para los tres flujos de producto. |
| RF_014 | El sistema debe generar los artefactos de Phase 7 (Deployment) que apliquen según el flujo de producto de la iniciativa. | C2, C5 | Alta | 26 artefactos totales; 22 aplican para Non-Sellable, 22 para Offering, 36 para Sellable. |
| RF_015 | El sistema debe respetar el orden de generación secuencial definido por la cadena de dependencias del MAI dentro de cada fase. | C8 | Media | P2.1→P2.2→P2.3→P2.4→P2.5, etc. |
| RF_016 | El sistema debe permitir la consulta del historial completo de artefactos generados por iniciativa, incluyendo versión y fecha de generación. | C3 | Media | Funcionalidad del módulo Artefactos Generados. |
| RF_017 | El sistema debe seleccionar automáticamente la versión más reciente de un prompt, plantilla o artefacto cuando existan múltiples versiones disponibles. | C9 | Media | Algoritmo de comparación por componentes Major > Minor > Patch > Build. |
| RF_018 | El sistema debe indicar explícitamente y detener la generación cuando una fuente obligatoria no esté disponible. | C8 | Alta | Comportamiento definido en el prompt del PRD. |
| RF_019 | El sistema debe soportar la generación de artefactos para los 22 documentos que aplican al flujo Non-Sellable según la matriz de aplicabilidad. | C2, C5 | Alta | Phases 2-5: 10 docs; Phase 7: 12 docs. |
| RF_020 | El sistema debe consumir exclusivamente iniciativas registradas en KashioOS como fuente única de verdad del portafolio. | C1 | Alta | ARIA ya no mantiene registro propio de iniciativas. |

### 6.2 Requisitos no funcionales
| ID | Categoría | Descripción | Prioridad | Notas |
|---|---|---|---|---|
| RNF_001 | Desempeño | La generación de un artefacto individual no debe superar los 120 segundos de tiempo de respuesta. | Alta | Dependiente del tamaño del contexto y complejidad del artefacto. |
| RNF_002 | Escalabilidad | El sistema debe soportar la generación concurrente de artefactos para al menos 50 iniciativas simultáneas sin degradación. | Alta | Alineado con el volumen actual de ~500 empresas clientes y crecimiento proyectado. |
| RNF_003 | Seguridad — Cifrado | Toda comunicación entre ARIA 2.0 y KashioOS debe utilizar cifrado en tránsito (TLS 1.2+). | Alta | Alineado con estándares Kashio. |
| RNF_004 | Seguridad — Datos en reposo | Los artefactos almacenados y las fuentes de la librería deben estar cifrados en reposo (KMS). | Alta | Cumplimiento de políticas de seguridad corporativas. |
| RNF_005 | Cumplimiento — GDPR | El sistema no debe almacenar datos personales en los artefactos generados a menos que sea estrictamente necesario y esté documentado en el PRD de la iniciativa. | Alta | Aplica a documentos que puedan contener información de clientes. |
| RNF_006 | Cumplimiento — PCI DSS | Los artefactos relacionados con procesos de pago deben cumplir con las directrices de PCI DSS en cuanto a no incluir datos de tarjeta en texto plano. | Alta | Relevante para artefactos de productos financieros. |
| RNF_007 | Disponibilidad | El sistema debe mantener una disponibilidad mínima del 99.5% en horario laboral (lunes a viernes, 9:00 a 18:00 hora local). | Media | No se requiere alta disponibilidad 24/7 dado que es herramienta interna. |
| RNF_008 | Integrabilidad | Las APIs de consumo de KashioOS deben seguir estándares RESTful y documentarse con OpenAPI 3.0+. | Alta | Facilita la integración y el mantenimiento. |
| RNF_009 | Trazabilidad | Cada operación de generación debe registrar un log auditable que incluya: usuario, iniciativa, artefacto, versión de prompts/plantillas utilizados, timestamp y resultado. | Alta | Alineado con COBIT (trazabilidad y controles). |
| RNF_010 | Versionado | El sistema de versionado debe seguir el formato `v{Major}.{Minor}.{Patch}.{Build}` de forma consistente en todos los componentes. | Alta | Aplica a artefactos, prompts, plantillas y configuraciones. |
| RNF_011 | Compatibilidad | ARIA 2.0 debe ser compatible con la arquitectura de microservicios de Kashio (EKS, SQS, S3, RDS). | Alta | Integración con el stack tecnológico existente. |
| RNF_012 | Mantenibilidad | La configuración de la matriz de aplicabilidad y las fuentes documentales debe poder actualizarse sin necesidad de desplegar código nuevo. | Media | Cambios de configuración hot-reload o vía panel de administración. |
| RNF_013 | Usabilidad | La interfaz de generación debe requerir un máximo de 3 pasos para iniciar la generación de un artefacto para una iniciativa dada. | Media | Reducción de fricciones en la experiencia del usuario interno. |
| RNF_014 | Observabilidad | El sistema debe integrarse con las herramientas de monitoreo corporativas (Sentry, Prometheus, Grafana) para métricas de rendimiento y alertas de error. | Media | Alineado con el stack de observabilidad de Kashio. |
| RNF_015 | Gestión de cambios — ITIL | Toda actualización de prompts, plantillas o configuración de la matriz de aplicabilidad debe seguir el proceso de gestión de cambios definido en ITIL, incluyendo registro, aprobación y validación. | Media | Alineado con el marco ITIL de Kashio. |
| RNF_016 | Arquitectura — TOGAF | Los artefactos generados y la arquitectura de ARIA 2.0 deben ser compatibles con el ciclo ADM de TOGAF, generando documentación utilizable en las fases de visión de arquitectura, arquitectura de negocio y planificación de migración. | Media | Alineación con el marco de arquitectura empresarial. |
| RNF_017 | DevSecOps | El pipeline CI/CD de ARIA 2.0 debe incluir controles de seguridad automatizados (SAST, análisis de dependencias). | Media | Alineado con prácticas DevSecOps de Kashio. |

---

## 7. Flujos de usuario (alto nivel)
### 7.1 Flujo principal

- **Flujo 1 — Generación de artefacto para una iniciativa:**  
  1. El usuario (PM/TPO) accede al módulo ARIA Generation dentro de KashioOS.  
  2. Selecciona la iniciativa para la cual desea generar documentación (la lista se obtiene vía API desde KashioOS).  
  3. El sistema muestra la fase actual de la iniciativa y los artefactos disponibles/pendientes según la matriz de aplicabilidad del flujo de producto.  
  4. El usuario selecciona el artefacto a generar (o solicita generación por lote de la fase completa).  
  5. ARIA Generation valida que las dependencias del artefacto estén disponibles.  
  6. Si las dependencias se cumplen, ARIA Generation aplica el prompt y la plantilla correspondientes, contextualiza con las fuentes de la Librería y la información de la iniciativa.  
  7. El artefacto generado se almacena en el repositorio de Artefactos Generados con su versión, metadata y timestamp.  
  8. El usuario puede revisar, descargar o solicitar regeneración del artefacto.  

### 7.2 Flujos alternativos

- **Flujo 2 — Gestión de fuentes en la Librería:**  
  1. El usuario (PM/Admin) accede al módulo Librería de Fuentes.  
  2. Selecciona la operación deseada: agregar nueva fuente, modificar una existente o eliminar una obsoleta.  
  3. Para agregar o modificar, carga el archivo (prompt, plantilla o documento de contexto) y asigna la versión correspondiente.  
  4. El sistema valida el formato de nomenclatura y versionado.  
  5. La fuente queda disponible para su uso en la generación documental.  

- **Flujo 3 — Configuración de la matriz de aplicabilidad:**  
  1. El usuario (Admin) accede al módulo de Configuración de Artefactos.  
  2. Selecciona un artefacto y un flujo de producto.  
  3. Define si el artefacto es obligatorio, opcional o no aplica para esa combinación de flujo y fase.  
  4. Guarda la configuración, que entra en vigor para las próximas generaciones.  

### 7.3 Escenarios extremos / excepciones

- **Dependencia faltante:** Si un artefacto requerido como dependencia no ha sido generado aún, el sistema muestra un mensaje explícito indicando qué artefactos deben generarse primero, junto con la cadena de dependencias.  
- **Fuente no disponible:** Si un prompt o plantilla marcado como activo no se encuentra en la librería, el sistema detiene la generación y registra un error con la fuente faltante.  
- **API de KashioOS no disponible:** Si la API de KashioOS no responde, el sistema muestra un mensaje de indisponibilidad temporal y permite reintentar la operación.  
- **Versión de fuente obsoleta:** Si la versión activa de un prompt o plantilla ha sido marcada como obsoleta pero no se ha configurado una nueva versión activa, el sistema alerta al administrador.  

---

## 8. Métricas y criterios de éxito
- **Nombre de la métrica:** Tiempo promedio de generación de artefacto  
  - **Definición exacta:** Tiempo promedio (en segundos) desde la solicitud de generación hasta la disponibilidad del artefacto en el repositorio, medido en un período de 30 días.  
  - **Fuente de verdad:** Logs de ARIA Generation  
  - **Meta / umbral de éxito:** ≤ 90 segundos promedio; ≤ 120 segundos en el percentil 95  

- **Nombre de la métrica:** Tasa de completitud documental  
  - **Definición exacta:** (Artefactos obligatorios generados / Artefactos obligatorios requeridos según el flujo) × 100, por iniciativa.  
  - **Fuente de verdad:** Módulo de Configuración de Artefactos + Artefactos Generados  
  - **Meta / umbral de éxito:** ≥ 95% promedio en iniciativas que alcancen Phase 7  

- **Nombre de la métrica:** Tasa de adopción por equipos de producto  
  - **Definición exacta:** (Iniciativas nuevas en KashioOS que usan ARIA 2.0 / Total de iniciativas nuevas) × 100, en un período de 30 días.  
  - **Fuente de verdad:** KashioOS + ARIA Generation  
  - **Meta / umbral de éxito:** ≥ 80% a los 6 meses post-lanzamiento  

- **Nombre de la métrica:** NPS interno de usuarios de ARIA 2.0  
  - **Definición exacta:** Net Promoter Score obtenido a partir de encuestas trimestrales a los Product Managers y TPOs que utilizan el sistema.  
  - **Fuente de verdad:** Encuestas internas  
  - **Meta / umbral de éxito:** ≥ 40 (buen nivel de satisfacción interna)  

- **Nombre de la métrica:** Tasa de artefactos sin correcciones manuales mayores  
  - **Definición exacta:** Porcentaje de artefactos generados que no requieren más de 2 correcciones manuales de estructura o contenido antes de ser aprobados por el PM.  
  - **Fuente de verdad:** Feedback de Product Managers (registro en formulario post-generación)  
  - **Meta / umbral de éxito:** ≥ 90%  

---

## 9. Dependencias y supuestos
### 9.1 Dependencias

- **KashioOS — APIs de iniciativas:** ARIA 2.0 depende de que KashioOS exponga APIs para consumir datos de las iniciativas (datos generales, clasificación, fase del PDLC). Sin estas APIs, ARIA 2.0 no puede operar.  
- **Equipo de Tecnología / Arquitectura:** Se requiere la definición de contratos de API entre ARIA 2.0 y KashioOS antes de iniciar el desarrollo de la integración.  
- **Equipo de Product Management:** Debe validar y aprobar la matriz de aplicabilidad de artefactos por flujo de producto, y proporcionar las fuentes de contexto (prompts, plantillas) actualizadas.  
- **Infraestructura AWS:** ARIA 2.0 se desplegará sobre la infraestructura existente de Kashio (EKS, S3, RDS), requiriendo aprovisionamiento de recursos adicionales.  
- **Master Artifact Inventory (MAI):** La cadena de dependencias entre artefactos definida en el MAI es insumo crítico para la configuración del módulo de Configuración de Artefactos.  
- **Herramientas de observabilidad:** Integración con Sentry, Prometheus y Grafana para monitoreo y alertas.  

### 9.2 Supuestos

- Se asume que KashioOS tendrá las APIs de iniciativas disponibles y documentadas antes del inicio del desarrollo de ARIA 2.0.  
- Se asume que los tipos de iniciativa en KashioOS (Change y New Product) son los únicos tipos existentes al momento de la integración.  
- Se asume que los prompts y plantillas actuales (36 prompts, 35 plantillas) serán migrados al nuevo formato sin cambios funcionales significativos en la primera versión.  
- Se asume que el volumen de generación documental no superará las 500 generaciones diarias en el primer año de operación.  
- Se asume que los usuarios internos tienen acceso a KashioOS y cuentan con los permisos necesarios para interactuar con el módulo ARIA.  
- Se asume que la infraestructura AWS actual tiene capacidad suficiente para soportar los componentes adicionales de ARIA 2.0 sin requerir una ampliación mayor de infraestructura.  

---

## 10. Riesgos y mitigaciones
| Riesgo ID | Descripción | Probabilidad | Impacto | Mitigación propuesta |
|---|---|---|---|---|
| R_001 | Retraso en la disponibilidad de las APIs de KashioOS para consumo de iniciativas. | Media | Alto | Definir contratos de API (OpenAPI spec) de forma temprana y desarrollar un mock de la API para avanzar en paralelo. |
| R_002 | Incompatibilidad entre la clasificación de iniciativas de ARIA (Run/Change) y KashioOS (Change/New Product) que genere casos no mapeados. | Baja | Alto | Documentar exhaustivamente el mapeo de tipos y validar con casos reales antes del lanzamiento. Implementar un flujo de escalación para casos no mapeados. |
| R_003 | Resistencia de los equipos de producto a adoptar ARIA 2.0 por cambio de flujo de trabajo respecto a ARIA v1. | Media | Medio | Plan de comunicación y training temprano. Involucrar a PMs piloto en el diseño de la experiencia de usuario. |
| R_004 | Calidad insuficiente de los artefactos generados para algunos tipos de documentos, requiriendo retrabajos excesivos. | Media | Medio | Programa de validación piloto con 3-5 iniciativas reales antes del lanzamiento general. Iteración continua sobre prompts y plantillas. |
| R_005 | Pérdida de trazabilidad durante la migración del modelo Stage-Gate a las fases del PDLC de KashioOS. | Baja | Alto | Crear un plan de migración detallado con verificación de correspondencia Gate↔Phase para todos los artefactos históricos. |
| R_006 | Dependencia excesiva en la disponibilidad de KashioOS; si KashioOS está caído, ARIA 2.0 no puede operar. | Media | Alto | Implementar caché local de la información de iniciativas con TTL configurable para operación degradada. |
| R_007 | Crecimiento no anticipado en el volumen de generaciones que exceda la capacidad de infraestructura aprovisionada. | Baja | Medio | Diseñar la arquitectura con escalado horizontal (Kubernetes HPA) y monitorear métricas de consumo. |

---

## 11. Roadmap de alto nivel
| Fase | Nombre / Enfoque | Fecha estimada | Alcance principal |
|---|---|---|---|
| 1 | MVP — Integración base y generación core | [PENDIENTE: Falta definir fecha] | Integración con APIs de KashioOS, módulo ARIA Generation con soporte para Phase 2 y Phase 3, clasificación por flujo de producto (Offering, Sellable, Non-Sellable), repositorio de Artefactos Generados. |
| 2 | Expansión — Cobertura completa del PDLC | [PENDIENTE: Falta definir fecha] | Generación de artefactos de Phase 5 y Phase 7 (Deployment), Librería de Fuentes con gestión CRUD, Configuración de Artefactos parametrizable. |
| 3 | Optimización — Calidad y adopción | [PENDIENTE: Falta definir fecha] | Mejora de prompts basada en feedback de usuarios, optimización de tiempos de generación, dashboards de adopción y métricas, integración con observabilidad (Prometheus/Grafana). |

[NOTA: Las fechas estimadas para cada fase deben ser definidas por el Product Manager en coordinación con el equipo de Tecnología y la Dirección de FinOps VAR.]

---

## 12. Gobernanza y versionado
### 12.1 Gobernanza del PRD

- **Responsable del PRD:** Product Manager — Proyecto ARIA  
- **Quién aprueba cambios de alcance:** Dirección de FinOps VAR, Product Owner, Arquitecto Técnico  
- **Frecuencia de revisión del PRD:** Antes de cada fase del roadmap y ante cambios significativos de alcance  
- **Dónde se almacena la versión oficial:** `output/ARIA 2.0/PRD_ARIA_2.0_v1.0.0.0.md`  
- **Cómo se comunican cambios relevantes:** Notificación a stakeholders vía canal del proyecto, actualización en KashioOS  

### 12.2 Historial de cambios

| Fecha | Versión | Autor | Descripción del cambio |
|---|---|---|---|
| 2026-04-08 | v1.0.0.0 | ARIA (generado) | Creación inicial del PRD de ARIA 2.0, flujo Non-Sellable |

### 12.3 Aprobaciones

| Fecha | Nombre | Rol | Firma |
|---|---|---|---|
| [PENDIENTE] | [Nombre] | Product Owner | |
| [PENDIENTE] | [Nombre] | Arquitecto Técnico | |
| [PENDIENTE] | [Nombre] | Director de FinOps VAR | |

---

## Preguntas Abiertas / Próximos Pasos

Las siguientes preguntas deben ser resueltas por el equipo de producto para completar y refinar este PRD:

1. **APIs de KashioOS:** ¿Cuáles son los endpoints específicos que KashioOS expondrá para que ARIA 2.0 consuma la información de las iniciativas? ¿Existe ya una especificación OpenAPI disponible?  
2. **Mapeo de tipos de iniciativa:** ¿Cuál es la correspondencia exacta y validada entre Run/Change de ARIA y Change/New Product de KashioOS? ¿Existen tipos de iniciativa adicionales en KashioOS que no estén contemplados?  
3. **Cronograma:** ¿Cuáles son las fechas objetivo para las fases del roadmap (MVP, Expansión, Optimización)?  
4. **Migración de datos históricos:** ¿Se requiere migrar los artefactos generados por ARIA v1 al repositorio de ARIA 2.0, o se mantendrán como archivo separado?  
5. **Flujo Non-Sellable específico:** ¿Existen consideraciones adicionales para el flujo Non-Sellable que difieran de lo documentado en la matriz de aplicabilidad actual (22 documentos)?  
6. **Integración con Confluence:** ¿Se contempla la exportación automática a Confluence como parte de ARIA 2.0 o se mantiene como funcionalidad separada?  
7. **Autenticación y autorización:** ¿ARIA 2.0 utilizará el mismo sistema de autenticación que KashioOS (SSO, OAuth2) o tendrá un esquema propio?  
8. **Límites de generación:** ¿Se establecerán cuotas o límites de generación por usuario o por equipo?  
9. **BPRD del producto:** No se proporcionó un BPRD formal para ARIA 2.0; el documento de Descripción de Requerimiento se utilizó como fuente principal. ¿Se requiere la elaboración de un BPRD formal?  

---

*PRD de Producto — ARIA 2.0 — Versión v1.0.0.0 — Generado con Plantilla Kashio PRD v1.2.0.0*
