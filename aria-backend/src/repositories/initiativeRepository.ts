import { query } from '../config/database';
import type {
  Initiative,
  InitiativeRow,
  InitiativeUpsertPayload,
} from '../types/initiative';

const COLUMNS = `
  id, public_id, code, title, description, status, current_phase, initiative_type,
  product_name, quarter_name, quarter_year, estimated_start_date, estimated_end_date,
  intake_origin_code, phases, synced_at, created_at, updated_at
`;

function toIso(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString();
}

function toIsoOrNull(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toNumberId(id: number | string): number {
  return typeof id === 'number' ? id : Number(id);
}

function mapRow(row: InitiativeRow): Initiative {
  return {
    id: toNumberId(row.id),
    publicId: row.public_id,
    code: row.code,
    title: row.title,
    description: row.description,
    status: row.status,
    currentPhase: row.current_phase,
    initiativeType: row.initiative_type as Initiative['initiativeType'],
    productName: row.product_name,
    quarterName: row.quarter_name,
    quarterYear: row.quarter_year,
    estimatedStartDate: toIsoOrNull(row.estimated_start_date),
    estimatedEndDate: toIsoOrNull(row.estimated_end_date),
    intakeOriginCode: row.intake_origin_code,
    phases: row.phases ?? [],
    syncedAt: toIso(row.synced_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function findAll(): Promise<Initiative[]> {
  const result = await query<InitiativeRow>(
    `SELECT ${COLUMNS} FROM initiative ORDER BY synced_at DESC, id DESC`,
  );
  return result.rows.map(mapRow);
}

export async function findByPublicId(publicId: string): Promise<Initiative | null> {
  const result = await query<InitiativeRow>(
    `SELECT ${COLUMNS} FROM initiative WHERE public_id = $1 LIMIT 1`,
    [publicId],
  );
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

/**
 * Upsert por `public_id`. Crea la fila si no existe; si ya existe, actualiza todos los
 * campos provenientes del snapshot KashioOS y refresca `synced_at`.
 */
export async function upsertFromKashio(
  payload: InitiativeUpsertPayload,
): Promise<Initiative> {
  const result = await query<InitiativeRow>(
    `INSERT INTO initiative (
        public_id, code, title, description, status, current_phase, initiative_type,
        product_name, quarter_name, quarter_year, estimated_start_date, estimated_end_date,
        intake_origin_code, phases, synced_at
     )
     VALUES (
        $1::uuid, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14::jsonb, now()
     )
     ON CONFLICT (public_id) DO UPDATE SET
        code                  = EXCLUDED.code,
        title                 = EXCLUDED.title,
        description           = EXCLUDED.description,
        status                = EXCLUDED.status,
        current_phase         = EXCLUDED.current_phase,
        initiative_type       = EXCLUDED.initiative_type,
        product_name          = EXCLUDED.product_name,
        quarter_name          = EXCLUDED.quarter_name,
        quarter_year          = EXCLUDED.quarter_year,
        estimated_start_date  = EXCLUDED.estimated_start_date,
        estimated_end_date    = EXCLUDED.estimated_end_date,
        intake_origin_code    = EXCLUDED.intake_origin_code,
        phases                = EXCLUDED.phases,
        synced_at             = now()
     RETURNING ${COLUMNS}`,
    [
      payload.publicId,
      payload.code,
      payload.title,
      payload.description,
      payload.status,
      payload.currentPhase,
      payload.initiativeType,
      payload.productName,
      payload.quarterName,
      payload.quarterYear,
      payload.estimatedStartDate,
      payload.estimatedEndDate,
      payload.intakeOriginCode,
      JSON.stringify(payload.phases ?? []),
    ],
  );
  return mapRow(result.rows[0]);
}

/**
 * Hard delete (no usado por el controller actual: el `DELETE /:publicId` hace
 * soft-delete vía `updateByPublicId({ status: 'DELETED' })`).
 * Se mantiene para herramientas internas / scripts de purga manual.
 */
export async function removeByPublicId(publicId: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM initiative WHERE public_id = $1`,
    [publicId],
  );
  return (result.rowCount ?? 0) > 0;
}

/** Campos editables por `PUT /:publicId` (la fuente de verdad sigue siendo KashioOS). */
export interface InitiativeUpdatableFields {
  status?: string;
}

const UPDATE_FIELD_MAP: Record<keyof InitiativeUpdatableFields, string> = {
  status: 'status',
};

/**
 * Update parcial por `public_id`. Solo escribe las columnas mapeadas en
 * `UPDATE_FIELD_MAP`. Devuelve la fila actualizada o `null` si no existe.
 */
export async function updateByPublicId(
  publicId: string,
  updates: InitiativeUpdatableFields,
): Promise<Initiative | null> {
  const clauses: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [key, column] of Object.entries(UPDATE_FIELD_MAP)) {
    const value = updates[key as keyof InitiativeUpdatableFields];
    if (value === undefined) continue;
    clauses.push(`${column} = $${i}`);
    values.push(value);
    i++;
  }

  if (clauses.length === 0) return null;

  values.push(publicId);
  const result = await query<InitiativeRow>(
    `UPDATE initiative
        SET ${clauses.join(', ')}
      WHERE public_id = $${i}
      RETURNING ${COLUMNS}`,
    values,
  );

  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}
