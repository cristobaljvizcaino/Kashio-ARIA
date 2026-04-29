/**
 * Carga masiva de artefactos desde el documento Order & Repo Gates
 * Versión: 3.0.0
 * Fecha: 2026-02-13
 */

import { ArtifactDefinition } from '../types/types';

export const ARTIFACTS_FROM_ORDER: Omit<ArtifactDefinition, 'createdAt' | 'updatedAt' | 'area'>[] = [
  // GATE 1
  {
    id: 'DEF-G1-01',
    gate: 'G1',
    name: 'Intake & Triage Record (RUN vs CHANGE)',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Clasificación RUN vs CHANGE para triaje de requerimientos'
    // Archivos: Prompt_PRD_RUN_v1.0.0.0.md, Plantilla_PRD_RUN_v1.0.0.0.md
  },
  {
    id: 'DEF-G1-02',
    gate: 'G1',
    name: 'Informe de Diseño para Wireframe',
    initiativeType: 'Change',
    predecessorIds: [],
    mandatory: false,
    description: 'Informe de diseño para wireframes'
    // No encontrado en repo
  },
  {
    id: 'DEF-G1-03',
    gate: 'G1',
    name: 'Visión de Producto',
    initiativeType: 'Change',
    predecessorIds: [],
    mandatory: true,
    description: 'Visión estratégica del producto'
    // Depende de: BRM (insumo externo)
  },
  {
    id: 'DEF-G1-04',
    gate: 'G1',
    name: 'PRD (Product Requirements Document)',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Documento de requerimientos del producto'
    // Archivos: Prompt_PRD_Producto_v1.0.0.0.md, Plantilla_PRD_Producto_v1.2.0.0.md
  },

  // GATE 2
  {
    id: 'DEF-G2-01',
    gate: 'G2',
    name: '(USM) Epics & Release Stories Map',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'User Story Map inicial con epics y releases'
    // Archivos: Prompt_USM_Inicial_v1.0.0.0.md, Plantilla_USM_Inicial_1.0.0.6.md
    // Ya está en librería
  },
  {
    id: 'DEF-G2-02',
    gate: 'G2',
    name: 'SRS / Spec Funcional + NFR',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Especificación de requerimientos de software'
    // Archivos: Plantilla Kashio SRS 1.0.0.5.md
  },
  {
    id: 'DEF-G2-03',
    gate: 'G2',
    name: 'SAD',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Software Architecture Document'
    // Archivos: Plantilla Kashio SAD 1.0.0.5.md
  },
  {
    id: 'DEF-G2-04',
    gate: 'G2',
    name: 'SDD',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Software Design Document'
    // Archivos: Plantilla Kashio SDD 1.0.0.5.md
  },
  {
    id: 'DEF-G2-05',
    gate: 'G2',
    name: 'Mapa de Capacidades',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Catálogo de capacidades del producto'
    // Archivos: Prompt_capacidades_v1.1.0.0.md, Plantilla_capacidades_v1.0.0.0.md
  },
  {
    id: 'DEF-G2-06',
    gate: 'G2',
    name: 'Funcionalidades (catálogo)',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Catálogo de funcionalidades'
    // Archivos: Prompt_funcionalidades_v1.1.0.0.md, Plantilla_funcionalidades_V1.0.0.0.md
  },
  {
    id: 'DEF-G2-07',
    gate: 'G2',
    name: 'APIs / Contratos (OpenAPI/AsyncAPI)',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Especificación de APIs y contratos'
    // Archivos: Prompt_api_v1.1.0.0.md, Plantilla_api_v1.0.0.0.md
  },
  {
    id: 'DEF-G2-08',
    gate: 'G2',
    name: 'Flujos (secuencia / BPMN)',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Flujos de proceso en secuencia o BPMN'
    // Archivos: Prompt_flujos_v1.1.0.0.md, Plantilla_flujo_v1.0.0.0.md
  },
  {
    id: 'DEF-G2-09',
    gate: 'G2',
    name: 'Arquitectura (C4 + ADRs)',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Documento de arquitectura C4 y ADRs'
    // Archivos: Prompt_arquitectura_v1.1.0.0.md, Plantilla_arquitectura_v1.0.0.0.md
  },

  // GATE 3
  {
    id: 'DEF-G3-01',
    gate: 'G3',
    name: 'Runbook N1',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Runbook nivel 1 operativo'
    // Archivos: Prompt_Runbook_Nivel_1_v1.0.0.1.md, Plantilla_Runbook_N1.md
  },
  {
    id: 'DEF-G3-02',
    gate: 'G3',
    name: 'Impacto COGS',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Análisis de impacto en costos (COGS)'
    // Archivos: Prompt_Impacto_COGS_v1.0.0.0.md, Plantilla_Impacto_COGS_v1.0.0.0.md
  },
  {
    id: 'DEF-G3-03',
    gate: 'G3',
    name: 'Reportes financieros requeridos',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: false,
    description: 'Reportes financieros del producto'
    // Archivos: Prompt_Reportes_Financieros_Requeridos_v1.0.0.0.md
  },
  {
    id: 'DEF-G3-04',
    gate: 'G3',
    name: 'Guía de Usuario',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: false,
    description: 'Guía de uso para usuarios finales'
    // Archivos: Prompt_Guia_Usuario_v1.0.0.0.md, Plantilla_Guia_Usuario_v1.0.0.0.md
  },
  {
    id: 'DEF-G3-05',
    gate: 'G3',
    name: 'Runbook N2',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Runbook nivel 2'
    // Archivos: Prompt_Runbook_Nivel_2_v1.0.0.1.md, Plantilla_Runbook_N2.md
  },
  {
    id: 'DEF-G3-06',
    gate: 'G3',
    name: 'Runbook N3',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Runbook nivel 3'
    // Archivos: Prompt_Runbook_Nivel_3_v1.0.0.1.md, Plantilla_Runbook_N3.md
  },
  {
    id: 'DEF-G3-07',
    gate: 'G3',
    name: 'Contingencias por rail/territorio',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Plan de contingencias por rail o territorio'
    // Archivos: Prompt_Contingencias_Rail_Territorio_v1.0.0.0.md
  },
  {
    id: 'DEF-G3-08',
    gate: 'G3',
    name: 'Killswitch & Rollback',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Procedimientos de killswitch y rollback'
    // Archivos: Prompt_Killswitch_Rollback_v1.0.0.0.md
  },
  {
    id: 'DEF-G3-09',
    gate: 'G3',
    name: 'Exposición de riesgo (financiero/fraude)',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Análisis de exposición a riesgo financiero y fraude'
    // Archivos: Prompt_Exposicion_Riesgo_Financiero_Fraude_v1.0.0.0.md
  },
  {
    id: 'DEF-G3-10',
    gate: 'G3',
    name: 'Documentación Técnica Cliente',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: false,
    description: 'Documentación técnica para clientes'
    // Archivos: Prompt_Documentacion_Tecnica_Cliente_v1.0.0.0.md
  },
  {
    id: 'DEF-G3-11',
    gate: 'G3',
    name: 'Criterios de operación estable',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: true,
    description: 'Criterios para considerar operación estable'
    // Archivos: Prompt_Criterios_Operacion_Estable_v1.0.0.0.md
  },

  // GATE 4
  {
    id: 'DEF-G4-01',
    gate: 'G4',
    name: 'Product Marketing Strategy',
    initiativeType: 'Change',
    predecessorIds: [],
    mandatory: true,
    description: 'Estrategia de marketing del producto'
    // Ya está en librería: Product_Marketing_Strategy_Portal_Empresas_Peru
  },
  {
    id: 'DEF-G4-02',
    gate: 'G4',
    name: 'ICP & Segmentos objetivo',
    initiativeType: 'Change',
    predecessorIds: [],
    mandatory: false,
    description: 'Perfil de cliente ideal y segmentos'
    // Archivos: Prompt_ICP_Producto_v1.0.0.0.md, Artefacto_ICP.md
  },
  {
    id: 'DEF-G4-03',
    gate: 'G4',
    name: 'General de Producto (Overview)',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: false,
    description: 'Vista general/overview del producto'
    // Archivos: Prompt_Artefacto_General_de_Producto_v1.0.0.0.md
  },
  {
    id: 'DEF-G4-04',
    gate: 'G4',
    name: 'Manual de Producto (operación + reglas)',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: false,
    description: 'Manual operativo y reglas del producto'
    // Archivos: Prompt_manual_de_Producto_v1.0.0.0.md
  },
  {
    id: 'DEF-G4-05',
    gate: 'G4',
    name: 'One-pager',
    initiativeType: 'Change',
    predecessorIds: [],
    mandatory: false,
    description: 'Documento one-pager comercial'
    // Archivos: Prompt_One_Pager_Producto_v1.0.0.0.md
  },
  {
    id: 'DEF-G4-06',
    gate: 'G4',
    name: 'Pitch Deck (Presentación de Producto)',
    initiativeType: 'Change',
    predecessorIds: [],
    mandatory: false,
    description: 'Presentación comercial del producto'
    // Archivos: Prompt_Presentacion_Producto_v1.0.0.0.md, Artefacto_Presentación_Producto.md
    // Ya está en librería
  },
  {
    id: 'DEF-G4-07',
    gate: 'G4',
    name: 'Brochure Comercial',
    initiativeType: 'Change',
    predecessorIds: [],
    mandatory: false,
    description: 'Brochure comercial'
    // Archivos: Prompt_Brochure_Producto_v1.0.0.0.md, Artefacto_Brochure_Producto.md
    // Ya está en librería
  },
  {
    id: 'DEF-G4-08',
    gate: 'G4',
    name: 'Casos de Uso',
    initiativeType: 'Change',
    predecessorIds: [],
    mandatory: false,
    description: 'Casos de uso comerciales'
    // Archivos: Prompt_Casos_de_Uso_Producto_v1.0.0.0.md
  },
  {
    id: 'DEF-G4-09',
    gate: 'G4',
    name: 'Manejo de Objeciones',
    initiativeType: 'Change',
    predecessorIds: [],
    mandatory: false,
    description: 'Guía de manejo de objeciones de ventas'
    // Archivos: Prompt_Manejo_de_Objeciones_Producto_v1.0.0.0.md
  },
  {
    id: 'DEF-G4-10',
    gate: 'G4',
    name: 'Playbook de Ventas',
    initiativeType: 'Change',
    predecessorIds: [],
    mandatory: false,
    description: 'Playbook comercial de ventas'
    // Archivos: Prompt_Playbook_de_Ventas_v1.0.0.0.md
  },
  {
    id: 'DEF-G4-11',
    gate: 'G4',
    name: 'Training (Onboarding / Success / Support)',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: false,
    description: 'Material de entrenamiento y onboarding'
    // Archivos: Prompt_Training_v1.0.0.0.md, Plantilla_Training_v1.0.0.0.md
  },
  {
    id: 'DEF-G4-12',
    gate: 'G4',
    name: 'Quick-start Guide',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: false,
    description: 'Guía de inicio rápido'
    // Archivos: Prompt_Quick_Start_Guide_v1.0.0.0.md
  },
  {
    id: 'DEF-G4-13',
    gate: 'G4',
    name: 'How-tos',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: false,
    description: 'Guías how-to para clientes'
    // Archivos: Prompt_How_To_v1.0.0.0.md, Plantilla_How_To_v1.0.0.0.md
  },
  {
    id: 'DEF-G4-14',
    gate: 'G4',
    name: 'Checklist de adopción por área',
    initiativeType: 'Both',
    predecessorIds: [],
    mandatory: false,
    description: 'Checklist de adopción por área funcional'
    // Archivos: Prompt_Checklist_Adopcion_Area_v1.0.0.0.md
  }
];

/**
 * Función para cargar artefactos masivamente
 */
export const loadArtifactsFromOrder = async (): Promise<number> => {
  try {
    // Importar el servicio dinámicamente para evitar dependencias circulares
    const { createArtifactDefinition, getAllArtifactDefinitions } = await import('../services/artifactDefinitionService');
    
    // Obtener definiciones existentes
    const existing = await getAllArtifactDefinitions();
    const existingIds = new Set(existing.map(d => d.id));
    
    // Filtrar solo los que no existen
    const toCreate = ARTIFACTS_FROM_ORDER.filter(art => !existingIds.has(art.id));
    
    // Crear uno por uno
    for (const art of toCreate) {
      await createArtifactDefinition(art as ArtifactDefinition);
    }
    
    console.log(`✅ Loaded ${toCreate.length} artifacts from Order & Repo Gates`);
    return toCreate.length;
    
  } catch (error) {
    console.error('❌ Error loading artifacts from order:', error);
    return 0;
  }
};

