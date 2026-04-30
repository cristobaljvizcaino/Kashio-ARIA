import { Request, Response } from 'express';
import * as intakeService from '../services/intakeService';

export async function listIntakes(_req: Request, res: Response): Promise<void> {
  const data = await intakeService.listAll();
  res.json(data);
}
