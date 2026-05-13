# Inventario de Artefactos ARIA / KashioOS

> Conversión del inventario tipo Excel a formato Markdown. La información se mantiene intacta y se organiza con las mismas columnas del archivo original para facilitar lectura, revisión y mantenimiento.

## Columnas

| Campo | Descripción |
|---|---|
| ART-ID | Identificador del artefacto dentro del inventario ARIA. |
| CANONICAL_ID | Identificador canónico del artefacto. |
| Nombre | Nombre funcional o técnico del artefacto. |
| Estado | Estado del artefacto: Active, inactive o deprecated. |
| Disponibilidad | Disponibilidad actual del artefacto. |
| Validación | Estado de validación del artefacto. |
| Área | Área responsable o dominio funcional. |
| Fecha de Desarrollo | Fecha de desarrollo registrada. |
| Responsable | Persona responsable. |
| Orden | Orden secuencial dentro del flujo PDLC. |
| Dependencia | Artefactos o insumos requeridos. |
| Owner (Rol) | Rol dueño del artefacto. |
| Tipo de Iniciativa | Run / New. |
| Tipo de Producto | Offering / Sellable / Non-Sellable. |
| Fase KashioOS | Fase PDLC KashioOS correspondiente. |
| Link Documento | Plantilla o artefacto asociado. |
| Link Prompt | Prompt asociado. |
| Release Pack | Pack Commercial / Operations / Finance / Customer / None. |
| ¿En ARIA? | Indica si aplica dentro de ARIA. |
| ¿Flujo Producto Vendible? | Aplicabilidad al flujo de producto vendible. |
| ¿Flujo Producto No Vendible? | Aplicabilidad al flujo de producto no vendible. |
| ¿Flujo Offering? | Aplicabilidad al flujo de offering. |
| Notas | Observaciones adicionales. |

---

## Inventario completo

