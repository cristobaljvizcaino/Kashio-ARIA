
import { Gate, GateStatus, Artifact, ArtifactStatus, KPI, PortfolioInitiative, KpcProduct, Oea, Okr, IntakeRequest } from '../types/types';

export const GATES: Gate[] = [
  { id: 'G0', name: 'Intake / Demanda', label: 'Intake', status: GateStatus.APPROVED, owner: 'Product', sla: 'OK', blocks: 0 },
  { id: 'G1', name: 'Requerimiento (BRM)', label: 'BRM', status: GateStatus.APPROVED, owner: 'Product', sla: 'OK', blocks: 0 },
  { id: 'G2', name: 'Roadmap / Definición', label: 'Roadmap', status: GateStatus.IN_PROGRESS, owner: 'Product Ops', sla: 'WARNING', blocks: 1 },
  { id: 'G3', name: 'Release / Preparación', label: 'Release', status: GateStatus.NOT_STARTED, owner: 'Product Ops', sla: 'WAITING', blocks: 0 },
  { id: 'G4', name: 'Build Readiness', label: 'Build', status: GateStatus.NOT_STARTED, owner: 'Tech', sla: 'WAITING', blocks: 0 },
  { id: 'G5', name: 'Publicación', label: 'Publish', status: GateStatus.NOT_STARTED, owner: 'Comms', sla: 'WAITING', blocks: 0 },
];

