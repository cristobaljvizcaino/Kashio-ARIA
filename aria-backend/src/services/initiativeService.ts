import * as initiativeRepository from '../repositories/initiativeRepository';
import * as artifactDefinitionRepository from '../repositories/artifactDefinitionRepository';
import { kashioFetch } from './kashiosClient';
import { HttpError } from '../types/http';
import { MAX_PHASE, MIN_PHASE, getPhaseLabel } from '../const/phases';
import type {
  ArtifactDefinition,
  ArtifactInitiativeType,
} from '../types/artifactDefinition';
import type {
  Initiative,
  InitiativeDetail,
  InitiativePhaseDetail,
  InitiativePhaseSnapshot,
  InitiativeProductType,
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

const PRODUCT_TYPE_VALUES: InitiativeProductType[] = [
  'Offering',
  'Sellable',
  'Non_Sellable',
];

const PRODUCT_TYPE_MAP: Record<string, InitiativeProductType> = {
  offering: 'Offering',
  sellable: 'Sellable',
  non_sellable: 'Non_Sellable',
  'non sellable': 'Non_Sellable',
  'non-sellable': 'Non_Sellable',
  nonsellable: 'Non_Sellable',
};

/**
 * Parsea el `productType` que envía el front en el body de `POST /sync`.
 *
 * **Es opcional.** Reglas:
 *  - Ausente, `null`, string vacío o array vacío → devuelve `undefined`.
 *    El service lo trata como "no enviado": el upsert preserva el valor previo
 *    (o lo deja `NULL` si es el primer insert) y el detalle no aplica filtro
 *    por tipo de producto en `GET /:publicId`.
 *  - String (`"Sellable"`, case-insensitive) o array de un solo elemento →
 *    se normaliza al valor canónico (`Offering` / `Sellable` / `Non_Sellable`).
 *  - Cualquier otro tipo, array de varios elementos, o string que no mapea →
 *    `400 Bad Request`.
 */
function parseProductTypeBody(raw: unknown): InitiativeProductType | undefined {
  if (raw === undefined || raw === null) return undefined;
  let candidate = raw;
  if (Array.isArray(raw)) {
    if (raw.length === 0) return undefined;
    if (raw.length !== 1) {
      throw new HttpError(
        400,
        `productType must be a single value (one of: ${PRODUCT_TYPE_VALUES.join(', ')}) or omitted`,
      );
    }
    candidate = raw[0];
  }
  const s = typeof candidate === 'string' ? candidate.trim() : String(candidate ?? '').trim();
  if (s === '') return undefined;
  const v = PRODUCT_TYPE_MAP[s.toLowerCase()];
  if (!v) {
    throw new HttpError(
      400,
      `productType must be one of: ${PRODUCT_TYPE_VALUES.join(', ')} (or omit it for no filter)`,
    );
  }
  return v;
}

/**
 * Mapea `Initiative.initiativeType` (CHANGE/NEW_PRODUCT) al valor equivalente
 * usado en `artifact_definition.initiative_type` (Change/New_Product). Si la
 * iniciativa no tiene `initiativeType` clasificado se devuelve `null` y el
 * filtro por tipo de iniciativa no se aplica.
 */
function mapToArtifactInitiativeType(
  type: InitiativeType | null,
): ArtifactInitiativeType | null {
  if (type === 'CHANGE') return 'Change';
  if (type === 'NEW_PRODUCT') return 'New_Product';
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
  productType?: InitiativeProductType,
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
    productType: productType ?? undefined,
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
    productType: row.productType,
    quarterName: row.quarterName,
    quarterYear: row.quarterYear,
    estimatedStartDate: row.estimatedStartDate,
    estimatedEndDate: row.estimatedEndDate,
    syncedAt: row.syncedAt,
  };
}

/**
 * Devuelve un mapa `phaseNumber → ArtifactDefinition[]` con los artefactos
 * activos del catálogo aplicables a la iniciativa:
 *  - Si `productType` viene → filtra por `product_type @> [productType]`.
 *  - Si `initiativeType` viene → filtra por `initiative_type IN ('Both', equiv)`.
 *  - Si ambos vienen `null` → devuelve TODOS los artefactos activos
 *    (compatibilidad con iniciativas viejas que aún no tienen productType).
 *
 * La tabla es chica (decenas de filas), así que un único SELECT filtrado +
 * agrupar en memoria sigue siendo más simple y rápido que 8 queries.
 */
