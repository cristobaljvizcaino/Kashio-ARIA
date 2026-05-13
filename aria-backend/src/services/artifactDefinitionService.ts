import * as repository from '../repositories/artifactDefinitionRepository';
import {
  MAX_PHASE,
  MIN_PHASE,
  coerceToPhaseNumber,
  getPhaseLabel,
  phaseNumberFromLabel,
} from '../const/phases';
import { HttpError } from '../types/http';
import type {
  ArtifactDefinition,
  ArtifactDefinitionDeleteResponse,
  ArtifactDefinitionInput,
  ArtifactDefinitionInsertPayload,
  ArtifactDefinitionListFilters,
  ArtifactDefinitionSortField,
  ArtifactDefinitionUpdate,
  ArtifactDefinitionsByPhaseGroup,
  ArtifactDefinitionsListResponse,
  ArtifactInitiativeType,
  ArtifactProductType,
  ArtifactStatus,
} from '../types/artifactDefinition';
import { firstQueryString } from '../utils/queryParams';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ensureUuid(publicId: string): void {
  if (!publicId || !UUID_REGEX.test(publicId)) {
    throw new HttpError(400, 'publicId must be a valid UUID');
  }
}

const SORT_FIELDS: ArtifactDefinitionSortField[] = [
  'phase',
  'name',
  'updatedAt',
  'createdAt',
  'id',
];

const INITIATIVE_TYPE_VALUES: ArtifactInitiativeType[] = ['Both', 'Change', 'New_Product'];
const PRODUCT_TYPE_VALUES: ArtifactProductType[] = ['Offering', 'Sellable', 'Non_Sellable'];

const INITIATIVE_MAP: Record<string, ArtifactInitiativeType> = {
  both: 'Both',
  change: 'Change',
  new_product: 'New_Product',
  newproduct: 'New_Product',
  'new product': 'New_Product',
  'new-product': 'New_Product',
};

const PRODUCT_TYPE_MAP: Record<string, ArtifactProductType> = {
  offering: 'Offering',
  sellable: 'Sellable',
  non_sellable: 'Non_Sellable',
  'non sellable': 'Non_Sellable',
  'non-sellable': 'Non_Sellable',
  nonsellable: 'Non_Sellable',
};

function initiativeTypeLabel(): string {
  return INITIATIVE_TYPE_VALUES.join(', ');
}

function productTypeLabel(): string {
  return PRODUCT_TYPE_VALUES.join(', ');
}

function parseInitiativeType(raw: unknown): ArtifactInitiativeType | undefined {
  const s = firstQueryString(raw);
  if (!s) return undefined;
  const v = INITIATIVE_MAP[s.trim().toLowerCase()];
  if (!v) {
    throw new HttpError(400, `initiativeType must be one of: ${initiativeTypeLabel()}`);
  }
  return v;
}

/** JSON body: acepta los valores en cualquier capitalización (Both/Change/New_Product). */
function parseInitiativeTypeBody(raw: unknown): ArtifactInitiativeType {
  if (raw === undefined || raw === null) {
    throw new HttpError(400, `initiativeType must be one of: ${initiativeTypeLabel()}`);
  }
  const s = typeof raw === 'string' ? raw.trim() : String(raw).trim();
  if (s === '') {
    throw new HttpError(400, `initiativeType must be one of: ${initiativeTypeLabel()}`);
  }
  const v = INITIATIVE_MAP[s.toLowerCase()];
  if (!v) {
    throw new HttpError(400, `initiativeType must be one of: ${initiativeTypeLabel()}`);
  }
  return v;
}

/** POST: omite o null → `Both`; si viene valor debe ser válido. */
function initiativeTypeForCreate(raw: unknown): ArtifactInitiativeType {
  if (raw === undefined || raw === null) return 'Both';
  return parseInitiativeTypeBody(raw);
}

function parseProductTypeValue(raw: unknown): ArtifactProductType {
  const s = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
  if (s === '') {
    throw new HttpError(400, `productType entry must be one of: ${productTypeLabel()}`);
  }
  const v = PRODUCT_TYPE_MAP[s.toLowerCase()];
  if (!v) {
    throw new HttpError(400, `productType must contain only: ${productTypeLabel()}`);
  }
  return v;
}