export const MASTER_ARTIFACT_LIST: Artifact[] = [
  // GATE 0 - Intake / Demanda (INPUTS)
  { id: 'CAN-G0-01', gate: 'G0', name: 'Benchmark Competitivo', category: 'Product-MKT', version: 'v1.0.0', status: ArtifactStatus.ACTIVE, artifactType: 'Input', destination: ['SharePoint'] },
  { id: 'CAN-G0-02', gate: 'G0', name: 'Regulaciones', category: 'Product-MKT', version: 'v1.0.0', status: ArtifactStatus.ACTIVE, artifactType: 'Input', destination: ['SharePoint'] },
  { id: 'CAN-G0-03', gate: 'G0', name: 'Tendencias', category: 'Product-MKT', version: 'v1.0.0', status: ArtifactStatus.ACTIVE, artifactType: 'Input', destination: ['SharePoint'] },

  // GATE 1 - Requerimiento (BRM)
  { id: 'CAN-G1-01', gate: 'G1', name: 'Visión de Producto', category: 'Estrategia', version: 'v1.1.0', status: ArtifactStatus.ACTIVE, artifactType: 'Output', destination: ['Confluence'] },
  { id: 'CAN-G1-02', gate: 'G1', name: 'Segmentación', category: 'Estrategia', version: 'v1.1.0', status: ArtifactStatus.ACTIVE, artifactType: 'Output', destination: ['Confluence'] },
  { id: 'CAN-G1-03', gate: 'G1', name: 'Diferenciadores Producto', category: 'Estrategia', version: 'v1.1.0', status: ArtifactStatus.ACTIVE, artifactType: 'Output', destination: ['Confluence'] },

  // GATE 2 - Roadmap / Definición
  { id: 'CAN-G2-01', gate: 'G2', name: 'Pricing Strategy', category: 'Producto', version: 'v2.0.1', status: ArtifactStatus.ACTIVE, artifactType: 'Output', destination: ['SharePoint'] },
  { id: 'CAN-G2-02', gate: 'G2', name: 'ICP Definition', category: 'Producto', version: 'v2.0.1', status: ArtifactStatus.ACTIVE, artifactType: 'Output', destination: ['Confluence'] },
  { id: 'CAN-G2-03', gate: 'G2', name: 'General de Producto', category: 'Producto', version: 'v2.0.1', status: ArtifactStatus.ACTIVE, artifactType: 'Output', destination: ['Confluence'] },
  { id: 'CAN-G2-04', gate: 'G2', name: 'Ficha Funcional', category: 'Producto', version: 'v2.0.1', status: ArtifactStatus.ACTIVE, artifactType: 'Output', destination: ['Confluence'] },
  { id: 'CAN-G2-05', gate: 'G2', name: 'Capacidades EA', category: 'Producto Técnico', version: 'v2.0.1', status: ArtifactStatus.ACTIVE, artifactType: 'Output', destination: ['Confluence'] },
  { id: 'CAN-G2-06', gate: 'G2', name: 'Funcionalidades Core', category: 'Producto Técnico', version: 'v2.0.1', status: ArtifactStatus.ACTIVE, artifactType: 'Output', destination: ['Confluence'] },
  { id: 'CAN-G2-07', gate: 'G2', name: 'APIs Specification', category: 'Producto Técnico', version: 'v2.0.1', status: ArtifactStatus.ACTIVE, artifactType: 'Output', destination: ['Confluence'] },
  { id: 'CAN-G2-08', gate: 'G2', name: 'Flujos de Usuario', category: 'Producto Técnico', version: 'v2.0.1', status: ArtifactStatus.ACTIVE, artifactType: 'Output', destination: ['Confluence'] },
  { id: 'CAN-G2-09', gate: 'G2', name: 'Arquitectura Conceptual', category: 'Producto Técnico', version: 'v2.0.1', status: ArtifactStatus.ACTIVE, artifactType: 'Output', destination: ['Confluence'] },

  // GATE 3 - Release / Preparación
  { id: 'CAN-G3-01', gate: 'G3', name: 'Mapa Funcionalidades', category: 'Técnica', version: 'v1.0.0', status: ArtifactStatus.DRAFT, artifactType: 'Output', destination: ['Confluence'] },
  { id: 'CAN-G3-02', gate: 'G3', name: 'Descripción Técnica', category: 'Técnica', version: 'v1.0.0', status: ArtifactStatus.DRAFT, artifactType: 'Output', destination: ['Confluence'] },
  { id: 'CAN-G3-03', gate: 'G3', name: 'Doc Técnica Cliente', category: 'Técnica', version: 'v1.0.0', status: ArtifactStatus.DRAFT, artifactType: 'Output', destination: ['Read.me'] },
  { id: 'CAN-G3-04', gate: 'G3', name: 'Manual de Producto', category: 'Go-To-Market', version: 'v1.0.0', status: ArtifactStatus.DRAFT, artifactType: 'Output', destination: ['SharePoint'] },
  { id: 'CAN-G3-05', gate: 'G3', name: 'Playbook de Ventas', category: 'Go-To-Market', version: 'v1.0.0', status: ArtifactStatus.DRAFT, artifactType: 'Output', destination: ['SharePoint'] },
  { id: 'CAN-G3-06', gate: 'G3', name: 'Presentación Producto', category: 'Go-To-Market', version: 'v1.0.0', status: ArtifactStatus.DRAFT, artifactType: 'Output', destination: ['SharePoint'] },
  { id: 'CAN-G3-07', gate: 'G3', name: 'Brochure Comercial', category: 'Go-To-Market', version: 'v1.0.0', status: ArtifactStatus.DRAFT, artifactType: 'Output', destination: ['SharePoint'] },
  { id: 'CAN-G3-08', gate: 'G3', name: 'One Pager', category: 'Go-To-Market', version: 'v1.0.0', status: ArtifactStatus.DRAFT, artifactType: 'Output', destination: ['SharePoint'] },
  { id: 'CAN-G3-09', gate: 'G3', name: 'Casos de Uso', category: 'Go-To-Market', version: 'v1.0.0', status: ArtifactStatus.DRAFT, artifactType: 'Output', destination: ['SharePoint'] },
  { id: 'CAN-G3-10', gate: 'G3', name: 'Casos de Éxito', category: 'Go-To-Market', version: 'v1.0.0', status: ArtifactStatus.DRAFT, artifactType: 'Output', destination: ['SharePoint'] },

  // GATE 4 - Build Readiness
  { id: 'CAN-G4-01', gate: 'G4', name: 'Epics & Features', category: 'SDLC-Jira', version: 'v1.0.0', status: ArtifactStatus.NOT_STARTED, artifactType: 'Output', destination: ['Jira'] },
  { id: 'CAN-G4-02', gate: 'G4', name: 'Tech Docs SDLC', category: 'SDLC-Confluence', version: 'v1.0.0', status: ArtifactStatus.NOT_STARTED, artifactType: 'Output', destination: ['Confluence'] },
  { id: 'CAN-G4-03', gate: 'G4', name: 'Backlog Priorizado', category: 'SDLC-Jira', version: 'v1.0.0', status: ArtifactStatus.NOT_STARTED, artifactType: 'Output', destination: ['Jira'] },
  { id: 'CAN-G4-04', gate: 'G4', name: 'Versión de Offering', category: 'KPC', version: 'v1.0.0', status: ArtifactStatus.NOT_STARTED, artifactType: 'Output', destination: ['KPC'] },

  // GATE 5 - Publicación
  { id: 'CAN-G5-01', gate: 'G5', name: 'Doc Interna', category: 'Activación', version: 'v1.0.0', status: ArtifactStatus.NOT_STARTED, artifactType: 'Output', destination: ['Confluence'] },
  { id: 'CAN-G5-02', gate: 'G5', name: 'Doc Estratégica', category: 'Activación', version: 'v1.0.0', status: ArtifactStatus.NOT_STARTED, artifactType: 'Output', destination: ['SharePoint'] },
  { id: 'CAN-G5-03', gate: 'G5', name: 'Doc Clientes', category: 'Activación', version: 'v1.0.0', status: ArtifactStatus.NOT_STARTED, artifactType: 'Output', destination: ['Read.me'] },
  { id: 'CAN-G5-04', gate: 'G5', name: 'KB Versionada', category: 'Activación', version: 'v1.0.0', status: ArtifactStatus.NOT_STARTED, artifactType: 'Output', destination: ['DataBridge'] },
  { id: 'CAN-G5-05', gate: 'G5', name: 'Contexto Operativo', category: 'Activación', version: 'v1.0.0', status: ArtifactStatus.NOT_STARTED, artifactType: 'Output', destination: ['KAIA'] },
];

