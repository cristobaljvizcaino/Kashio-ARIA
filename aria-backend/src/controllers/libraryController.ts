import { Request, Response } from 'express';
import * as libraryService from '../services/libraryService';
import type { UploadUrlInput } from '../types/library';

export async function listLibraryFiles(_req: Request, res: Response): Promise<void> {
  const files = await libraryService.listFiles();
  res.json(files);
}

export async function getUploadUrl(
  req: Request<unknown, unknown, UploadUrlInput>,
  res: Response,
): Promise<void> {
  const result = await libraryService.createUploadUrl(req.body);
  res.json(result);
}

export async function getDownloadUrl(
  req: Request<{ fileId: string }>,
  res: Response,
): Promise<void> {
  const result = await libraryService.createDownloadUrl(req.params.fileId);
  res.json(result);
}

export async function deleteLibraryFile(
  req: Request<{ fileId: string }>,
  res: Response,
): Promise<void> {
  await libraryService.deleteFile(req.params.fileId);
  res.json({ success: true });
}
