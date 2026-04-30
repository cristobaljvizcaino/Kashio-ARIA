import * as repository from '../repositories/artifactDefinitionRepository';
import { HttpError } from '../types/http';
import type {
  ArtifactDefinition,
  ArtifactDefinitionInput,
  ArtifactDefinitionUpdate,
} from '../types/artifactDefinition';

export async function listAll(): Promise<ArtifactDefinition[]> {
  return repository.findAll();
}

export async function create(input: ArtifactDefinitionInput): Promise<ArtifactDefinition> {
  if (!input?.id || !input?.gate || !input?.name) {
    throw new HttpError(400, 'id, gate and name are required');
  }
  return repository.insert(input);
}

export async function patch(
  id: string,
  updates: ArtifactDefinitionUpdate,
): Promise<ArtifactDefinition> {
  const updated = await repository.update(id, updates);
  if (updated === null) {
    if (Object.keys(updates ?? {}).length === 0) {
      throw new HttpError(400, 'No fields to update');
    }
    throw new HttpError(404, 'Artifact definition not found');
  }
  return updated;
}

export async function destroy(id: string): Promise<void> {
  await repository.remove(id);
}