// ARTIFACTS - Solo se cargarán de base de datos y bucket
// Los datos mockeados se han eliminado para comenzar con sistema limpio
export const ARTIFACTS: Artifact[] = [];

export const KPIS: KPI[] = [
  { label: 'Tiempo Promedio / Gate', value: '4.2 días', trend: 'down', trendValue: '-12%' },
  { label: 'Gates Bloqueados', value: '1', trend: 'neutral', trendValue: 'Sin cambios' },
  { label: 'Artifacts HITL Pendiente', value: '12', trend: 'up', trendValue: '+4' },
  { label: 'Drift KPC vs Docs', value: '2%', trend: 'down', trendValue: '-1%' },
];

export const OEAS: Oea[] = [
  { id: 'OEA-01', name: 'Plataforma FinOps AI Driven', owner: 'CDPO', period: '2026', progress: 82, health: 'Healthy', impact: 5 },
  { id: 'OEA-02', name: 'Eficiencia Operativa & Riesgo', owner: 'COO', period: '2026', progress: 64, health: 'At Risk', impact: 4 },
  { id: 'OEA-03', name: 'Crecimiento & Expansión', owner: 'CEO', period: '2026', progress: 51, health: 'At Risk', impact: 5 },
  { id: 'OEA-04', name: 'Gobierno & Delivery', owner: 'PMO', period: '2026', progress: 76, health: 'Healthy', impact: 3 },
  { id: 'OEA-05', name: 'Valor Cliente & Adopción', owner: 'CPO', period: '2026', progress: 69, health: 'At Risk', impact: 4 },
];

