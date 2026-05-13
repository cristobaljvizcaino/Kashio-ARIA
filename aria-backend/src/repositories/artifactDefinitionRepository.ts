import { query } from '../config/database';
import { getPhaseLabel } from '../const/phases';
import type {
  ArtifactDefinition,
  ArtifactDefinitionInsertPayload,
  ArtifactDefinitionListFilters,
  ArtifactDefinitionRow,
  ArtifactDefinitionSortField,
  ArtifactDefinitionUpdate,
  ArtifactInitiativeType,
  ArtifactProductType,
  ArtifactStatus,
} from '../types/artifactDefinition';
import { buildSetClauses } from '../utils/sql';

const FIELD_MAP: Record<string, string> = {
  phase: 'phase',
  name: 'name',
  initiativeType: 'initiative_type',
  description: 'description',
  mandatory: 'mandatory',
  area: 'area',
};

const COLUMNS = `
  id, public_id, phase, name, initiative_type, product_type,
  predecessor_public_ids, description, mandatory, area, status,
  created_at, updated_at
`;

function toIso(value: string | Date | null): string {
  if (!value) return '';
  const dateValue = value instanceof Date ? value : new Date(value);
  return dateValue.toISOString();
}

function toNumberId(id: number | string): number {
  return typeof id === 'number' ? id : Number(id);
}