| ART-ID | CANONICAL_ID | Nombre | Estado | Disponibilidad | Validación | Área | Fecha de Desarrollo | Responsable | Orden | Dependencia | Owner (Rol) | Tipo de Iniciativa | Tipo de Producto | Fase KashioOS | Link Documento (Plantilla o artefacto) | Link Prompt | Release Pack | ¿En ARIA? | ¿Flujo para Producto Vendible? | ¿Flujo para Producto No Vendible? | ¿Flujo para Offering? | Notas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ART-REC-PRD-PRD-001 | REC-PRD-PRD-001 | PRD (Product Requirements Document) | Active | Listo | Validado | Producto | 10/02/2026 | Paul | P2.1 | Market Research PRD<br>Service Blueprint PRD<br>Benchmark Competitivo<br>Regulaciones (por país/rail)<br>Tendencias & Insights de mercado<br>Visión de Producto | Product Manager / TPO | Run / New | Offering / Sellable / Non-Sellable | Phase 2: Analysis | Plantilla_PRD_Producto_v1.2.0.0.md | Prompt_PRD_Producto_v1.0.0.0.md | None | Sí | Sí | Sí | Sí |  |
| ART-REC-GOV-EPICMAP-001 | REC-GOV-EPICMAP-001 | (USM) Epics & Release Stories Map | Active | Listo | Validado | SDLC | 13/02/2024 | Paul | P2.2 | PRD<br>BPRD (Opcional) | Product Manager / TPO | Run / New | Offering / Sellable / Non-Sellable | Phase 2: Analysis | Plantilla_USM_Inicial_1.0.0.6.md | Prompt_USM_Inicial_v1.0.0.0.md | None | Sí | Sí | Sí | Sí |  |
| ART-REC-TEC-SRS-001 | REC-TEC-SRS-001 | SRS / Spec Funcional + NFR | Active | Listo | Validado | SDLC | 12/02/2026 | Paul | P2.3 | PRD<br>BPRD(Opcional)<br>(USM) Epics & Release Stories Map (Opcional) | Product Manager / TPO | Run / New | Offering / Sellable / Non-Sellable | Phase 2: Analysis | Plantilla Kashio SRS 1.0.0.5.md | Prompt_SRS_v1.0.0.3.md | None | Sí | Sí | Sí | Sí |  |
| ART-REC-TEC-CAP-001 | REC-TEC-CAP-001 | Mapa de Capacidades | Active | Listo | Validado | Producto Técnico |  |  | P2.4 | PRD<br>BPRD (opcional)<br>(USM) Epics & Release Stories Map | Solution Architect | Run / New | Offering / Sellable / Non-Sellable | Phase 2: Analysis | Plantilla_capacidades_v1.1.0.0.md | Prompt_capacidades_v1.1.0.3.md | None | Sí | Sí | Sí | Sí |  |
| ART-REC-TEC-FEAT-001 | REC-TEC-FEAT-001 | Funcionalidades (catálogo) | Active | Listo | Validado | Producto Técnico |  |  | P2.5 | PRD<br>BPRD (opcional)<br>(USM) Epics & Release Stories Map<br>SRS / Spec Funcional + NFR | Product Manager / TPO | Run / New | Offering / Sellable / Non-Sellable | Phase 2: Analysis | Plantilla_funcionalidades_V1.0.0.0.md | Prompt_funcionalidades_v1.1.0.0.md | None | Sí | Sí | Sí | Sí |  |
| ART-REC-TEC-SAD-001 | REC-TEC-SAD-001 | SAD | Active | Listo | Validado | SDLC |  | Paul | P3.1 | PRD<br>(USM) Epics & Release Stories Map<br>SRS / Spec Funcional + NFR |  | Run / New | Offering / Sellable / Non-Sellable | Phase 3: Design | Plantilla Kashio SAD 1.0.0.5.md | Prompt_SAD_v1.0.0.3.md | None | Sí | Sí | Sí | Sí |  |
| ART-REC-TEC-SDD-001 | REC-TEC-SDD-001 | SDD | Active | Listo | Validado | SDLC |  | Paul | P3.2 | PRD<br>(USM) Epics & Release Stories Map<br>SRS / Spec Funcional + NFR<br>SAD |  | Run / New | Offering / Sellable / Non-Sellable | Phase 3: Design | Plantilla Kashio SDD 1.0.0.5.md | Prompt_SDD_v1.0.0.3.md | None | Sí | Sí | Sí | Sí |  |
| ART-REC-TEC-ARCH-001 | REC-TEC-ARCH-001 | Arquitectura (C4 + ADRs) | Active | Listo | Validado | Producto Técnico |  |  | P3.3 | PRD<br>SAD | Solution Architect | Run / New | Offering / Sellable / Non-Sellable | Phase 3: Design | Plantilla_arquitectura_v1.0.0.0.md | Prompt_arquitectura_v1.1.0.0.md | None | Sí | Sí | Sí | Sí |  |
| ART-REC-TEC-FLOWS-001 | REC-TEC-FLOWS-001 | Flujos (secuencia / BPMN) | Active | Listo | Validado | Producto Técnico |  |  | P3.4 | PRD<br>(USM) Epics & Release Stories Map<br>SRS / Spec Funcional + NFR<br>SAD<br>SDD | UX Lead | Run / New | Offering / Sellable / Non-Sellable | Phase 3: Design | Plantilla_flujo_v1.0.0.0.md | Prompt_flujos_v1.1.0.0.md | None | Sí | Sí | Sí | Sí |  |
| ART-REC-TEC-API-001 | REC-TEC-API-001 | APIs / Contratos (OpenAPI/AsyncAPI) | Active | Listo | Validado | Producto Técnico |  |  | P5.1 | SRS / Spec Funcional + NFR<br>SAD<br>SDD | Solution Architect | Run / New | Offering / Sellable / Non-Sellable | Phase 5: Backend Dev | Plantilla_api_v1.0.0.0.md | Prompt_api_v1.1.0.0.md | None | Sí | Sí | Sí | Sí |  |
| ART-LIB-MKT-STRAT-001 | LIB-MKT-STRAT-001 | Product Marketing Strategy | Active | Listo | Validado | Producto - Marketing |  | Kentaro | P7.1 | Competitive Landscape, Tendencias, regulaciones |  | New | Offering / Sellable | Phase 7: Deployment |  | Prompt_ProductMarketingStrategy_v.1.000.md |  | Sí | Sí | No | Sí |  |
| ART-REC-FIN-COGS-001 | REC-FIN-COGS-001 | Impacto COGS | Active | Listo | Por Validar | Finanzas | 12/02/2026 | Kentaro | P7.2 | PRD<br>Mapa de Capacidades<br>Funcionalidades (catálogo)<br>APIs / Contratos (OpenAPI/AsyncAPI) | Finance Lead | Run / New | Sellable | Phase 7: Deployment | Plantilla_Impacto_COGS_v1.0.0.0.md | Prompt_Impacto_COGS_v1.0.0.0.md | Finance | Sí | Sí | No | No |  |
| ART-REC-FIN-FREP-001 | REC-FIN-FREP-001 | Reportes financieros requeridos | Active | Listo | Por Validar | Finanzas | 12/02/2026 | Kentaro | P7.3 | PRD<br>Mapa de Capacidades<br>Funcionalidades (catálogo)<br>APIs / Contratos (OpenAPI/AsyncAPI) | Finance Lead | New | Sellable | Phase 7: Deployment | Plantilla_Reportes_Financieros_Requeridos_v1.0.0.0.md | Prompt_Reportes_Financieros_Requeridos_v1.0.0.0.md | Finance | Sí | Sí | No | No |  |
| ART-REC-OPS-RUNBOOKN1-001 | REC-OPS-RUNBOOKN1-001 | Runbook N1 | Active | Listo | En Validación | Operaciones | 11/02/2026 | Paul | P7.4 | PRD<br>Funcionalidades (catálogo)<br>Flujos (secuencia / BPMN) | Ops Lead (N1/N2/N3) | Run / New | Offering / Sellable / Non-Sellable | Phase 7: Deployment | Plantilla_Runbook_N1_v1.0.0.0.md | Prompt_Runbook_Nivel_1_v1_0_0_3.md | Operations | Sí | Sí | Sí | Sí |  |
| ART-LIB-MKT-OBJ-001 | LIB-MKT-OBJ-001 | Manejo de Objeciones | Active | Listo | Validado | Comercial |  | Kentaro | P7.5 | Funcionalidades (catálogo)<br>APIs / Contratos (OpenAPI/AsyncAPI) | Product Marketing | New | Sellable | Phase 7: Deployment | Artefacto_Manejo_de_Objeciones.md | Prompt_Manejo_de_Objeciones_Producto_v1.0.0.0.md | Commercial | Sí | Sí | No | No |  |
| ART-REC-CUS-UGUIDE-001 | REC-CUS-UGUIDE-001 | Guía de Usuario | Active | Listo | Por Validar | Cliente - Operaciones | 09/02/2026 | Kentaro | P7.6 | PRD<br>Mapa de Capacidades<br>Funcionalidades (catálogo) | Product Manager / TPO | New | Offering / Sellable / Non-Sellable | Phase 7: Deployment | Plantilla_Guia_Usuario_v1.0.0.0.md | Prompt_Guia_Usuario_v1.0.0.0.md | Customer | Sí | Sí | Sí | Sí |  |
| ART-LIB-MKT-ONEP-001 | LIB-MKT-ONEP-001 | One-pager | Active | Listo | Validado | Comercial |  | Kentaro | P7.7 | Mapa de Capacidades<br>Funcionalidades (catálogo)<br>Arquitectura (C4 + ADRs) | Product Marketing | New | Offering / Sellable | Phase 7: Deployment | Artefacto_One_Pager_Producto.md | Prompt_One_Pager_Producto_v1.0.0.0.md | Commercial | Sí | Sí | No | Sí |  |
| ART-LIB-MKT-DECK-001 | LIB-MKT-DECK-001 | Pitch Deck (Presentación de Producto) | Active | Listo | Validado | Comercial |  | Kentaro | P7.8 | Funcionalidades (catálogo)<br>Flujos (secuencia / BPMN) | Product Marketing | New | Offering / Sellable | Phase 7: Deployment | Artefacto_Presentación_Producto.md | Prompt_Presentacion_Producto_v1.0.0.0.md | Commercial | Sí | Sí | No | Sí |  |
| ART-LIB-MKT-BROCH2-001 | LIB-MKT-BROCH2-001 | Brochure Producto | Active | Listo | Validado | Comercial |  | Kentaro | P7.9 | Mapa de Capacidades<br>Funcionalidades (catálogo)<br>Flujos (secuencia / BPMN) | Product Marketing | New | Sellable | Phase 7: Deployment | Artefacto_Brochure_Producto.md | Prompt_Brochure_Producto_v1.0.0.0.md | Commercial | Sí | Sí | No | No |  |
| ART-REC-OPS-MANUALP-001 | REC-OPS-MANUALP-001 | Manual de Producto (operación + reglas) | Active | Listo | Validado | Comercial - Operaciones |  |  | P7.10 | Mapa de Capacidades<br>Funcionalidades (catálogo)<br>Flujos (secuencia / BPMN)<br>Arquitectura (C4 + ADRs) | Product Manager / TPO | New | Sellable | Phase 7: Deployment | Artefacto_Manual_de_Producto.md | Prompt_manual_de_Producto_v1.0.0.0.md | Operations | Sí | Sí | No | No |  |
| ART-LIB-MKT-ICP-001 | LIB-MKT-ICP-001 | ICP & Segmentos objetivo | Active | Listo | Validado | Producto - Marketing |  | Kentaro | P7.11 | Product Marketing Strategy | Product Marketing | New | Offering / Sellable | Phase 7: Deployment | Artefacto_ICP.md | Prompt_ICP_Producto_v1.0.0.0.md | None | Sí | Sí | No | Sí |  |
| ART-LIB-MKT-SALESPL-001 | LIB-MKT-SALESPL-001 | Playbook de Ventas | Active | Listo | Validado | Comercial |  | Kentaro | P7.12 | Funcionalidades (catálogo)<br>Flujos (secuencia / BPMN)<br>Manejo de Objeciones | Product Marketing | New | Sellable | Phase 7: Deployment | Artefacto_Playbook_de_Ventas.md | Prompt_Playbook_de_Ventas_v1.0.0.0.md | Commercial | Sí | Sí | No | No |  |
| ART-REC-OPS-RUNBOOKN2-001 | REC-OPS-RUNBOOKN2-001 | Runbook N2 | Active | Listo | En Validación | Operaciones | 11/02/2026 | Paul | P7.13 | Funcionalidades (catálogo)<br>Flujos (secuencia / BPMN)<br>APIs / Contratos (OpenAPI/AsyncAPI)<br>Runbook N1 | Ops Lead (N1/N2/N3) | Run / New | Offering / Sellable / Non-Sellable | Phase 7: Deployment | Plantilla_Runbook_N2_v1.0.0.0.md | Prompt_Runbook_Nivel_2_v1_0_0_2.md | Operations | Sí | Sí | Sí | Sí |  |
| ART-REC-FIN-RISKEXP-001 | REC-FIN-RISKEXP-001 | Exposición de riesgo (financiero/fraude) | Active | Listo | Por Validar | Finanzas | 12/02/2026 | Kentaro | P7.14 | PRD<br>Mapa de Capacidades<br>Funcionalidades (catálogo)<br>Flujos (secuencia / BPMN)<br>APIs / Contratos (OpenAPI/AsyncAPI)<br>Runbook N1 | Finance Lead | New | Offering / Sellable | Phase 7: Deployment | Plantilla_Exposicion_Riesgo_Financiero_Fraude_v1.0.0.0.md | Prompt_Exposicion_Riesgo_Financiero_Fraude_v1.0.0.0.md | Finance | Sí | Sí | No | Sí |  |
| ART-REC-CUS-QSG-001 | REC-CUS-QSG-001 | Quick-start Guide | Active | Listo | Por Validar | Cliente | 09/02/2026 | Kentaro | P7.15 | PRD<br>Mapa de Capacidades<br>Funcionalidades (catálogo)<br>Flujos (secuencia / BPMN)<br>Runbook N1 | Product Manager / TPO | Run / New | Offering / Sellable / Non-Sellable | Phase 7: Deployment | Plantilla_Quick_Start_Guide_v1.0.0.0.md | Prompt_Quick_Start_Guide_v1.0.0.0.md | Customer | Sí | Sí | Sí | Sí |  |
| ART-REC-CUS-HOWTO-001 | REC-CUS-HOWTO-001 | How-tos | Active | Listo | Por Validar | Cliente | 09/02/2026 | Kentaro | P7.16 | PRD<br>Mapa de Capacidades<br>Funcionalidades (catálogo)<br>Flujos (secuencia / BPMN)<br>Runbook N1 | Product Manager / TPO | New | Sellable | Phase 7: Deployment | Plantilla_How_To_v1.0.0.0.md | Prompt_How_To_v1.0.0.0.md | Customer | Sí | Sí | No | No |  |
| ART-REC-OPS-TRAINONB-001 | REC-OPS-TRAINONB-001 | Training: Onboarding / Success | Active | Listo | En Validación | Operaciones | 11/02/2026 | Kentaro | P7.17 | PRD<br>Mapa de Capacidades<br>APIs / Contratos (OpenAPI/AsyncAPI)<br>Flujos (secuencia / BPMN)<br>Runbook N1<br>Guía de Usuario | Ops Lead (N1/N2/N3) | New | Sellable / Non-Sellable | Phase 7: Deployment | Plantilla_Training_v1.0.0.0.md | Prompt_Training_v1.0.0.0.md | Operations | Sí | Sí | Sí | No |  |
| ART-REC-CUS-CLIDOC-001 | REC-CUS-CLIDOC-001 | Documentación Técnica Cliente (Readme/Portal) | Active | Listo | Por Validar | Producto Técnico |  |  | P7.18 | PRD<br>Mapa de Capacidades<br>Funcionalidades (catálogo)<br>Flujos (secuencia / BPMN)<br>Runbook N1 | Product Manager / TPO | New | Sellable | Phase 7: Deployment | Plantilla_Documentacion_Tecnica_Cliente_v1.0.0.0.md | Prompt_Documentacion_Tecnica_Cliente_v1.0.0.0.md | Customer | Sí | Sí | No | No |  |
| ART-LIB-MKT-USECASE-001 | LIB-MKT-USECASE-001 | Casos de Uso | Active | Listo | Validado | Comercial - Operaciones |  | Kentaro | P7.19 | Mapa de Capacidades<br>Funcionalidades (catálogo)<br>Flujos (secuencia / BPMN)<br>ICP & Segmentos objetivo | Product Marketing | Run / New | Offering / Sellable / Non-Sellable | Phase 7: Deployment | Artefacto_Caso_de_Uso.md | Prompt_Casos_de_Uso_Producto_v1.0.0.0.md | Commercial / Operaciones | Sí | Sí | Sí | Sí |  |
| ART-REC-PRD-FF-001 | REC-PRD-FF-001 | Ficha Funcional | Active | Listo | Por Validar | Producto |  |  | P7.20 | Product Marketing Strategy<br>Mapa de Capacidades<br>Funcionalidades (catálogo)<br>Flujos (secuencia / BPMN)<br>APIs / Contratos (OpenAPI/AsyncAPI)<br>Arquitectura (C4 + ADRs)<br>ICP & Segmentos objetivo | Product Manager / TPO | New | Sellable / Non-Sellable | Phase 7: Deployment | Artefacto_Ficha_Funcional_Producto.md | Prompt_Ficha_Funcional_Producto_v1.0.0.0.md | None | Sí | Sí | Sí | No |  |
| ART-REC-OPS-RUNBOOKN3-001 | REC-OPS-RUNBOOKN3-001 | Runbook N3 | Active | Listo | En Validación | Operaciones | 11/02/2026 | Paul | P7.21 | PRD<br>SAD<br>Runbook N2 | Ops Lead (N1/N2/N3) | Run / New | Offering / Sellable / Non-Sellable | Phase 7: Deployment | Plantilla_Runbook_N3_v1.0.0.0.md | Prompt_Runbook_Nivel_3_v1.0.0.1.md | Operations | Sí | Sí | Sí | Sí |  |
| ART-REC-OPS-CONT-001 | REC-OPS-CONT-001 | Contingencias por rail/territorio | Active | Listo | En Validación | Operaciones | 11/02/2026 | Kentaro | P7.22 | PRD<br>Mapa de Capacidades<br>APIs / Contratos (OpenAPI/AsyncAPI)<br>Flujos (secuencia / BPMN)<br>Runbook N1<br>Runbook N2 | Ops Lead (N1/N2/N3) | New | Offering / Sellable | Phase 7: Deployment | Plantilla_Contingencias_Rail_Territorio_v1.0.0.0.md | Prompt_Contingencias_Rail_Territorio_v1.0.0.0.md | Operations | Sí | Sí | Sí | Sí |  |
| ART-REC-OPS-KILL-001 | REC-OPS-KILL-001 | Killswitch & Rollback | Active | Listo | En Validación | Operaciones | 11/02/2026 | Kentaro | P7.23 | PRD<br>SAD<br>Runbook N3 | Ops Lead (N1/N2/N3) | Run / New | Offering / Sellable / Non-Sellable | Phase 7: Deployment | Plantilla_Killswitch_Rollback_v1.0.0.0.md | Prompt_Killswitch_Rollback_v1.0.0.0.md | Operations | Sí | Sí | Sí | Sí |  |
| ART-REC-OPS-STABLE-001 | REC-OPS-STABLE-001 | Criterios de 'operación estable' | Active | Listo | En Validación | Operaciones | 11/02/2026 | Kentaro | P7.24 | PRD<br>SAD<br>Arquitectura (C4 + ADRs)<br>Runbook N1<br>Runbook N2<br>Runbook N3<br>Contingencias por rail/territorio<br>Killswitch & Rollback | Ops Lead (N1/N2/N3) | New | Sellable / Non-Sellable | Phase 7: Deployment | Plantilla_Criterios_Operacion_Estable_v1.0.0.0.md | Prompt_Criterios_Operacion_Estable_v1.0.0.0.md | Operations | Sí | Sí | Sí | No |  |
| ART-REC-OPS-ADOPTCHK-001 | REC-OPS-ADOPTCHK-001 | Checklist de adopción por área | Active | Listo | En Validación | Operaciones | 11/02/2026 | Kentaro | P7.25 | PRD<br>Criterios de 'operación estable'<br>Runbook N1<br>Runbook N2<br>Runbook N3, Contingencias por rail/territorio<br>Killswitch & Rollback<br>Guía de Usuario<br>Training: Onboarding / Success | Ops Lead (N1/N2/N3) | New | Sellable / Non-Sellable | Phase 7: Deployment | Plantilla_Checklist_Adopcion_Area_v1.0.0.0.md | Prompt_Checklist_Adopcion_Area_v1.0.0.0.md | Operations | Sí | Sí | Sí | No |  |
| ART-REC-PRD-GEN-001 | REC-PRD-GEN-001 | General de Producto (Overview) | Active | Listo | Validado | Producto |  | Kentaro | P7.26 | Mapa de Capacidades<br>Funcionalidades (catálogo)<br>Flujos (secuencia / BPMN)<br>APIs / Contratos (OpenAPI/AsyncAPI)<br>Product Marketing Strategy<br>Arquitectura (C4 + ADRs) | Product Manager / TPO | New | Sellable | Phase 7: Deployment | Artefacto_General_de_Producto.md | Prompt_Artefacto_General_de_Producto_v1.0.0.0.md | None | Sí | Sí | No | No |  |

