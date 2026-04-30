import { Request, Response } from 'express';
import * as artifactService from '../services/artifactService';
import type { PublishArtifactInput, PublishPdfHeaders } from '../types/library';

export async function listArtifactFiles(_req: Request, res: Response): Promise<void> {
  const files = await artifactService.listOutputFilenames();
  res.json(files);
}

export async function publishArtifactMarkdown(
  req: Request<unknown, unknown, PublishArtifactInput>,
  res: Response,
): Promise<void> {
  const result = await artifactService.publishMarkdown(req.body);
  res.json(result);
}

export async function publishArtifactPdf(req: Request, res: Response): Promise<void> {
  const headers: PublishPdfHeaders = {
    initiativename: stringHeader(req, 'initiativename'),
    artifactname: stringHeader(req, 'artifactname'),
    gate: stringHeader(req, 'gate'),
    version: stringHeader(req, 'version'),
  };
  const result = await artifactService.publishPdf(headers, req.body as Buffer);
  res.json(result);
}

function stringHeader(req: Request, name: string): string | undefined {
  const value = req.headers[name];
  if (Array.isArray(value)) return value[0];
  return value;
}
