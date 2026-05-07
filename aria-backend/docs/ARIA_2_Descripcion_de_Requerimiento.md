# ARIA 2.0 - Descripción del Requerimiento
## Antecedentes
ARIA (AI-Ready Information Architecture) fue concebido como un marco de gobierno del Product Development Lifecycle (PDLC) cuyo propósito es transformar el ciclo de vida del producto en un flujo medible de creación de valor —desde la estrategia hasta la operación— gobernando capacidad, riesgo, dependencias e impacto. Bajo esta visión, ARIA estandariza el ciclo completo de producto de punta a punta, conecta las fases de Estrategia, Producto, Ingeniería y Operación, asegura trazabilidad, versionado y control formal de los artefactos, e integra la inteligencia artificial como acelerador sin reemplazar el criterio experto. En su primera versión, ARIA abarcó tanto la gestión de requerimientos como la generación automatizada de los documentos asociados al PDLC, operando como un sistema integral e independiente.

Con la evolución del ecosistema de Kashio, la gestión de requerimientos y su alineación con los OKR corporativos pasaron a ser responsabilidad del sistema KashioOS. Esto redefine el alcance de ARIA: en su nueva versión, ARIA se enfocará exclusivamente en la generación y el gobierno documental de las iniciativas registradas en KashioOS, funcionando como un módulo independiente dentro de dicha plataforma. De esta manera, ARIA 2.0 complementa a KashioOS aportando la capa de generación, versionado y control de los artefactos del PDLC, mientras KashioOS mantiene la gestión centralizada del portafolio de iniciativas y su trazabilidad estratégica.

## Objetivo
Integrar ARIA como módulo independiente dentro de KashioOS, concentrando su alcance en la generación, versionado y gobierno de los artefactos documentales del PDLC para las iniciativas gestionadas en la plataforma. ARIA 2.0 debe operar de forma complementaria a KashioOS, consumiendo la información de las iniciativas a través de APIs y proporcionando la capa documental que asegure trazabilidad, control formal y consistencia a lo largo de todo el ciclo de vida del producto.

## Módulos de ARIA a integrar con KashioOS
De los módulos que componen la versión actual de ARIA, se conservarán los cuatro que sostienen la capacidad de generación y gobierno documental. Cada uno cumple un rol específico dentro del flujo de creación de artefactos del PDLC:

1. **ARIA Generation.** Módulo central de generación documental. Permite producir los artefactos correspondientes a cada fase del ciclo de vida de una iniciativa, aplicando los prompts y plantillas configurados para cada caso. Las iniciativas se clasifican por tipo —Run para mantenimientos estándar o Change para nuevas funcionalidades— y los documentos se generan según la distribución por Gates del modelo Stage-Gate de ARIA, que abarca desde el Gate 0 hasta el Gate 5. ARIA tiene configurados los artefactos que corresponden a cada Gate, de modo que la generación se ajusta a la fase en la que se encuentra la iniciativa.

2. **Artefactos Generados.** Librería centralizada que almacena todos los documentos producidos a lo largo de las distintas iniciativas. Funciona como repositorio de consulta y trazabilidad, permitiendo acceder al historial completo de artefactos generados, su versión y la iniciativa a la que pertenecen.

3. **Librería de Fuentes.** Repositorio que contiene los prompts, las plantillas y los documentos de contexto adicionales que el usuario considere necesarios para la generación de los documentos del ciclo de vida de una iniciativa. Este módulo asegura la estandarización y consistencia de los artefactos al mantener una fuente única y versionada de las instrucciones, estructuras y referencias de generación. Desde la Librería de Fuentes es posible agregar nuevas fuentes, modificar las existentes o eliminarlas.

4. **Configuración de Artefactos.** Módulo de parametrización que define qué documentos base se requieren para generar cada artefacto del ciclo de vida de una iniciativa. Permite configurar la matriz de aplicabilidad por tipo de iniciativa y por Gate, controlando qué artefactos son obligatorios y cuáles opcionales en cada fase del PDLC.

