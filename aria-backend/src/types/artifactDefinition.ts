export type ArtifactInitiativeType = 'Run' | 'Change' | 'Both';

export interface ArtifactDefinition {
  id: string;
  gate: string;
  name: string;
  initiativeType: ArtifactInitiativeType;
  predecessorIds: string[];
  description: string | null;
  mandatory: boolean;
  area: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactDefinitionInput extends Omit<ArtifactDefinition, 'createdAt' | 'updatedAt' | 'mandatory' | 'area' | 'initiativeType' | 'predecessorIds'> {
  initiativeType?: ArtifactInitiativeType;
  predecessorIds?: string[];
  mandatory?: boolean;
  area?: string;
}

export type ArtifactDefinitionUpdate = Partial<ArtifactDefinition>;

export interface ArtifactDefinitionRow {
  id: string;
  gate: string;
  name: string;
  initiative_type: ArtifactInitiativeType;
  predecessor_ids: string[] | null;
  description: string | null;
  mandatory: boolean;
  area: string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
}
