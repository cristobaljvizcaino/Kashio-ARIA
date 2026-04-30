import { Request, Response } from 'express';
import * as artifactDefinitionService from '../services/artifactDefinitionService';
import type {
  ArtifactDefinitionInput,
  ArtifactDefinitionUpdate,
} from '../types/artifactDefinition';

export async function listArtifactDefinitions(_req: Request, res: Response): Promise<void> {
  const data = await artifactDefinitionService.listAll();
  res.json(data);
}

export async function createArtifactDefinition(
  req: Request<unknown, unknown, ArtifactDefinitionInput>,
  res: Response,
): Promise<void> {
  const created = await artifactDefinitionService.create(req.body);
  res.json(created);
}

export async function updateArtifactDefinition(
  req: Request<{ id: string }, unknown, ArtifactDefinitionUpdate>,
  res: Response,
): Promise<void> {
  const updated = await artifactDefinitionService.patch(req.params.id, req.body);
  res.json(updated);
}

export async function deleteArtifactDefinition(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  await artifactDefinitionService.destroy(req.params.id);
  res.json({ success: true });
}
