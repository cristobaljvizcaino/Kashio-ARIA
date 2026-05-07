import { Request, Response } from 'express';
import * as artifactDefinitionService from '../services/artifactDefinitionService';
import type {
  ArtifactDefinitionInput,
  ArtifactDefinitionUpdate,
} from '../types/artifactDefinition';

export async function listArtifactDefinitions(req: Request, res: Response): Promise<void> {
  const data = await artifactDefinitionService.listFromQuery(
    req.query as Record<string, unknown>,
  );
  res.json(data);
}

export async function getArtifactDefinition(
  req: Request<{ publicId: string }>,
  res: Response,
): Promise<void> {
  const data = await artifactDefinitionService.getOne(req.params.publicId);
  res.json(data);
}

export async function createArtifactDefinition(
  req: Request<unknown, unknown, ArtifactDefinitionInput>,
  res: Response,
): Promise<void> {
  const created = await artifactDefinitionService.create(req.body);
  res.status(201).json(created);
}

export async function updateArtifactDefinition(
  req: Request<{ publicId: string }, unknown, ArtifactDefinitionUpdate>,
  res: Response,
): Promise<void> {
  const updated = await artifactDefinitionService.patch(req.params.publicId, req.body);
  res.json(updated);
}

export async function deleteArtifactDefinition(
  req: Request<{ publicId: string }>,
  res: Response,
): Promise<void> {
  const result = await artifactDefinitionService.destroy(req.params.publicId);
  res.json(result);
}