export const OKRS: Okr[] = [
  { 
    id: 'OKR-O2.1', 
    oeaId: 'OEA-02', 
    name: 'Reducir pérdidas operativas', 
    owner: 'COO', 
    health: 'At Risk', 
    keyResults: [
      { id: 'KR-2.1.1', description: '-50% PSD / DSN', target: 50, current: 32, unit: '%' },
      { id: 'KR-2.1.2', description: 'MTTR < 30 min', target: 30, current: 41, unit: 'min' }
    ] 
  },
  { 
    id: 'OKR-O2.2', 
    oeaId: 'OEA-02', 
    name: 'Automatizar reconciliación', 
    owner: 'FinOps Lead', 
    health: 'Healthy', 
    keyResults: [
      { id: 'KR-2.2.1', description: '90% Ingesta automática', target: 90, current: 85, unit: '%' }
    ] 
  },
  { 
    id: 'OKR-O2.3', 
    oeaId: 'OEA-02', 
    name: 'Gobierno operativo', 
    owner: 'PMO', 
    health: 'Healthy', 
    keyResults: [
      { id: 'KR-2.3.1', description: '100% de Gates auditados', target: 100, current: 95, unit: '%' }
    ] 
  },
  { 
    id: 'OKR-O1.1', 
    oeaId: 'OEA-01', 
    name: 'Liderazgo en FinOps AI', 
    owner: 'CDPO', 
    health: 'Healthy', 
    keyResults: [
      { id: 'KR-1.1.1', description: '3 productos AI en GA', target: 3, current: 2, unit: 'unidades' }
    ] 
  }
];

// PORTFOLIO_2026 - Solo se cargarán de base de datos
// Los datos mockeados se han eliminado para comenzar con sistema limpio
export const PORTFOLIO_2026: PortfolioInitiative[] = [];

// INTAKE_REQUESTS - Solo se cargarán de base de datos
// Los datos mockeados se han eliminado para comenzar con sistema limpio
export const INTAKE_REQUESTS: IntakeRequest[] = [];

export const INPUTS_G2 = [
  { name: 'Documento BRM Aprobado', completed: true, required: true },
  { name: 'Benchmark de Mercado', completed: true, required: true },
  { name: 'Ficha Técnica Preliminar', completed: true, required: true },
  { name: 'Análisis de Riesgos', completed: true, required: false },
];

export const KPC_PRODUCTS: KpcProduct[] = [
  {
    id: 'KPC-001',
    code: 'FINOPS-RECON',
    name: 'Reconciliación Inteligente',
    status: 'Active',
    version: 'v1.2.0',
    pdlcInitiativeId: 'IDPRD-004',
    pdlcGate: 'G5',
    owner: 'Head of FinOps',
    domain: 'FinOps',
    targetSegment: 'Enterprise B2B',
    region: 'LATAM (PE, MX, CO)',
    modules: [
      {
        code: 'RECON-CORE',
        name: 'Motor de Reconciliación',
        mandatory: true,
        version: 'v1.2',
        services: [
          { code: 'RECON-INGEST', name: 'Bank Ingestion', type: 'Core', source: 'ARIA' },
          { code: 'RECON-MATCH', name: 'Matching Engine', type: 'Core', source: 'ARIA' },
          { code: 'RECON-AI', name: 'Root Cause AI', type: 'AI', source: 'ARIA' }
        ]
      }
    ],
    configs: [
      { key: 'reconciliation.frequency', description: 'Frecuencia de ejecución', defaultValue: 'Daily', editable: true }
    ],
    offering: {
      name: 'FinOps Enterprise Bundle',
      modules: ['RECON-CORE'],
      pricing: 'Tiered Monthly Subscription',
      sla: '99.9% Uptime'
    }
  },
  {
    id: 'KPC-002',
    code: 'PLAT-PORTAL',
    name: 'Portal Empresa v1',
    status: 'Active',
    version: 'v1.2.0',
    pdlcInitiativeId: 'IDPRD-001',
    pdlcGate: 'G5',
    owner: 'Product Lead',
    domain: 'Platform',
    targetSegment: 'B2B Empresas',
    region: 'PE',
    modules: [
      {
        code: 'PLAT-UI',
        name: 'Unified B2B UI',
        mandatory: true,
        version: 'v1.0',
        services: [{ code: 'UI-DASH', name: 'Admin Dashboard', type: 'Shared', source: 'Internal' }]
      }
    ],
    configs: [],
    offering: { name: 'Portal Standard', modules: ['PLAT-UI'], pricing: 'SaaS', sla: '99.5%' }
  }
];

