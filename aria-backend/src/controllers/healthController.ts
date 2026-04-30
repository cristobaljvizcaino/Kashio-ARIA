import { Request, Response } from 'express';
import { testConnection } from '../config/database';

export function checkLiveness(_req: Request, res: Response): void {
  res.status(200).send('healthy');
}

export async function checkDatabase(_req: Request, res: Response): Promise<void> {
  const result = await testConnection();
  res.json(result);
}
