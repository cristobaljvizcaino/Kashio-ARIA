import * as initiativeRepository from '../repositories/initiativeRepository';
import { HttpError } from '../types/http';
import type { Initiative, InitiativeInput, InitiativeUpdate } from '../types/initiative';

export async function listAll(): Promise<Initiative[]> {
  return initiativeRepository.findAll();
}

export async function create(input: InitiativeInput): Promise<Initiative> {
  if (!input?.id || !input?.name) {
    throw new HttpError(400, 'id and name are required');
  }
  return initiativeRepository.insert(input);
}

export async function patch(id: string, updates: InitiativeUpdate): Promise<Initiative> {
  const updated = await initiativeRepository.update(id, updates);
  if (updated === null) {
    if (Object.keys(updates ?? {}).length === 0) {
      throw new HttpError(400, 'No fields to update');
    }
    throw new HttpError(404, 'Initiative not found');
  }
  return updated;
}

export async function destroy(id: string): Promise<void> {
  await initiativeRepository.remove(id);
}