## Requerimientos
1. **Comunicación con KashioOS a través de APIs.** ARIA 2.0 no gestionará iniciativas de forma directa; toda la información de las iniciativas será consumida desde KashioOS mediante APIs. Esto incluye los datos generales de la iniciativa, su clasificación y la fase del ciclo de vida en la que se encuentra, de modo que ARIA pueda contextualizar la generación documental sin duplicar la gestión que ya reside en KashioOS.

2. **Origen de las iniciativas en KashioOS.** Las iniciativas para las cuales ARIA generará documentos serán exclusivamente las que estén registradas en KashioOS. ARIA ya no mantendrá un registro propio de iniciativas; la plataforma KashioOS será la fuente única de verdad sobre el portafolio de iniciativas y su alineación con los OKR corporativos.

3. **Clasificación por tipo de flujo de producto.** En ARIA 2.0, cada iniciativa deberá indicar el tipo de flujo de producto que seguirá: Offering, Vendible (Sellable) o No Vendible (Non-Sellable). Esta clasificación determina qué artefactos documentales aplican para la iniciativa según la matriz de aplicabilidad definida en el módulo de Configuración de Artefactos, y sustituye la tipificación actual de ARIA basada en Run y Change.

4. **Mapeo de tipos de iniciativa entre ARIA y KashioOS.** En la versión actual de ARIA, las iniciativas se clasifican como Run (mantenimientos estándar) o Change (nuevas funcionalidades). En KashioOS, los tipos de iniciativa son Change (modificación o mejora de un producto existente) y New Product (producto nuevo que involucra el ciclo completo de generación de documentos). ARIA 2.0 deberá establecer la correspondencia entre ambas tipificaciones para garantizar que el flujo de generación documental se aplique de manera coherente con la clasificación definida en KashioOS.

5. **Conservación de los cuatro módulos actuales.** ARIA 2.0 conservará los cuatro módulos descritos en la sección anterior —ARIA Generation, Artefactos Generados, Librería de Fuentes y Configuración de Artefactos— como base funcional del sistema. Las capacidades actuales de cada módulo se mantendrán y se adaptarán para operar dentro de KashioOS.

6. **Integración y adaptación de los módulos a KashioOS.** Los cuatro módulos deberán integrarse con KashioOS adaptando su funcionalidad al nuevo contexto operativo. Esto implica que ARIA Generation consuma las iniciativas desde KashioOS vía API en lugar de gestionarlas internamente, que Artefactos Generados y Librería de Fuentes se vinculen con la estructura de datos de KashioOS, y que Configuración de Artefactos soporte la nueva clasificación por tipo de flujo de producto (Offering, Sellable, Non-Sellable) junto con las fases del PDLC definidas en KashioOS.

7. **Sustitución de Gates por fases del PDLC de KashioOS.** ARIA 2.0 dejará de utilizar la distribución por Gates del modelo Stage-Gate original de ARIA —Gate 0: Intent, Gate 1: Scope, Gate 2: Design, Gate 3: Build, Gate 4: Release, Gate 5: Value— y adoptará en su lugar las fases del PDLC definidas en KashioOS: Phase 1: Research, Phase 2: Analysis, Phase 3: Design, Phase 4: Frontend Development, Phase 5: Backend Development, Phase 6: Testing, Phase 7: Deployment y Phase 8: Monitoring. La correspondencia entre ambas estructuras es la siguiente:

   | Gate original de ARIA | Fase(s) del PDLC en KashioOS |
   |---|---|
   | Gate 0 – Intent | Phase 1 – Research |
   | Gate 1 – Scope | Phase 2 – Analysis |
   | Gate 2 – Design | Phase 3 – Design |
   | Gate 3 – Build | Phase 4 – Frontend Development, Phase 5 – Backend Development y Phase 6 – Testing |
   | Gate 4 – Release | Phase 7 – Deployment |
   | Gate 5 – Value | Phase 8 – Monitoring |

   Esta correspondencia servirá como base para migrar la configuración de artefactos documentales que actualmente está asociada a cada Gate hacia las fases equivalentes de KashioOS.