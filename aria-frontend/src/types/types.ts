
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

export type ArtifactArea = 'Producto' | 'Comercial' | 'Tecnología' | 'Negocio' | 'Operaciones' | 'Customer' | 'Finanzas';

export interface ArtifactDefinition {
  id: string;
  gate: string;
  name: string;
  initiativeType: 'Change' | 'Run' | 'Both';
  predecessorIds: string[];
  description?: string;
  mandatory: boolean;
  area: ArtifactArea;
  createdAt?: string;
  updatedAt?: string;
}

export interface Initiative {
  id: string;
  name: string;
  product: string;
  currentGateId: string;
  artifacts: Artifact[];
  startDate?: string;
  endDate?: string;
  quarter?: string;
  status?: string;
  intakeRequestId?: string;
  type?: 'Change' | 'Run';
  pipelineActivated?: boolean;
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
  okrId?: string;
}

export interface IntakeRequest {
  id: string;
  title: string;
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
  scope?: string[];
  constraints?: string;
  alternatives?: string;
  kpi?: string;
  status: 'G0_Intake' | 'G1_Framing' | 'G2_Discovery' | 'Rejected' | 'Parked';
  createdAt: string;
  ariaAnalysis?: string;
}