async function loadArtifactsGroupedByPhase(filters: {
  productType: InitiativeProductType | null;
  initiativeType: InitiativeType | null;
}): Promise<{ grouped: Map<number, ArtifactDefinition[]>; filterApplied: boolean }> {
  const filterApplied = filters.productType !== null;
  const list = filterApplied
    ? await artifactDefinitionRepository.findActiveForInitiative({
        productType: filters.productType,
        initiativeType: mapToArtifactInitiativeType(filters.initiativeType),
      })
    : await artifactDefinitionRepository.findAll();

  const grouped = new Map<number, ArtifactDefinition[]>();
  for (const artifact of list) {
    const bucket = grouped.get(artifact.phase) ?? [];
    bucket.push(artifact);
    grouped.set(artifact.phase, bucket);
  }
  return { grouped, filterApplied };
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
 * fases los `artifact_definition` aplicables a la iniciativa filtrados por:
 *   - `status = 1`
 *   - `product_type @> [initiative.productType]`  (solo si productType existe)
 *   - `initiative_type IN ('Both', equivalente)`   (solo si initiativeType existe)
 *
 * `artifactsFilterApplied` indica si el filtro corrió. Será `false` para
 * iniciativas que aún no han hecho re-sync con el body nuevo y por tanto
 * tienen `productType = null` (compatibilidad).
 */
export async function getDetail(publicId: string): Promise<InitiativeDetail> {
  const initiative = await getOne(publicId);
  const { grouped, filterApplied } = await loadArtifactsGroupedByPhase({
    productType: initiative.productType,
    initiativeType: initiative.initiativeType,
  });
  const phases = buildPhaseDetails(initiative.phases, grouped);
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
    productType: initiative.productType,
    quarterName: initiative.quarterName,
    quarterYear: initiative.quarterYear,
    estimatedStartDate: initiative.estimatedStartDate,
    estimatedEndDate: initiative.estimatedEndDate,
    intakeOriginCode: initiative.intakeOriginCode,
    syncedAt: initiative.syncedAt,
    createdAt: initiative.createdAt,
    updatedAt: initiative.updatedAt,
    totalArtifacts,
    artifactsFilterApplied: filterApplied,
    phases,
  };
}

/**
 * Body de `POST /karia-svc/v2/initiatives/sync`.
 *
 *  - `publicId` (UUID): identifica la iniciativa en KashioOS y en ARIA. **Obligatorio.**
 *  - `productType`: tipo de producto (`Offering` | `Sellable` | `Non_Sellable`).
 *      **Opcional.** Si se omite (o llega `null` / vacío) la iniciativa queda
 *      sin `productType` (o conserva el que ya tenía) y `GET /:publicId` muestra
 *      todos los artefactos activos del catálogo. Si se envía un valor válido,
 *      se persiste en `initiative.product_type` y el detalle filtra los
 *      artefactos por ese valor.
 */
export interface InitiativeSyncBody {
  publicId?: unknown;
  productType?: unknown;
}

/**
 * `POST /sync` — Pide la iniciativa a KashioOS, normaliza el payload (más el
 * `productType` opcional que envía el front) y hace upsert en `initiative`.
 * Idempotente: re-llamar refresca el snapshot local. Si el body trae
 * `productType` válido, lo reescribe; si lo omite, preserva el valor previo.
 */
export async function syncFromKashio(body: InitiativeSyncBody): Promise<Initiative> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Invalid body');
  }

  const publicId =
    typeof body.publicId === 'string' ? body.publicId.trim() : '';
  ensureUuid(publicId);

  const productType = parseProductTypeBody(body.productType);

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

  const payload = mapKashioToPayload(publicId, raw, productType);
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
 * con `POST /sync` (body) puede sobreescribir `status` con el valor de
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
 * KashioOS con `POST /sync` (body con `publicId` + `productType`).
 */
export async function destroy(publicId: string): Promise<Initiative> {
  ensureUuid(publicId);
  const updated = await initiativeRepository.updateByPublicId(publicId, {
    status: DELETED_STATUS,
  });
  if (!updated) throw new HttpError(404, 'Initiative not found');
  return updated;
}
