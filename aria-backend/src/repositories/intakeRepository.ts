import { query } from '../config/database';
import type { IntakeRequest, IntakeRequestRow } from '../types/intake';

function mapRow(row: IntakeRequestRow): IntakeRequest {
  let createdAt = '';
  if (row.created_at) {
    const dateValue = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
    const iso = dateValue.toISOString();
    const datePart = iso.split('T')[0];
    createdAt = datePart ?? '';
  }

  return {
    id: row.id,
    title: row.title,
    requester: row.requester,
    area: row.area,
    type: row.type,
    product: row.product,
    domain: row.domain,
    region: row.region,
    impactType: row.impact_type,
    severity: row.severity,
    urgency: row.urgency,
    problem: row.problem,
    outcome: row.outcome,
    scope: row.scope ?? [],
    constraints: row.constraints,
    alternatives: row.alternatives,
    kpi: row.kpi,
    status: row.status,
    ariaAnalysis: row.aria_analysis,
    createdAt,
  };
}

export async function findAll(): Promise<IntakeRequest[]> {
  const result = await query<IntakeRequestRow>('SELECT * FROM intake_request ORDER BY created_at DESC');
  return result.rows.map(mapRow);
}
