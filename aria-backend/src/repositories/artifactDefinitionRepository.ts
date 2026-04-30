import { query } from '../config/database';
import type {
  ArtifactDefinition,
  ArtifactDefinitionInput,
  ArtifactDefinitionRow,
  ArtifactDefinitionUpdate,
} from '../types/artifactDefinition';
import { buildSetClauses } from '../utils/sql';

const FIELD_MAP: Record<string, string> = {
  gate: 'gate',
  name: 'name',
  initiativeType: 'initiative_type',
  description: 'description',
  mandatory: 'mandatory',
  area: 'area',
};

function toIso(value: string | Date | null): string {
  if (!value) return '';
  const dateValue = value instanceof Date ? value : new Date(value);
  return dateValue.toISOString();
}

function mapRow(row: ArtifactDefinitionRow): ArtifactDefinition {
  return {
    id: row.id,
    gate: row.gate,
    name: row.name,
    initiativeType: row.initiative_type,
    predecessorIds: row.predecessor_ids ?? [],
    description: row.description,
    mandatory: row.mandatory,
    area: row.area || 'Producto',
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function findAll(): Promise<ArtifactDefinition[]> {
  const result = await query<ArtifactDefinitionRow>(
    'SELECT * FROM artifact_definition ORDER BY gate, name',
  );
  return result.rows.map(mapRow);
}

export async function insert(input: ArtifactDefinitionInput): Promise<ArtifactDefinition> {
  const result = await query<ArtifactDefinitionRow>(
    `INSERT INTO artifact_definition (id, gate, name, initiative_type, predecessor_ids, description, mandatory, area)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.id,
      input.gate,
      input.name,
      input.initiativeType ?? 'Both',
      JSON.stringify(input.predecessorIds ?? []),
      input.description,
      input.mandatory ?? false,
      input.area ?? 'Producto',
    ],
  );
  return mapRow(result.rows[0]);
}

export async function update(
  id: string,
  updates: ArtifactDefinitionUpdate,
): Promise<ArtifactDefinition | null> {
  const { clauses, values } = buildSetClauses(FIELD_MAP, updates);

  if (updates.predecessorIds !== undefined) {
    clauses.push(`predecessor_ids = $${values.length + 1}`);
    values.push(JSON.stringify(updates.predecessorIds));
  }

  if (clauses.length === 0) return null;

  values.push(id);
  const result = await query<ArtifactDefinitionRow>(
    `UPDATE artifact_definition SET ${clauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values,
  );

  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

export async function remove(id: string): Promise<void> {
  await query('DELETE FROM artifact_definition WHERE id = $1', [id]);
}