// ========================================
// SQUAD GOVERNANCE DATA
// ========================================
export const SQUAD_HEALTH_DATA: import('../types/types').SquadHealth[] = [
  { id: 'SQ-NOVA', name: 'Squad Nova', load: 100, run: 30, change: 70, risk: 'Medium', status: 'Healthy', activeInitiatives: ['IDPRD-001', 'IDPRD-002', 'IDPRD-003', 'IDPRD-010'], blockers: 0 },
  { id: 'SQ-AI', name: 'Squad Product AI', load: 130, run: 20, change: 80, risk: 'High', status: 'At Risk', activeInitiatives: ['IDPRD-006', 'IDPRD-043', 'IDPRD-044', 'IDPRD-045'], blockers: 1 },
  { id: 'SQ2', name: 'Squad 2 (VAR)', load: 110, run: 70, change: 30, risk: 'Medium', status: 'Warning', activeInitiatives: ['IDPRD-004', 'IDPRD-022', 'IDPRD-040', 'IDPRD-038'], blockers: 2 },
  { id: 'SQ3', name: 'Squad 3 (Reliability)', load: 95, run: 60, change: 40, risk: 'Low', status: 'Healthy', activeInitiatives: ['IDPRD-036', 'IDPRD-037', 'IDPRD-039'], blockers: 0 },
  { id: 'SQ4', name: 'Squad 4 (Rails)', load: 145, run: 40, change: 60, risk: 'Critical', status: 'Blocked', activeInitiatives: ['IDPRD-013', 'IDPRD-023', 'IDPRD-024', 'IDPRD-025', 'IDPRD-018'], blockers: 3 },
];

export const GOVERNANCE_LOG: import('../types/types').GovernanceLogEntry[] = [
  { id: 'LOG-001', date: '2026-02-05', squadId: 'SQ4', decision: 'Frozen', reason: 'SQ4 Overload (>140%) prevents new country launches.', owner: 'CDPO', severity: 'Critical' },
  { id: 'LOG-002', date: '2026-02-10', initiativeId: 'IDPRD-004', decision: 'Escalated', reason: 'DataBridge dependency delaying Recon G3 exit.', owner: 'Product Ops', severity: 'Warning' },
  { id: 'LOG-003', date: '2026-02-12', squadId: 'SQ-AI', decision: 'Resource Swap', reason: 'Moving 1 FTE to SQ4 for Mexico Stability.', owner: 'COO', severity: 'Info' },
];

export const DEPENDENCY_MAP: import('../types/types').DependencyNode[] = [
  { source: 'SQ4', target: 'SQ2', type: 'Blocker', description: 'Rieles MX necesarios para Conciliación VAR' },
  { source: 'SQ-AI', target: 'SQ-NOVA', type: 'Risk', description: 'KAIA Agent dependiente de UI Patterns' },
  { source: 'SQ3', target: 'SQ4', type: 'Watch', description: 'Monitoreo H2H para nuevos partners' },
];

// ========================================
// VEGA OBSERVATORY DATA
// ========================================
export const VEGA_INCIDENTS: import('../types/types').VegaIncident[] = [
  {
    id: 'INC-2026-042',
    service: 'Pasarela de Pagos SPEI',
    product: 'Pasarela',
    platform: 'Rails',
    eventType: 'APIs',
    severity: 'Critical',
    affectation: 'Caída total',
    clientsImpacted: 120,
    tierImpact: { t0: 5, t1: 15, t2: 30, t3: 40, t4: 30 },
    region: 'Nacional',
    country: 'MX',
    startTime: '2026-02-15T14:30:00Z',
    durationMinutes: 45,
    pulseStatus: 'Mitigando',
    squadOwner: 'Squad Nova',
    description: 'Interrupción total del servicio SPEI en México por cambio de certificado en partner bancario.'
  },
  {
    id: 'INC-2026-041',
    service: 'Reconciliación Batch',
    product: 'Recaudo',
    platform: 'Core',
    eventType: 'Data',
    severity: 'Major',
    affectation: 'Indisponibilidad parcial',
    clientsImpacted: 45,
    tierImpact: { t0: 0, t1: 5, t2: 10, t3: 15, t4: 15 },
    region: 'Regional',
    country: 'Regional',
    startTime: '2026-02-14T09:00:00Z',
    durationMinutes: 120,
    pulseStatus: 'Resuelto',
    squadOwner: 'SQ2',
    description: 'Retraso en el procesamiento de archivos batch para el mercado de Chile.'
  }
];

