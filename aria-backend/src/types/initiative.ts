export type InitiativeType = 'Run' | 'Change';

export interface Initiative {
  id: string;
  name: string;
  product: string | null;
  currentGateId: string;
  type: InitiativeType;
  startDate: string | null;
  endDate: string | null;
  quarter: string | null;
  status: string | null;
  intakeRequestId: string | null;
  pipelineActivated: boolean;
  artifacts: unknown[];
}

export interface InitiativeInput extends Omit<Initiative, 'pipelineActivated' | 'artifacts' | 'currentGateId'> {
  currentGateId?: string;
  pipelineActivated?: boolean;
  artifacts?: unknown[];
}

export type InitiativeUpdate = Partial<Initiative>;

export interface InitiativeRow {
  id: string;
  name: string;
  product: string | null;
  current_gate_id: string;
  type: InitiativeType;
  start_date: string | null;
  end_date: string | null;
  quarter: string | null;
  status: string | null;
  intake_request_id: string | null;
  pipeline_activated: boolean;
  artifacts: unknown[] | null;
  created_at?: string;
}