function mapRow(row: ArtifactDefinitionRow): ArtifactDefinition {
  return {
    id: toNumberId(row.id),
    publicId: row.public_id,
    phase: row.phase,
    phaseLabel: getPhaseLabel(row.phase),
    name: row.name,
    initiativeType: row.initiative_type as ArtifactDefinition['initiativeType'],
    productType: (row.product_type ?? []) as ArtifactProductType[],
    predecessorPublicIds: row.predecessor_public_ids ?? [],
    description: row.description,
    mandatory: row.mandatory,
    area: row.area || 'Producto',
    status: (row.status === 0 ? 0 : 1) as ArtifactStatus,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function findAll(): Promise<ArtifactDefinition[]> {
  const result = await query<ArtifactDefinitionRow>(
    `SELECT ${COLUMNS}
       FROM artifact_definition
      WHERE status = 1
      ORDER BY phase ASC, name ASC`,
  );
  return result.rows.map(mapRow);
}

/**
 * Devuelve los artefactos activos del catálogo aplicables a una iniciativa
 * concreta:
 *  - `status = 1` (siempre).
 *  - `product_type @> [productType]` si `productType` viene; si es `null` o
 *    `undefined` no se filtra por tipo de producto.
 *  - `initiative_type IN ('Both', <equivalente>)` si `initiativeType` viene;
 *     `'Change'` para iniciativas CHANGE y `'New_Product'` para NEW_PRODUCT.
 *     Si `initiativeType` viene `null/undefined` no se filtra por este campo.
 *
 * Resultado ordenado por `phase ASC, name ASC` igual que `findAll`, para que
 * el agrupamiento por fase del service sea estable.
 */
export async function findActiveForInitiative(filters: {
  productType?: ArtifactProductType | null;
  initiativeType?: ArtifactInitiativeType | null;
}): Promise<ArtifactDefinition[]> {
  const conditions: string[] = ['status = 1'];
  const params: unknown[] = [];
  let i = 1;

  if (filters.productType) {
    conditions.push(`product_type @> $${i}::jsonb`);
    params.push(JSON.stringify([filters.productType]));
    i++;
  }

  if (filters.initiativeType) {
    conditions.push(`initiative_type IN ('Both', $${i})`);
    params.push(filters.initiativeType);
    i++;
  }

  const result = await query<ArtifactDefinitionRow>(
    `SELECT ${COLUMNS}
       FROM artifact_definition
      WHERE ${conditions.join(' AND ')}
      ORDER BY phase ASC, name ASC`,
    params,
  );
  return result.rows.map(mapRow);
}

function buildWhereClause(
  filter: ArtifactDefinitionListFilters,
): { whereSql: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (filter.publicId) {
    conditions.push(`public_id = $${i}::uuid`);
    params.push(filter.publicId);
    i++;
  }
  if (filter.initiativeType) {
    conditions.push(`initiative_type = $${i}`);
    params.push(filter.initiativeType);
    i++;
  }
  if (filter.area) {
    conditions.push(`area = $${i}`);
    params.push(filter.area);
    i++;
  }
  if (filter.name && filter.name.trim() !== '') {
    conditions.push(`strpos(lower(name), lower($${i})) > 0`);
    params.push(filter.name.trim());
    i++;
  }
  if (filter.productType) {
    conditions.push(`product_type @> $${i}::jsonb`);
    params.push(JSON.stringify([filter.productType]));
    i++;
  }
  if (filter.status !== undefined) {
    conditions.push(`status = $${i}`);
    params.push(filter.status);
    i++;
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereSql, params };
}

const SORT_COLUMN: Record<ArtifactDefinitionSortField, string> = {
  phase: 'phase',
  name: 'name',
  updatedAt: 'updated_at',
  createdAt: 'created_at',
  id: 'id',
};

function orderBySql(
  sortBy: ArtifactDefinitionSortField,
  sortOrder: 'asc' | 'desc',
): string {
  const col = SORT_COLUMN[sortBy];
  const dir = sortOrder === 'desc' ? 'DESC' : 'ASC';
  return `ORDER BY ${col} ${dir}, phase ASC, name ASC`;
}

export async function countFiltered(filter: ArtifactDefinitionListFilters): Promise<number> {
  const { whereSql, params } = buildWhereClause(filter);
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM artifact_definition ${whereSql}`,
    params,
  );
  return parseInt(result.rows[0]?.count ?? '0', 10);
}

/**
 * Lista filtrada y ordenada. Si `limit` se omite, no se aplica `LIMIT` (todos los coincidencias).
 */
export async function findFiltered(
  filter: ArtifactDefinitionListFilters,
  sortBy: ArtifactDefinitionSortField,
  sortOrder: 'asc' | 'desc',
  limit?: number,
  offset = 0,
): Promise<ArtifactDefinition[]> {
  const { whereSql, params } = buildWhereClause(filter);
  const orderSql = orderBySql(sortBy, sortOrder);
  let sql = `SELECT ${COLUMNS}
       FROM artifact_definition
      ${whereSql}
      ${orderSql}`;
  const queryParams: unknown[] = [...params];
  if (limit !== undefined) {
    sql += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
  }
  const result = await query<ArtifactDefinitionRow>(sql, queryParams);
  return result.rows.map(mapRow);
}

export async function findByPublicId(publicId: string): Promise<ArtifactDefinition | null> {
  const result = await query<ArtifactDefinitionRow>(
    `SELECT ${COLUMNS}
       FROM artifact_definition
      WHERE public_id = $1
      LIMIT 1`,
    [publicId],
  );
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

const REF_PUBLIC_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Indica si ya existe una fila con el mismo `name` (coincidencia exacta tras trim).
 * `excludePublicId`: al actualizar, ignorar la fila con ese `public_id`.
 */
export async function existsByExactName(
  name: string,
  excludePublicId?: string,
): Promise<boolean> {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (excludePublicId) {
    const result = await query<{ ok: string }>(
      `SELECT 1 AS ok FROM artifact_definition
        WHERE name = $1 AND public_id <> $2::uuid
        LIMIT 1`,
      [trimmed, excludePublicId],
    );
    return result.rows.length > 0;
  }
  const result = await query<{ ok: string }>(
    `SELECT 1 AS ok FROM artifact_definition WHERE name = $1 LIMIT 1`,
    [trimmed],
  );
  return result.rows.length > 0;
}

/**
 * Resuelve un predecesor a su `public_id` (UUID).
 *
 * Acepta tanto un `public_id` (UUID) como el `name` exacto del artefacto y
 * devuelve siempre el `public_id` que se almacena en BD; o `null` si no existe.
 */
export async function findPublicIdByRef(ref: string): Promise<string | null> {
  const trimmed = ref.trim();
  if (!trimmed) return null;
  if (REF_PUBLIC_ID_REGEX.test(trimmed)) {
    const result = await query<{ public_id: string }>(
      `SELECT public_id FROM artifact_definition WHERE public_id = $1::uuid LIMIT 1`,
      [trimmed],
    );
    return result.rows[0]?.public_id ?? null;
  }
  const result = await query<{ public_id: string }>(
    `SELECT public_id FROM artifact_definition WHERE name = $1 LIMIT 1`,
    [trimmed],
  );
  return result.rows[0]?.public_id ?? null;
}

export async function insert(input: ArtifactDefinitionInsertPayload): Promise<ArtifactDefinition> {
  const result = await query<ArtifactDefinitionRow>(
    `INSERT INTO artifact_definition
       (public_id, phase, name, initiative_type, product_type,
        predecessor_public_ids, description, mandatory, area, status)
     VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5::jsonb,
             $6::jsonb, $7, $8, $9, $10)
     RETURNING ${COLUMNS}`,
    [
      input.publicId ?? null,
      input.phase,
      input.name,
      input.initiativeType,
      JSON.stringify(input.productType ?? []),
      JSON.stringify(input.predecessorPublicIds ?? []),
      input.description ?? null,
      input.mandatory ?? false,
      input.area ?? 'Producto',
      input.status ?? 1,
    ],
  );
  return mapRow(result.rows[0]);
}

export async function update(
  publicId: string,
  updates: ArtifactDefinitionUpdate,
): Promise<ArtifactDefinition | null> {
  const built = buildSetClauses(FIELD_MAP, updates);
  const { clauses, values } = built;
  let { nextIdx } = built;

  if (updates.productType !== undefined) {
    clauses.push(`product_type = $${nextIdx}::jsonb`);
    values.push(JSON.stringify(updates.productType));
    nextIdx++;
  }

  if (updates.predecessorPublicIds !== undefined) {
    clauses.push(`predecessor_public_ids = $${nextIdx}::jsonb`);
    values.push(JSON.stringify(updates.predecessorPublicIds));
    nextIdx++;
  }

  if (updates.status !== undefined) {
    const normalized: 0 | 1 =
      typeof updates.status === 'boolean' ? (updates.status ? 1 : 0) : updates.status;
    clauses.push(`status = $${nextIdx}`);
    values.push(normalized);
    nextIdx++;
  }

  if (clauses.length === 0) return null;

  values.push(publicId);
  const result = await query<ArtifactDefinitionRow>(
    `UPDATE artifact_definition
        SET ${clauses.join(', ')}
      WHERE public_id = $${nextIdx}
      RETURNING ${COLUMNS}`,
    values,
  );

  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

export interface RemoveResult {
  publicId: string;
  name: string;
  status: ArtifactStatus;
}

/**
 * Soft-delete del artefacto identificado por `publicId`.
 * No borra la fila ni modifica `predecessor_public_ids`: solo cambia `status` a 0.
 * Retorna metadata o `null` si el artefacto no existía.
 */
export async function remove(publicId: string): Promise<RemoveResult | null> {
  const result = await query<{ public_id: string; name: string; status: number }>(
    `UPDATE artifact_definition
        SET status = 0
      WHERE public_id = $1::uuid
      RETURNING public_id, name, status`,
    [publicId],
  );

  const row = result.rows[0];
  if (!row) return null;
  return {
    publicId: row.public_id,
    name: row.name,
    status: (row.status === 0 ? 0 : 1) as ArtifactStatus,
  };
}
