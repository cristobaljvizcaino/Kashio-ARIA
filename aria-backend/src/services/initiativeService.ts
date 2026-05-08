import * as initiativeRepository from '../repositories/initiativeRepository';
import * as artifactDefinitionRepository from '../repositories/artifactDefinitionRepository';
import { kashioFetch } from './kashiosClient';
import { HttpError } from '../types/http';
import { MAX_PHASE, MIN_PHASE, getPhaseLabel } from '../const/phases';
import type { ArtifactDefinition } from '../types/artifactDefinition';
import type {
  Initiative,
  InitiativeDetail,
  InitiativePhaseDetail,
  InitiativePhaseSnapshot,
  InitiativeSummary,
  InitiativeType,
  InitiativeUpsertPayload,
} from '../types/initiative';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ensureUuid(publicId: string): void {
  if (!publicId || !UUID_REGEX.test(publicId)) {
    throw new HttpError(400, 'publicId must be a valid UUID');
  }
}

/* ---------- Forma esperada del payload de KashioOS (parcial, lo que mapeamos) ---------- */

interface KashioPhase {
  phaseNumber?: unknown;
  status?: unknown;
  enteredAt?: unknown;
  completedAt?: unknown;
}

interface KashioInitiativePayload {
  id?: unknown;
  code?: unknown;
  title?: unknown;
  description?: unknown;
  status?: unknown;
  currentPhase?: unknown;
  initiativeType?: unknown;
  estimatedStartDate?: unknown;
  estimatedEndDate?: unknown;
  product?: { name?: unknown } | null;
  quarter?: { name?: unknown; year?: unknown } | null;
  intakeOrigin?: { code?: unknown } | null;
  phases?: unknown;
}

interface KashioEnvelope {
  success?: boolean;
  data?: KashioInitiativePayload;
}

/* ---------- Helpers de coerción tolerantes a `null` / tipos inesperados ---------- */

