import { Request, Response } from 'express';
import * as initiativeService from '../services/initiativeService';
import type { InitiativeInput, InitiativeUpdate } from '../types/initiative';

export async function listInitiatives(_req: Request, res: Response): Promise<void> {
  const data = await initiativeService.listAll();
  res.json(data);
}

export async function createInitiative(
  req: Request<unknown, unknown, InitiativeInput>,
  res: Response,
): Promise<void> {
  const created = await initiativeService.create(req.body);
  res.json(created);
}

export async function updateInitiative(
  req: Request<{ id: string }, unknown, InitiativeUpdate>,
  res: Response,
): Promise<void> {
  const updated = await initiativeService.patch(req.params.id, req.body);
  res.json(updated);
}

export async function deleteInitiative(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  await initiativeService.destroy(req.params.id);
  res.json({ success: true });
}