/** Acepta string único, array o `undefined`. Devuelve array (posiblemente vacío) deduplicado. */
function parseProductTypeBody(raw: unknown): ArtifactProductType[] {
  if (raw === undefined || raw === null) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  const seen = new Set<ArtifactProductType>();
  const out: ArtifactProductType[] = [];
  for (const entry of list) {
    const v = parseProductTypeValue(entry);
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function parseProductTypeFilter(raw: unknown): ArtifactProductType | undefined {
  const s = firstQueryString(raw);
  if (!s) return undefined;
  return parseProductTypeValue(s);
}

/**
 * Normaliza un valor de `status` que viene del cliente a `0` o `1`.
 *
 * Acepta:
 *   - `1`, `0` (number o string)
 *   - `true`, `false` (boolean o string `'true'` / `'false'`)
 *   - `'active'`, `'inactive'`, `'activo'`, `'inactivo'` (case-insensitive)
 *
 * Cualquier otro valor → 400.
 */
function normalizeStatusValue(raw: unknown): ArtifactStatus {
  if (raw === 1 || raw === 0) return raw;
  if (typeof raw === 'boolean') return raw ? 1 : 0;
  const s = String(raw).trim().toLowerCase();
  if (s === '1' || s === 'true' || s === 'active' || s === 'activo') return 1;
  if (s === '0' || s === 'false' || s === 'inactive' || s === 'inactivo') return 0;
  throw new HttpError(400, 'status must be 1 (active) or 0 (inactive)');
}

function parseStatusFilter(raw: unknown): ArtifactStatus | undefined {
  const s = firstQueryString(raw);
  if (s === undefined || s === null || s === '') return undefined;
  return normalizeStatusValue(s);
}

function parseStatusBody(raw: unknown): ArtifactStatus {
  if (raw === undefined || raw === null) {
    throw new HttpError(400, 'status must be 1 (active) or 0 (inactive)');
  }
  return normalizeStatusValue(raw);
}

function mergeLegacyFaseForPhase(input: {
  phase?: unknown;
  phaseName?: unknown;
  fase?: unknown;
}): { phase?: unknown; phaseName?: unknown } {
  const hasPhase =
    input.phase !== undefined && input.phase !== null && String(input.phase).trim() !== '';
  const hasFase =
    input.fase !== undefined && input.fase !== null && String(input.fase).trim() !== '';
  if (hasPhase && hasFase) {
    const p = coerceToPhaseNumber(input.phase);
    const f = coerceToPhaseNumber(input.fase);
    if (p !== null && f !== null && p !== f) {
      throw new HttpError(400, 'phase and fase must refer to the same phase; send only phase');
    }
  }
  const phase = hasPhase ? input.phase : hasFase ? input.fase : input.phase;
  return { phase, phaseName: input.phaseName };
}

function parseSortField(raw: unknown): ArtifactDefinitionSortField {
  const s = firstQueryString(raw)?.toLowerCase();
  if (!s) return 'phase';
  const map: Record<string, ArtifactDefinitionSortField> = {
    phase: 'phase',
    name: 'name',
    updatedat: 'updatedAt',
    updated_at: 'updatedAt',
    createdat: 'createdAt',
    created_at: 'createdAt',
    id: 'id',
  };
  const field = map[s];
  if (!field) {
    throw new HttpError(
      400,
      `sortBy must be one of: ${SORT_FIELDS.join(', ')} (snake_case also accepted for dates)`,
    );
  }
  return field;
}

function parseSortOrder(raw: unknown): 'asc' | 'desc' {
  const s = firstQueryString(raw)?.toLowerCase();
  if (!s || s === 'asc') return 'asc';
  if (s === 'desc') return 'desc';
  throw new HttpError(400, 'sortOrder must be asc or desc');
}

function phaseNameProvided(raw: unknown): boolean {
  return raw !== undefined && raw !== null && String(raw).trim() !== '';
}

/**
 * POST: exige al menos `phase` o `phaseName` (o `fase` en lugar de `phase`). PATCH: mismo criterio cuando cualquiera va en el body.
 */
function resolvePhaseFromBody(input: { phase?: unknown; phaseName?: unknown }): number {
  const hasNum =
    input.phase !== undefined && input.phase !== null && String(input.phase).trim() !== '';
  const hasLabel = phaseNameProvided(input.phaseName);

  if (!hasNum && !hasLabel) {
    throw new HttpError(
      400,
      `Either phase (integer ${MIN_PHASE}–${MAX_PHASE}) or phaseName (KashioOS phase label) is required`,
    );
  }

  let fromNum: number | null | undefined;
  let fromLabel: number | null | undefined;

  if (hasNum) {
    fromNum = coerceToPhaseNumber(input.phase);
    if (fromNum === null) {
      throw new HttpError(
        400,
        `phase must be an integer between ${MIN_PHASE} and ${MAX_PHASE} (or use phaseName)`,
      );
    }
  }
  if (hasLabel) {
    fromLabel = phaseNumberFromLabel(String(input.phaseName));
    if (fromLabel === null) {
      throw new HttpError(
        400,
        `Unknown phaseName. Use a KashioOS label for phases ${MIN_PHASE}–${MAX_PHASE} (e.g. "${getPhaseLabel(1)}").`,
      );
    }
  }
  const resolvedNum = fromNum ?? undefined;
  const resolvedLabel = fromLabel ?? undefined;
  if (resolvedNum !== undefined && resolvedLabel !== undefined && resolvedNum !== resolvedLabel) {
    throw new HttpError(400, 'phase and phaseName do not refer to the same phase');
  }
  const out = resolvedNum ?? resolvedLabel;
  if (out === undefined) {
    throw new HttpError(400, 'Could not resolve phase from phase / phaseName');
  }
  return out;
}

/**
 * Convierte una lista de referencias (UUIDs o nombres exactos) a una lista
 * deduplicada de `public_id` (UUIDs) válidos en `artifact_definition`.
 *
 * Si alguna referencia no existe, lanza `400`.
 */
async function resolvePredecessorPublicIds(refs: unknown): Promise<string[]> {
  if (refs === undefined || refs === null) return [];
  if (!Array.isArray(refs)) {
    throw new HttpError(400, 'predecessorPublicIds must be an array');
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ref of refs) {
    const trimmed = String(ref).trim();
    if (!trimmed) {
      throw new HttpError(400, 'Each predecessorPublicIds entry must be a non-empty string');
    }
    const publicId = await repository.findPublicIdByRef(trimmed);
    if (!publicId) {
      throw new HttpError(
        400,
        `Predecessor not found in artifact_definition: "${trimmed}" (use publicId or exact name)`,
      );
    }
    if (!seen.has(publicId)) {
      seen.add(publicId);
      out.push(publicId);
    }
  }
  return out;
}

/**
 * GET / — sin paginación: siempre devuelve **todo** el conjunto que cumple el filtro,
 * agrupado por fase (el front elige la fase en UI).
 *
 * Query params:
 * - `name`, `publicId`, `initiativeType`, `area`, `productType`, `status` (filtros actuales)
 * - `sortBy`, `sortOrder` (orden global antes de agrupar)
 *
 * Si `status` se omite, el listado muestra solo artefactos activos (`status = 1`).
 *
 * `phases` siempre tiene 8 entradas (fases 1–8); las vacías para el filtro actual van con
 * `count: 0` y `artifacts: []`.
 */
export async function listFromQuery(
  rawQuery: Record<string, unknown>,
): Promise<ArtifactDefinitionsListResponse> {
  let publicIdFilter: string | undefined;
  const pid = firstQueryString(rawQuery.publicId);
  if (pid) {
    ensureUuid(pid);
    publicIdFilter = pid;
  }

  const initiativeType = parseInitiativeType(rawQuery.initiativeType);
  const productType = parseProductTypeFilter(rawQuery.productType);
  const status = parseStatusFilter(rawQuery.status) ?? 1;

  const area = firstQueryString(rawQuery.area);
  const nameSearch = firstQueryString(rawQuery.name);

  const sortBy = parseSortField(rawQuery.sortBy);
  const sortOrder = parseSortOrder(rawQuery.sortOrder);

  const filter: ArtifactDefinitionListFilters = {
    ...(publicIdFilter ? { publicId: publicIdFilter } : {}),
    ...(initiativeType ? { initiativeType } : {}),
    ...(productType ? { productType } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(area ? { area } : {}),
    ...(nameSearch ? { name: nameSearch } : {}),
  };

  const [total, items] = await Promise.all([
    repository.countFiltered(filter),
    repository.findFiltered(filter, sortBy, sortOrder),
  ]);

  const countByPhase = new Map<number, number>();
  for (const a of items) {
    countByPhase.set(a.phase, (countByPhase.get(a.phase) ?? 0) + 1);
  }
  const byPhase = new Map<number, ArtifactDefinition[]>();
  for (const artifact of items) {
    const list = byPhase.get(artifact.phase) ?? [];
    list.push(artifact);
    byPhase.set(artifact.phase, list);
  }

  const phases: ArtifactDefinitionsByPhaseGroup[] = [];
  for (let phaseNum = MIN_PHASE; phaseNum <= MAX_PHASE; phaseNum++) {
    const artifacts = byPhase.get(phaseNum) ?? [];
    phases.push({
      phase: phaseNum,
      phaseLabel: getPhaseLabel(phaseNum),
      count: countByPhase.get(phaseNum) ?? 0,
      artifacts,
    });
  }

  return {
    totalArtifacts: total,
    totalPhases: MAX_PHASE - MIN_PHASE + 1,
    phases,
    filters: {
      ...filter,
      sortBy,
      sortOrder,
    },
  };
}

/** Lista completa sin query params; equivale a `listFromQuery({})`. */
export async function listAll(): Promise<ArtifactDefinitionsListResponse> {
  return listFromQuery({});
}

/** Variante plana, útil para integraciones internas. No expuesta hoy en HTTP. */
export async function listFlat(): Promise<ArtifactDefinition[]> {
  return repository.findAll();
}

export async function getOne(publicId: string): Promise<ArtifactDefinition> {
  ensureUuid(publicId);
  const found = await repository.findByPublicId(publicId);
  if (!found) throw new HttpError(404, 'Artifact definition not found');
  return found;
}

export async function create(input: ArtifactDefinitionInput): Promise<ArtifactDefinition> {
  if (!input?.name || String(input.name).trim() === '') {
    throw new HttpError(400, 'name is required');
  }

  const canonicalName = String(input.name).trim();
  if (await repository.existsByExactName(canonicalName)) {
    throw new HttpError(
      409,
      'An artifact definition with this name already exists',
    );
  }

  const phase = resolvePhaseFromBody(mergeLegacyFaseForPhase(input));
  const productType = parseProductTypeBody(input.productType);
  const predecessorPublicIds = await resolvePredecessorPublicIds(input.predecessorPublicIds);
  const status: ArtifactStatus =
    input.status === undefined || input.status === null ? 1 : normalizeStatusValue(input.status);

  const payload: ArtifactDefinitionInsertPayload = {
    name: canonicalName,
    phase,
    initiativeType: initiativeTypeForCreate(input.initiativeType),
    productType,
    predecessorPublicIds,
    description: input.description ?? null,
    mandatory: input.mandatory ?? false,
    area: input.area ?? 'Producto',
    status,
    ...(input.publicId ? { publicId: input.publicId } : {}),
  };

  return repository.insert(payload);
}

export async function patch(
  publicId: string,
  updates: ArtifactDefinitionUpdate,
): Promise<ArtifactDefinition> {
  ensureUuid(publicId);
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw new HttpError(400, 'Invalid body');
  }

  const { phaseName, initiativeType: initiativeTypeRaw, fase, ...rest } = updates;
  const payload: ArtifactDefinitionUpdate = { ...rest };

  if (initiativeTypeRaw !== undefined) {
    payload.initiativeType = parseInitiativeTypeBody(initiativeTypeRaw);
  }

  if (updates.phase !== undefined || phaseName !== undefined || fase !== undefined) {
    payload.phase = resolvePhaseFromBody(
      mergeLegacyFaseForPhase({
        phase: updates.phase,
        phaseName,
        fase,
      }),
    );
  }

  if (updates.productType !== undefined) {
    payload.productType = parseProductTypeBody(updates.productType);
  }

  if (updates.predecessorPublicIds !== undefined) {
    payload.predecessorPublicIds = await resolvePredecessorPublicIds(updates.predecessorPublicIds);
  }

  if (updates.status !== undefined) {
    payload.status = parseStatusBody(updates.status);
  }

  if (updates.name !== undefined) {
    const newName = String(updates.name).trim();
    if (newName === '') {
      throw new HttpError(400, 'name cannot be empty');
    }
    if (await repository.existsByExactName(newName, publicId)) {
      throw new HttpError(
        409,
        'An artifact definition with this name already exists',
      );
    }
    payload.name = newName;
  }

  const keys = Object.keys(payload).filter((k) => payload[k as keyof ArtifactDefinitionUpdate] !== undefined);
  if (keys.length === 0) {
    throw new HttpError(400, 'No fields to update');
  }

  const updated = await repository.update(publicId, payload);
  if (updated === null) {
    throw new HttpError(404, 'Artifact definition not found');
  }
  return updated;
}

/**
 * DELETE /:publicId : soft-delete. No borra la fila; solo cambia `status` a 0.
 */
export async function destroy(publicId: string): Promise<ArtifactDefinitionDeleteResponse> {
  ensureUuid(publicId);
  const result = await repository.remove(publicId);
  if (!result) throw new HttpError(404, 'Artifact definition not found');

  return {
    success: true,
    softDeleted: true,
    artifact: {
      publicId: result.publicId,
      name: result.name,
      status: result.status,
    },
  };
}
