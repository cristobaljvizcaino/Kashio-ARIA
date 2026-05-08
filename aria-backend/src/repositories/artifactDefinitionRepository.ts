import { getPool, query } from '../config/database';
import { getPhaseLabel } from '../const/phases';
import type {
  ArtifactDefinition,
  ArtifactDefinitionInsertPayload,
  ArtifactDefinitionListFilters,
  ArtifactDefinitionRow,
  ArtifactDefinitionSortField,
  ArtifactDefinitionUpdate,
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
  id, public_id, phase, name, initiative_type, predecessor_names,
  description, mandatory, area, created_at, updated_at
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
    predecessorNames: row.predecessor_names ?? [],
    description: row.description,
    mandatory: row.mandatory,
    area: row.area || 'Producto',
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function findAll(): Promise<ArtifactDefinition[]> {
  const result = await query<ArtifactDefinitionRow>(
    `SELECT ${COLUMNS}
       FROM artifact_definition
      ORDER BY phase ASC, name ASC`,
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
 * Resuelve un predecesor por `public_id` (UUID) o por coincidencia exacta de `name`.
 * Devuelve el `name` canónico en BD o `null` si no existe.
 */
export async function findNameByRef(ref: string): Promise<string | null> {
  const trimmed = ref.trim();
  if (!trimmed) return null;
  if (REF_PUBLIC_ID_REGEX.test(trimmed)) {
    const result = await query<{ name: string }>(
      `SELECT name FROM artifact_definition WHERE public_id = $1::uuid LIMIT 1`,
      [trimmed],
    );
    return result.rows[0]?.name ?? null;
  }
  const result = await query<{ name: string }>(
    `SELECT name FROM artifact_definition WHERE name = $1 LIMIT 1`,
    [trimmed],
  );
  return result.rows[0]?.name ?? null;
}

export async function insert(input: ArtifactDefinitionInsertPayload): Promise<ArtifactDefinition> {
  const result = await query<ArtifactDefinitionRow>(
    `INSERT INTO artifact_definition
       (public_id, phase, name, initiative_type, predecessor_names,
        description, mandatory, area)
     VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5::jsonb, $6, $7, $8)
     RETURNING ${COLUMNS}`,
    [
      input.publicId ?? null,
      input.phase,
      input.name,
      input.initiativeType ?? 'Both',
      JSON.stringify(input.predecessorNames ?? []),
      input.description ?? null,
      input.mandatory ?? false,
      input.area ?? 'Producto',
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

  if (updates.predecessorNames !== undefined) {
    clauses.push(`predecessor_names = $${nextIdx}::jsonb`);
    values.push(JSON.stringify(updates.predecessorNames));
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
  cascadedFromArtifacts: number;
}

/**
 * Borra el artefacto identificado por `publicId` y, en la **misma transacción**,
 * elimina su `name` de cualquier `predecessor_names` que lo referencie en otras filas.
 *
 * Operadores PostgreSQL utilizados:
 *   - `predecessor_names ? $1`         → filtra filas cuyo array contiene el string.
 *   - `predecessor_names - $1`         → devuelve el array sin ese string.
 *
 * Retorna metadata (incluye cuántas filas se actualizaron en cascada) o `null`
 * si el artefacto no existía.
 */
export async function remove(publicId: string): Promise<RemoveResult | null> {
  const pool = getPool();
  if (!pool) throw new Error('Database not configured');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const found = await client.query<{ name: string }>(
      'SELECT name FROM artifact_definition WHERE public_id = $1 FOR UPDATE',
      [publicId],
    );

    if (found.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const name = found.rows[0].name;

    await client.query('DELETE FROM artifact_definition WHERE public_id = $1', [publicId]);

    const cascade = await client.query(
      `UPDATE artifact_definition
          SET predecessor_names = predecessor_names - $1
        WHERE predecessor_names ? $1`,
      [name],
    );

    await client.query('COMMIT');

    return {
      publicId,
      name,
      cascadedFromArtifacts: cascade.rowCount ?? 0,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