---

## Vista rápida por fase KashioOS

### Phase 2: Analysis

| Orden | Nombre | ART-ID | Área | Validación | Tipo de Producto |
|---|---|---|---|---|---|
| P2.1 | PRD (Product Requirements Document) | ART-REC-PRD-PRD-001 | Producto | Validado | Offering / Sellable / Non-Sellable |
| P2.2 | (USM) Epics & Release Stories Map | ART-REC-GOV-EPICMAP-001 | SDLC | Validado | Offering / Sellable / Non-Sellable |
| P2.3 | SRS / Spec Funcional + NFR | ART-REC-TEC-SRS-001 | SDLC | Validado | Offering / Sellable / Non-Sellable |
| P2.4 | Mapa de Capacidades | ART-REC-TEC-CAP-001 | Producto Técnico | Validado | Offering / Sellable / Non-Sellable |
| P2.5 | Funcionalidades (catálogo) | ART-REC-TEC-FEAT-001 | Producto Técnico | Validado | Offering / Sellable / Non-Sellable |

### Phase 3: Design

| Orden | Nombre | ART-ID | Área | Validación | Tipo de Producto |
|---|---|---|---|---|---|
| P3.1 | SAD | ART-REC-TEC-SAD-001 | SDLC | Validado | Offering / Sellable / Non-Sellable |
| P3.2 | SDD | ART-REC-TEC-SDD-001 | SDLC | Validado | Offering / Sellable / Non-Sellable |
| P3.3 | Arquitectura (C4 + ADRs) | ART-REC-TEC-ARCH-001 | Producto Técnico | Validado | Offering / Sellable / Non-Sellable |
| P3.4 | Flujos (secuencia / BPMN) | ART-REC-TEC-FLOWS-001 | Producto Técnico | Validado | Offering / Sellable / Non-Sellable |

