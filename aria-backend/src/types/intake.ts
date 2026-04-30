export interface IntakeRequest {
  id: string;
  title: string | null;
  requester: string | null;
  area: string | null;
  type: string | null;
  product: string | null;
  domain: string | null;
  region: string | null;
  impactType: string | null;
  severity: string | null;
  urgency: string | null;
  problem: string | null;
  outcome: string | null;
  scope: string[];
  constraints: string | null;
  alternatives: string | null;
  kpi: string | null;
  status: string | null;
  ariaAnalysis: string | null;
  createdAt: string;
}

export interface IntakeRequestRow {
  id: string;
  title: string | null;
  requester: string | null;
  area: string | null;
  type: string | null;
  product: string | null;
  domain: string | null;
  region: string | null;
  impact_type: string | null;
  severity: string | null;
  urgency: string | null;
  problem: string | null;
  outcome: string | null;
  scope: string[] | null;
  constraints: string | null;
  alternatives: string | null;
  kpi: string | null;
  status: string | null;
  aria_analysis: string | null;
  created_at: string | Date | null;
}
