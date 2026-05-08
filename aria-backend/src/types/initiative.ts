import type { ArtifactDefinition } from './artifactDefinition';

/** Clasificación de iniciativas que envía KashioOS. */
export type InitiativeType = 'CHANGE' | 'NEW_PRODUCT';

/** Snapshot de cada fase tomado del payload `phases[]` de KashioOS. */
export interface InitiativePhaseSnapshot {
  phaseNumber: number;
  status: string;
  enteredAt: string | null;
  completedAt: string | null;
}

/**
 * Fila plana para el listado: se omite el array `phases` (potencialmente pesado)
 * y se agrega `currentPhaseLabel` para que el front no tenga que mapear el número
 * a la etiqueta de fase KashioOS.
 */
export interface InitiativeSummary {
  publicId: string;
  code: string | null;
  title: string;
  status: string | null;
  currentPhase: number | null;
  currentPhaseLabel: string | null;
  initiativeType: InitiativeType | null;
  productName: string | null;
  quarterName: string | null;
  quarterYear: number | null;
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  syncedAt: string;
}

/**
 * Snapshot de fase + las definiciones de artefactos (`artifact_definition`)
 * que pertenecen a esa fase en el catálogo de ARIA.
 */
export interface InitiativePhaseDetail {
  phaseNumber: number;
  phaseLabel: string;
  status: string;
  enteredAt: string | null;
  completedAt: string | null;
  artifactsCount: number;
  artifacts: ArtifactDefinition[];
}

/**
 * Detalle completo de la iniciativa enriquecida:
 * - Datos guardados de KashioOS.
 * - Las 8 fases con sus artefactos asociados desde `artifact_definition`.
 */
export interface InitiativeDetail {
  publicId: string;
  code: string | null;
  title: string;
  description: string | null;
  status: string | null;
  currentPhase: number | null;
  currentPhaseLabel: string | null;
  initiativeType: InitiativeType | null;
  productName: string | null;
  quarterName: string | null;
  quarterYear: number | null;
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  intakeOriginCode: string | null;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
  totalArtifacts: number;
  phases: InitiativePhaseDetail[];
}

/**
 * Modelo expuesto por la API. `publicId` = `id` UUID de KashioOS, único por iniciativa
 * y estable entre re-sincronizaciones.
 */
export interface Initiative {
  id: number;
  publicId: string;
  code: string | null;
  title: string;
  description: string | null;
  status: string | null;
  currentPhase: number | null;
  initiativeType: InitiativeType | null;
  productName: string | null;
  quarterName: string | null;
  quarterYear: number | null;
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  intakeOriginCode: string | null;
  phases: InitiativePhaseSnapshot[];
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload normalizado para upsert (lo que produce el mapper desde la respuesta KashioOS). */
export interface InitiativeUpsertPayload {
  publicId: string;
  code: string | null;
  title: string;
  description: string | null;
  status: string | null;
  currentPhase: number | null;
  initiativeType: InitiativeType | null;
  productName: string | null;
  quarterName: string | null;
  quarterYear: number | null;
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  intakeOriginCode: string | null;
  phases: InitiativePhaseSnapshot[];
}

/** Forma cruda devuelta por `pg`. */
export interface InitiativeRow {
  id: number | string;
  public_id: string;
  code: string | null;
  title: string;
  description: string | null;
  status: string | null;
  current_phase: number | null;
  initiative_type: string | null;
  product_name: string | null;
  quarter_name: string | null;
  quarter_year: number | null;
  estimated_start_date: string | Date | null;
  estimated_end_date: string | Date | null;
  intake_origin_code: string | null;
  phases: InitiativePhaseSnapshot[] | null;
  synced_at: string | Date;
  created_at: string | Date;
  updated_at: string | Date;
}