function asString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function asInt(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function asInitiativeType(v: unknown): InitiativeType | null {
  const s = asString(v)?.toUpperCase().replace(/[\s-]+/g, '_');
  if (!s) return null;
  if (s === 'CHANGE') return 'CHANGE';
  if (s === 'NEW_PRODUCT' || s === 'NEWPRODUCT') return 'NEW_PRODUCT';
  return null;
}

/** Devuelve `YYYY-MM-DD` (la columna es `date`) a partir de un ISO o `null` si no se puede. */
function asDateOnly(v: unknown): string | null {
  const s = asString(v);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function asPhases(v: unknown): InitiativePhaseSnapshot[] {
  if (!Array.isArray(v)) return [];
  const out: InitiativePhaseSnapshot[] = [];
  for (const item of v as KashioPhase[]) {
    const phaseNumber = asInt(item?.phaseNumber);
    if (phaseNumber === null) continue;
    out.push({
      phaseNumber,
      status: asString(item?.status) ?? 'PENDING',
      enteredAt: asString(item?.enteredAt),
      completedAt: asString(item?.completedAt),
    });
  }
  return out.sort((a, b) => a.phaseNumber - b.phaseNumber);
}

/* ---------- Mapper KashioOS → upsert payload ---------- */

function mapKashioToPayload(
  publicId: string,
  raw: KashioInitiativePayload,
): InitiativeUpsertPayload {
  const title = asString(raw.title);
  if (!title) {
    throw new HttpError(502, 'KashioOS payload is missing required field: title');
  }

  return {
    publicId,
    code: asString(raw.code),
    title,
    description: asString(raw.description),
    status: asString(raw.status),
    currentPhase: asInt(raw.currentPhase),
    initiativeType: asInitiativeType(raw.initiativeType),
    productName: asString(raw.product?.name),
    quarterName: asString(raw.quarter?.name),
    quarterYear: asInt(raw.quarter?.year),
    estimatedStartDate: asDateOnly(raw.estimatedStartDate),
    estimatedEndDate: asDateOnly(raw.estimatedEndDate),
    intakeOriginCode: asString(raw.intakeOrigin?.code),
    phases: asPhases(raw.phases),
  };
}

/* ---------- Helpers para listado / detalle ---------- */

function toSummary(row: Initiative): InitiativeSummary {
  return {
    publicId: row.publicId,
    code: row.code,
    title: row.title,
    status: row.status,
    currentPhase: row.currentPhase,
    currentPhaseLabel:
      row.currentPhase !== null ? getPhaseLabel(row.currentPhase) : null,
    initiativeType: row.initiativeType,
    productName: row.productName,
    quarterName: row.quarterName,
    quarterYear: row.quarterYear,
    estimatedStartDate: row.estimatedStartDate,
    estimatedEndDate: row.estimatedEndDate,
    syncedAt: row.syncedAt,
  };
}

/**
 * Devuelve un mapa `phaseNumber → ArtifactDefinition[]` con TODO el catálogo de
 * `artifact_definition`. La tabla es chica (decenas de filas), así que un único
 * SELECT y agrupar en memoria es más simple y rápido que 8 queries.
 */
async function loadArtifactsGroupedByPhase(): Promise<Map<number, ArtifactDefinition[]>> {
  const all = await artifactDefinitionRepository.findAll();
  const grouped = new Map<number, ArtifactDefinition[]>();
  for (const artifact of all) {
    const list = grouped.get(artifact.phase) ?? [];
    list.push(artifact);
    grouped.set(artifact.phase, list);
  }
  return grouped;
}

/**
 * Construye las 8 entradas de `phases` para el detalle: arranca del snapshot
 * KashioOS (estado, enteredAt, completedAt) y le adjunta los artefactos del
 * catálogo que pertenecen a esa fase. Si KashioOS no envió alguna fase la
 * completa con `status: 'PENDING'` y `enteredAt/completedAt: null`.
 */
function buildPhaseDetails(
  snapshots: InitiativePhaseSnapshot[],
  artifactsByPhase: Map<number, ArtifactDefinition[]>,
): InitiativePhaseDetail[] {
  const bySnapshot = new Map<number, InitiativePhaseSnapshot>();
  for (const s of snapshots) bySnapshot.set(s.phaseNumber, s);

  const out: InitiativePhaseDetail[] = [];
  for (let n = MIN_PHASE; n <= MAX_PHASE; n++) {
    const snap = bySnapshot.get(n);
    const artifacts = artifactsByPhase.get(n) ?? [];
    out.push({
      phaseNumber: n,
      phaseLabel: getPhaseLabel(n),
      status: snap?.status ?? 'PENDING',
      enteredAt: snap?.enteredAt ?? null,
      completedAt: snap?.completedAt ?? null,
      artifactsCount: artifacts.length,
      artifacts,
    });
  }
  return out;
}

/* ---------- Endpoints públicos ---------- */

/** GET / — Listado liviano (sin `phases` jsonb). */
export async function listSummary(): Promise<InitiativeSummary[]> {
  const rows = await initiativeRepository.findAll();
  return rows.map(toSummary);
}

/** Detalle plano (interno). Mantener por si lo consume otra capa. */
export async function getOne(publicId: string): Promise<Initiative> {
  ensureUuid(publicId);
  const found = await initiativeRepository.findByPublicId(publicId);
  if (!found) throw new HttpError(404, 'Initiative not found');
  return found;
}

/**
 * GET /:publicId — Detalle enriquecido: la iniciativa + por cada una de las 8
 * fases los `artifact_definition` asociados a esa fase.
 */
export async function getDetail(publicId: string): Promise<InitiativeDetail> {
  const initiative = await getOne(publicId);
  const artifactsByPhase = await loadArtifactsGroupedByPhase();
  const phases = buildPhaseDetails(initiative.phases, artifactsByPhase);
  const totalArtifacts = phases.reduce((acc, p) => acc + p.artifactsCount, 0);

  return {
    publicId: initiative.publicId,
    code: initiative.code,
    title: initiative.title,
    description: initiative.description,
    status: initiative.status,
    currentPhase: initiative.currentPhase,
    currentPhaseLabel:
      initiative.currentPhase !== null ? getPhaseLabel(initiative.currentPhase) : null,
    initiativeType: initiative.initiativeType,
    productName: initiative.productName,
    quarterName: initiative.quarterName,
    quarterYear: initiative.quarterYear,
    estimatedStartDate: initiative.estimatedStartDate,
    estimatedEndDate: initiative.estimatedEndDate,
    intakeOriginCode: initiative.intakeOriginCode,
    syncedAt: initiative.syncedAt,
    createdAt: initiative.createdAt,
    updatedAt: initiative.updatedAt,
    totalArtifacts,
    phases,
  };
}

/**
 * Pide la iniciativa a KashioOS por `publicId`, normaliza el payload y hace upsert
 * en `initiative`. Idempotente: re-llamar refresca el snapshot local.
 */
export async function syncFromKashio(publicId: string): Promise<Initiative> {
  ensureUuid(publicId);

  const envelope = await kashioFetch<KashioEnvelope | KashioInitiativePayload>(
    `/api/v1/initiatives/${publicId}`,
  );

  // El upstream puede venir como { success, data } o como el objeto plano.
  const raw =
    envelope && typeof envelope === 'object' && 'data' in envelope && (envelope as KashioEnvelope).data
      ? (envelope as KashioEnvelope).data!
      : (envelope as KashioInitiativePayload);

  if (!raw || typeof raw !== 'object') {
    throw new HttpError(502, 'KashioOS returned an empty/invalid initiative payload');
  }

  const upstreamId = asString(raw.id);
  if (upstreamId && upstreamId.toLowerCase() !== publicId.toLowerCase()) {
    throw new HttpError(
      502,
      `KashioOS returned a different id than requested (got ${upstreamId})`,
    );
  }

  const payload = mapKashioToPayload(publicId, raw);
  return initiativeRepository.upsertFromKashio(payload);
}

/**
 * Estado sentinela usado por el soft-delete. Se eligió en mayúsculas para que
 * conviva con los estados que envía KashioOS (`NOT_STARTED`, `IN_PROGRESS`, …).
 */
export const DELETED_STATUS = 'DELETED';

/* ---------- PUT /:publicId (actualización parcial) ---------- */

export interface InitiativeUpdateBody {
  status?: unknown;
}

/**
 * PUT /:publicId — Update parcial. Hoy solo permite cambiar `status`. Útil tanto
 * para "restaurar" una iniciativa soft-deleted (`status: 'IN_PROGRESS'`, etc.)
 * como para marcarla en cualquier otro estado custom de ARIA. Re-sincronizar
 * con `POST /sync/:publicId` puede sobreescribir `status` con el valor de
 * KashioOS, así que esta operación es solo override local.
 */
export async function update(
  publicId: string,
  body: InitiativeUpdateBody,
): Promise<Initiative> {
  ensureUuid(publicId);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Invalid body');
  }

  const updates: { status?: string } = {};

  if (body.status !== undefined) {
    if (typeof body.status !== 'string') {
      throw new HttpError(400, 'status must be a string');
    }
    const trimmed = body.status.trim();
    if (trimmed === '') {
      throw new HttpError(400, 'status cannot be empty');
    }
    updates.status = trimmed.toUpperCase();
  }

  if (Object.keys(updates).length === 0) {
    throw new HttpError(400, 'No fields to update');
  }

  const updated = await initiativeRepository.updateByPublicId(publicId, updates);
  if (!updated) throw new HttpError(404, 'Initiative not found');
  return updated;
}

/* ---------- DELETE /:publicId (soft-delete) ---------- */

/**
 * Soft-delete: NO borra la fila. Solo cambia `status` a `DELETED` para que
 * la iniciativa siga existiendo en ARIA y pueda ser "restaurada" más tarde
 * vía `PUT /:publicId` con un `status` distinto, o re-sincronizada desde
 * KashioOS con `POST /sync/:publicId`.
 */
export async function destroy(publicId: string): Promise<Initiative> {
  ensureUuid(publicId);
  const updated = await initiativeRepository.updateByPublicId(publicId, {
    status: DELETED_STATUS,
  });
  if (!updated) throw new HttpError(404, 'Initiative not found');
  return updated;
}
