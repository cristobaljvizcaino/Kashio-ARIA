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

const INITIATIVE_MAP: Record<string, ArtifactInitiativeType> = {
  run: 'Run',
  change: 'Change',
  both: 'Both',
};

function parseInitiativeType(raw: unknown): ArtifactInitiativeType | undefined {
  const s = firstQueryString(raw);
  if (!s) return undefined;
  const v = INITIATIVE_MAP[s.toLowerCase()];
  if (!v) {
    throw new HttpError(400, 'initiativeType must be Run, Change or Both');
  }
  return v;
}

/** JSON body: acepta solo Run / Change / Both (case-insensitive). */
function parseInitiativeTypeBody(raw: unknown): ArtifactInitiativeType {
  if (raw === undefined || raw === null) {
    throw new HttpError(400, 'initiativeType must be Run, Change or Both');
  }
  const s = typeof raw === 'string' ? raw.trim() : String(raw).trim();
  if (s === '') {
    throw new HttpError(400, 'initiativeType must be Run, Change or Both');
  }
  const v = INITIATIVE_MAP[s.toLowerCase()];
  if (!v) {
    throw new HttpError(400, 'initiativeType must be Run, Change or Both');
  }
  return v;
}

/** POST: omite o null → `Both`; si viene valor, debe ser válido. */
function initiativeTypeForCreate(raw: unknown): ArtifactInitiativeType {
  if (raw === undefined || raw === null) return 'Both';
  return parseInitiativeTypeBody(raw);
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
 * POST: exige al menos `phase` o `phaseName`. PATCH: mismo criterio cuando cualquiera de los dos va en el body.
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

async function resolvePredecessorRefs(refs: unknown): Promise<string[]> {
  if (refs === undefined || refs === null) return [];
  if (!Array.isArray(refs)) {
    throw new HttpError(400, 'predecessorNames must be an array');
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ref of refs) {
    const trimmed = String(ref).trim();
    if (!trimmed) {
      throw new HttpError(400, 'Each predecessorNames entry must be a non-empty string');
    }
    const name = await repository.findNameByRef(trimmed);
    if (!name) {
      throw new HttpError(
        400,
        `Predecessor not found in artifact_definition: "${trimmed}" (use publicId or exact name)`,
      );
    }
    if (!seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  }
  return out;
}

/**
 * GET / — sin paginación: siempre devuelve **todo** el conjunto que cumple el filtro,
 * agrupado por fase (el front elige la fase en UI).
 *
 * Query params:
 * - `name`, `publicId`, `initiativeType`, `area` (filtros actuales)
 * - `sortBy`, `sortOrder` (orden global antes de agrupar)
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

  const area = firstQueryString(rawQuery.area);
  const nameSearch = firstQueryString(rawQuery.name);

  const sortBy = parseSortField(rawQuery.sortBy);
  const sortOrder = parseSortOrder(rawQuery.sortOrder);

  const filter: ArtifactDefinitionListFilters = {
    ...(publicIdFilter ? { publicId: publicIdFilter } : {}),
    ...(initiativeType ? { initiativeType } : {}),
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

  const phase = resolvePhaseFromBody({
    phase: input.phase,
    phaseName: input.phaseName,
  });
  const predecessorNames = await resolvePredecessorRefs(input.predecessorNames);

  const payload: ArtifactDefinitionInsertPayload = {
    name: String(input.name).trim(),
    phase,
    initiativeType: initiativeTypeForCreate(input.initiativeType),
    predecessorNames,
    description: input.description ?? null,
    mandatory: input.mandatory ?? false,
    area: input.area ?? 'Producto',
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

  const { phaseName, initiativeType: initiativeTypeRaw, ...rest } = updates;
  const payload: ArtifactDefinitionUpdate = { ...rest };

  if (initiativeTypeRaw !== undefined) {
    payload.initiativeType = parseInitiativeTypeBody(initiativeTypeRaw);
  }

  if (updates.phase !== undefined || phaseName !== undefined) {
    payload.phase = resolvePhaseFromBody({
      phase: updates.phase,
      phaseName,
    });
  }

  if (updates.predecessorNames !== undefined) {
    payload.predecessorNames = await resolvePredecessorRefs(updates.predecessorNames);
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
 * DELETE /:publicId : borra el artefacto y propaga el borrado al `predecessor_names`
 * de cualquier otro artefacto que lo referenciara por nombre. La operación es
 * atómica (transacción única en el repo).
 */
export async function destroy(publicId: string): Promise<ArtifactDefinitionDeleteResponse> {
  ensureUuid(publicId);
  const result = await repository.remove(publicId);
  if (!result) throw new HttpError(404, 'Artifact definition not found');

  const cascadedFromArtifacts = result.cascadedFromArtifacts;
  return {
    success: true,
    deleted: {
      publicId: result.publicId,
      name: result.name,
    },
    cascade: {
      artifactsUpdated: cascadedFromArtifacts,
      message:
        cascadedFromArtifacts === 0
          ? 'No other artifacts referenced this name in predecessor_names.'
          : `Removed "${result.name}" from predecessor_names of ${cascadedFromArtifacts} artifact(s).`,
    },
  };
}
