
import { Gate, GateStatus, Artifact, ArtifactStatus, PortfolioInitiative, IntakeRequest } from '../types/types';

/**
 * Definición de los 6 gates del PDLC de Kashio.
 * Usado por la vista Generation para poblar selectores de gate objetivo.
 */
export const GATES: Gate[] = [
  { id: 'G0', name: 'Intake / Demanda',      label: 'Intake',  status: GateStatus.APPROVED,    owner: 'Product',     sla: 'OK',      blocks: 0 },
  { id: 'G1', name: 'Requerimiento (BRM)',   label: 'BRM',     status: GateStatus.APPROVED,    owner: 'Product',     sla: 'OK',      blocks: 0 },
  { id: 'G2', name: 'Roadmap / Definición',  label: 'Roadmap', status: GateStatus.IN_PROGRESS, owner: 'Product Ops', sla: 'WARNING', blocks: 1 },
  { id: 'G3', name: 'Release / Preparación', label: 'Release', status: GateStatus.NOT_STARTED, owner: 'Product Ops', sla: 'WAITING', blocks: 0 },
  { id: 'G4', name: 'Build Readiness',       label: 'Build',   status: GateStatus.NOT_STARTED, owner: 'Tech',        sla: 'WAITING', blocks: 0 },
  { id: 'G5', name: 'Publicación',           label: 'Publish', status: GateStatus.NOT_STARTED, owner: 'Comms',       sla: 'WAITING', blocks: 0 },
];

/**
 * ARTIFACTS se cargan siempre desde la base de datos (Cloud SQL) y el bucket.
 * Mantener export vacío para compatibilidad con imports existentes.
 */
export const ARTIFACTS: Artifact[] = [];

/**
 * PORTFOLIO_2026 se carga desde la base de datos. Se mantiene export para compatibilidad.
 */
export const PORTFOLIO_2026: PortfolioInitiative[] = [];

/**
 * INTAKE_REQUESTS se cargan desde la base de datos. Se mantiene export para compatibilidad.
 */
export const INTAKE_REQUESTS: IntakeRequest[] = [];