export const VEGA_IMPACTS: import('../types/types').VegaImpact[] = [
  {
    incidentId: 'INC-2026-042',
    affectedFlows: ['Checkout API', 'Refunds SPEI'],
    estimatedGmv: '$1.2M',
    failedTransactions: 8500,
    risks: ['Pérdida de confianza Tier 1', 'Penalidades contractuales'],
    kashioLoss: 12500,
    clientLoss: 1200000,
    uom: 'USD/Event',
    lossExplanation: 'Estimación basada en volumen promedio histórico por hora en horario peak MX.'
  },
  {
    incidentId: 'INC-2026-041',
    affectedFlows: ['Reconciliation Engine'],
    estimatedGmv: '$0.4M',
    failedTransactions: 2100,
    risks: ['Retraso en liquidación'],
    kashioLoss: 1500,
    clientLoss: 50000,
    uom: 'USD/Hour',
    lossExplanation: 'Impacto por retraso en el cierre de conciliación diaria.'
  }
];

export const VEGA_RAILS: import('../types/types').VegaRail[] = [
  {
    id: 'RL-MX-01',
    partner: 'Banorte',
    railType: 'API/Webhook',
    service: 'Pay-in',
    product: 'Pasarela',
    slaContractual: 99.9,
    slaCurrent: 98.2,
    status: 'Risk',
    region: 'Zona Norte/Centro',
    country: 'MX',
    successRate: 98.5,
    avgLatencyMs: 450,
    openPsd: 2,
    openDsn: 5
  },
  {
    id: 'RL-PE-01',
    partner: 'BCP',
    railType: 'Transferencias',
    service: 'Payout',
    product: 'Payouts',
    slaContractual: 99.5,
    slaCurrent: 99.8,
    status: 'OK',
    region: 'Regional',
    country: 'PE',
    successRate: 99.7,
    avgLatencyMs: 120,
    openPsd: 0,
    openDsn: 1
  }
];

export const VEGA_ADOPTION_DATA: import('../types/types').AdoptionMetric[] = [
  { moduleId: 'MOD-01', moduleName: 'Pasarela', enabledClients: 120, activeClients: 96, adoptionRate: 80, ttaDays: 2.1, potentialTx: 1500000, actualTx: 1200000, utilizationRate: 80, potentialRevenue: 15000, status: 'High' },
  { moduleId: 'MOD-02', moduleName: 'Recaudo', enabledClients: 85, activeClients: 54, adoptionRate: 64, ttaDays: 4.8, potentialTx: 1200000, actualTx: 420000, utilizationRate: 35, potentialRevenue: 48000, status: 'Medium' },
  { moduleId: 'MOD-03', moduleName: 'Payouts', enabledClients: 60, activeClients: 22, adoptionRate: 37, ttaDays: 7.2, potentialTx: 2000000, actualTx: 500000, utilizationRate: 25, potentialRevenue: 32000, status: 'Low' },
  { moduleId: 'MOD-04', moduleName: 'Reconciliación', enabledClients: 70, activeClients: 31, adoptionRate: 44, ttaDays: 9.5, potentialTx: 800000, actualTx: 350000, utilizationRate: 44, potentialRevenue: 12000, status: 'Medium' },
  { moduleId: 'MOD-05', moduleName: 'Cobranza', enabledClients: 40, activeClients: 9, adoptionRate: 22, ttaDays: 12.4, potentialTx: 500000, actualTx: 110000, utilizationRate: 22, potentialRevenue: 25000, status: 'Low' },
];

export const PRODUCT_HEALTH: import('../types/types').ProductHealthMetric[] = [
  {
    productId: 'PROD-001',
    productName: 'Pasarela',
    psdRate: 0.12,
    dsnRate: 0.08,
    reconMatching: 98.5,
    avgResolutionTime: 45,
    slaStatus: { psd: 'OK', dsn: 'OK', recon: 'OK' }
  },
  {
    productId: 'PROD-002',
    productName: 'Recaudo',
    psdRate: 0.25,
    dsnRate: 0.15,
    reconMatching: 95.2,
    avgResolutionTime: 120,
    slaStatus: { psd: 'Risk', dsn: 'Risk', recon: 'OK' }
  }
];
