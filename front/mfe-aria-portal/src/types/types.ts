
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

export type ArtifactType = 'Input' | 'Output';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
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

export interface PublishedFile {
  version: string;
  filename: string;
  url: string;
  publishedAt: string;
  publishedBy?: string;
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
  publishedFiles?: PublishedFile[];
}

// Definición de artefacto en el catálogo (configuración/template)
export type ArtifactArea = 'Producto' | 'Comercial' | 'Tecnología' | 'Negocio' | 'Operaciones' | 'Customer' | 'Finanzas';

export interface ArtifactDefinition {
  id: string;
  gate: string; // G0, G1, G2, G3, G4, G5
  name: string;
  initiativeType: 'Change' | 'Run' | 'Both'; // Para qué tipo de iniciativa aplica
  predecessorIds: string[]; // IDs de artefactos que deben estar published primero
  description?: string;
  mandatory: boolean; // Si es obligatorio o no
  area: ArtifactArea; // Área responsable del artefacto
  createdAt?: string;
  updatedAt?: string;
}

export interface KPI {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
}

export interface Initiative {
  id: string;
  name: string;
  product: string;
  currentGateId: string;
  artifacts: Artifact[];
  startDate?: string; // Fecha de inicio (YYYY-MM-DD)
  endDate?: string; // Fecha de finalización (YYYY-MM-DD)
  quarter?: string; // Quarter calculado basado en endDate (ej: Q1-2026)
  status?: string; // Estado de la iniciativa (Backlog, En Definición, En Curso, etc.)
  intakeRequestId?: string; // ID del intake que originó esta iniciativa
  type?: 'Change' | 'Run'; // Change = nueva funcionalidad, Run = mantenimiento
  pipelineActivated?: boolean; // true si ya pasó de G0 a G1
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
  okrId?: string; // Link to OKR
}

// OEA & OKR Types
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
  health: 'Healthy' | 'At Risk' | 'Critical';
  keyResults: KeyResult[];
}

export interface Oea {
  id: string;
  name: string;
  owner: string;
  period: string;
  progress: number;
  health: 'Healthy' | 'At Risk' | 'Critical';
  impact: number; // 1-5 scale
}

// Intake Types
export interface IntakeRequest {
  id: string;
  title: string; // Título/Resumen - Nombre de la iniciativa
  requester: string;
  area: string;
  type: 'Bug' | 'Mejora' | 'Estratégica' | 'Regulatorio' | 'Deuda Técnica';
  product: string;
  domain: string;
  region: string;
  impactType: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  urgency: 'Now' | 'Next' | 'Later';
  problem: string;
  outcome: string;
  scope?: string[]; // New: Backend, Frontend, API, etc.
  constraints?: string; // New
  alternatives?: string; // New
  kpi?: string;
  status: 'G0_Intake' | 'G1_Framing' | 'G2_Discovery' | 'Rejected' | 'Parked';
  createdAt: string;
  ariaAnalysis?: string;
}

// KPC Specific Types
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
  offering: {
    name: string;
    modules: string[];
    pricing: string;
    sla: string;
  };
}

// Squad Governance Types
export interface SquadHealth {
  id: string;
  name: string;
  load: number;
  run: number;
  change: number;
  risk: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Healthy' | 'At Risk' | 'Blocked' | 'Warning';
  activeInitiatives: string[];
  blockers: number;
}

export interface GovernanceLogEntry {
  id: string;
  date: string;
  initiativeId?: string;
  squadId?: string;
  decision: string;
  reason: string;
  owner: string;
  severity: 'Info' | 'Warning' | 'Critical';
}

export interface DependencyNode {
  source: string;
  target: string;
  type: 'Blocker' | 'Risk' | 'Watch';
  description: string;
}

// VEGA Observatory Types
export interface VegaIncident {
  id: string;
  service: string;
  product: string;
  platform: 'Rails' | 'VAR' | 'AI' | 'Portal' | 'Reportes' | 'Core';
  eventType: 'Bug' | 'Data' | 'Infra' | 'APIs' | 'Procesos';
  severity: 'Critical' | 'Major' | 'Minor';
  affectation: 'Falla intermitente' | 'Indisponibilidad parcial' | 'Caída total' | 'Contingencia';
  clientsImpacted: number;
  tierImpact: { t0: number; t1: number; t2: number; t3: number; t4: number };
  region: string;
  country: 'PE' | 'MX' | 'CO' | 'CL' | 'BR' | 'Regional';
  startTime: string;
  durationMinutes: number;
  pulseStatus: 'Investigando' | 'Mitigando' | 'Resuelto';
  squadOwner: string;
  description: string;
}

export interface VegaImpact {
  incidentId: string;
  affectedFlows: string[];
  estimatedGmv: string;
  failedTransactions: number;
  risks: string[];
  kashioLoss: number;
  clientLoss: number;
  uom: 'USD/Tx' | 'USD/Hour' | 'USD/Session' | 'USD/Event';
  lossExplanation: string;
}

export interface VegaRail {
  id: string;
  partner: 'BCP' | 'BBVA' | 'Interbank' | 'Scotiabank' | 'KasNet' | 'Banorte' | 'Bancolombia' | 'Banco Estado' | 'Itau' | 'Otros';
  railType: 'Transferencias' | 'Depósitos' | 'Batch' | 'QR' | 'API/Webhook';
  service: 'Pay-in' | 'Payout' | 'Recaudo' | 'Reconciliación' | 'Validación';
  product: string;
  slaContractual: number;
  slaCurrent: number;
  status: 'OK' | 'Risk' | 'Breach';
  region: 'Zona Norte/Centro' | 'Zona Sur' | 'Regional';
  country: 'PE' | 'MX' | 'CO' | 'CL' | 'BR';
  successRate: number;
  avgLatencyMs: number;
  openPsd: number;
  openDsn: number;
}

export interface ProductHealthMetric {
  productId: string;
  productName: string;
  psdRate: number;
  dsnRate: number;
  reconMatching: number;
  avgResolutionTime: number;
  slaStatus: {
    psd: 'OK' | 'Risk' | 'Breach';
    dsn: 'OK' | 'Risk' | 'Breach';
    recon: 'OK' | 'Risk' | 'Breach';
  };
}

export interface AdoptionMetric {
  moduleId: string;
  moduleName: string;
  enabledClients: number;
  activeClients: number;
  adoptionRate: number;
  ttaDays: number;
  potentialTx: number;
  actualTx: number;
  utilizationRate: number;
  potentialRevenue: number;
  status: 'High' | 'Medium' | 'Low';
}

export interface KeyResult {
  id: string;
  description: string;
  target: number;
  current: number;
  unit: string;
}
