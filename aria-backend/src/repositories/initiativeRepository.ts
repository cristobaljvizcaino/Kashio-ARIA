import { query } from '../config/database';
import type { Initiative, InitiativeInput, InitiativeRow, InitiativeUpdate } from '../types/initiative';
import { buildSetClauses } from '../utils/sql';

const FIELD_MAP: Record<string, string> = {
  name: 'name',
  product: 'product',
  currentGateId: 'current_gate_id',
  type: 'type',
  startDate: 'start_date',
  endDate: 'end_date',
  quarter: 'quarter',
  status: 'status',
  intakeRequestId: 'intake_request_id',
  pipelineActivated: 'pipeline_activated',
};

function mapRow(row: InitiativeRow): Initiative {
  return {
    id: row.id,
    name: row.name,
    product: row.product,
    currentGateId: row.current_gate_id,
    type: row.type,
    startDate: row.start_date,
    endDate: row.end_date,
    quarter: row.quarter,
    status: row.status,
    intakeRequestId: row.intake_request_id,
    pipelineActivated: row.pipeline_activated,
    artifacts: row.artifacts ?? [],
  };
}

export async function findAll(): Promise<Initiative[]> {
  const result = await query<InitiativeRow>('SELECT * FROM initiative ORDER BY created_at DESC');
  return result.rows.map(mapRow);
}

export async function insert(input: InitiativeInput): Promise<Initiative> {
  const result = await query<InitiativeRow>(
    `INSERT INTO initiative (id, name, product, current_gate_id, type, start_date, end_date, quarter, status, intake_request_id, pipeline_activated, artifacts)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      input.id,
      input.name,
      input.product,
      input.currentGateId ?? 'G0',
      input.type,
      input.startDate,
      input.endDate,
      input.quarter,
      input.status,
      input.intakeRequestId,
      input.pipelineActivated ?? false,
      JSON.stringify(input.artifacts ?? []),
    ],
  );
  return mapRow(result.rows[0]);
}

export async function update(id: string, updates: InitiativeUpdate): Promise<Initiative | null> {
  const { clauses, values } = buildSetClauses(FIELD_MAP, updates);

  if (updates.artifacts !== undefined) {
    clauses.push(`artifacts = $${values.length + 1}`);
    values.push(JSON.stringify(updates.artifacts));
  }

  if (clauses.length === 0) return null;

  values.push(id);
  const result = await query<InitiativeRow>(
    `UPDATE initiative SET ${clauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values,
  );

  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

export async function remove(id: string): Promise<void> {
  await query('DELETE FROM initiative WHERE id = $1', [id]);
}