### Phase 5: Backend Dev

| Orden | Nombre | ART-ID | Área | Validación | Tipo de Producto |
|---|---|---|---|---|---|
| P5.1 | APIs / Contratos (OpenAPI/AsyncAPI) | ART-REC-TEC-API-001 | Producto Técnico | Validado | Offering / Sellable / Non-Sellable |

### Phase 7: Deployment

| Orden | Nombre | ART-ID | Área | Validación | Tipo de Producto |
|---|---|---|---|---|---|
| P7.1 | Product Marketing Strategy | ART-LIB-MKT-STRAT-001 | Producto - Marketing | Validado | Offering / Sellable |
| P7.2 | Impacto COGS | ART-REC-FIN-COGS-001 | Finanzas | Por Validar | Sellable |
| P7.3 | Reportes financieros requeridos | ART-REC-FIN-FREP-001 | Finanzas | Por Validar | Sellable |
| P7.4 | Runbook N1 | ART-REC-OPS-RUNBOOKN1-001 | Operaciones | En Validación | Offering / Sellable / Non-Sellable |
| P7.5 | Manejo de Objeciones | ART-LIB-MKT-OBJ-001 | Comercial | Validado | Sellable |
| P7.6 | Guía de Usuario | ART-REC-CUS-UGUIDE-001 | Cliente - Operaciones | Por Validar | Offering / Sellable / Non-Sellable |
| P7.7 | One-pager | ART-LIB-MKT-ONEP-001 | Comercial | Validado | Offering / Sellable |
| P7.8 | Pitch Deck (Presentación de Producto) | ART-LIB-MKT-DECK-001 | Comercial | Validado | Offering / Sellable |
| P7.9 | Brochure Producto | ART-LIB-MKT-BROCH2-001 | Comercial | Validado | Sellable |
| P7.10 | Manual de Producto (operación + reglas) | ART-REC-OPS-MANUALP-001 | Comercial - Operaciones | Validado | Sellable |
| P7.11 | ICP & Segmentos objetivo | ART-LIB-MKT-ICP-001 | Producto - Marketing | Validado | Offering / Sellable |
| P7.12 | Playbook de Ventas | ART-LIB-MKT-SALESPL-001 | Comercial | Validado | Sellable |
| P7.13 | Runbook N2 | ART-REC-OPS-RUNBOOKN2-001 | Operaciones | En Validación | Offering / Sellable / Non-Sellable |
| P7.14 | Exposición de riesgo (financiero/fraude) | ART-REC-FIN-RISKEXP-001 | Finanzas | Por Validar | Offering / Sellable |
| P7.15 | Quick-start Guide | ART-REC-CUS-QSG-001 | Cliente | Por Validar | Offering / Sellable / Non-Sellable |
| P7.16 | How-tos | ART-REC-CUS-HOWTO-001 | Cliente | Por Validar | Sellable |
| P7.17 | Training: Onboarding / Success | ART-REC-OPS-TRAINONB-001 | Operaciones | En Validación | Sellable / Non-Sellable |
| P7.18 | Documentación Técnica Cliente (Readme/Portal) | ART-REC-CUS-CLIDOC-001 | Producto Técnico | Por Validar | Sellable |
| P7.19 | Casos de Uso | ART-LIB-MKT-USECASE-001 | Comercial - Operaciones | Validado | Offering / Sellable / Non-Sellable |
| P7.20 | Ficha Funcional | ART-REC-PRD-FF-001 | Producto | Por Validar | Sellable / Non-Sellable |
| P7.21 | Runbook N3 | ART-REC-OPS-RUNBOOKN3-001 | Operaciones | En Validación | Offering / Sellable / Non-Sellable |
| P7.22 | Contingencias por rail/territorio | ART-REC-OPS-CONT-001 | Operaciones | En Validación | Offering / Sellable |
| P7.23 | Killswitch & Rollback | ART-REC-OPS-KILL-001 | Operaciones | En Validación | Offering / Sellable / Non-Sellable |
| P7.24 | Criterios de 'operación estable' | ART-REC-OPS-STABLE-001 | Operaciones | En Validación | Sellable / Non-Sellable |
| P7.25 | Checklist de adopción por área | ART-REC-OPS-ADOPTCHK-001 | Operaciones | En Validación | Sellable / Non-Sellable |
| P7.26 | General de Producto (Overview) | ART-REC-PRD-GEN-001 | Producto | Validado | Sellable |

---

## Resumen por estado de validación

| Validación | Cantidad |
|---|---:|
| Validado | 20 |
| Por Validar | 8 |
| En Validación | 8 |

## Resumen por fase KashioOS

| Fase KashioOS | Cantidad de artefactos |
|---|---:|
| Phase 2: Analysis | 5 |
| Phase 3: Design | 4 |
| Phase 5: Backend Dev | 1 |
| Phase 7: Deployment | 26 |

