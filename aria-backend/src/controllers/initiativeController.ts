import { Request, Response } from 'express';
import * as initiativeService from '../services/initiativeService';
import type { InitiativeUpdateBody } from '../services/initiativeService';

/** GET / — Listado liviano de iniciativas locales (sin el array `phases`). */
export async function listInitiatives(_req: Request, res: Response): Promise<void> {
  const data = await initiativeService.listSummary();
  res.json(data);
}

/**
 * GET /:publicId — Detalle de la iniciativa enriquecido con las 8 fases y los
 * `artifact_definition` asociados a cada fase del catálogo ARIA.
 */
export async function getInitiative(
  req: Request<{ publicId: string }>,
  res: Response,
): Promise<void> {
  const data = await initiativeService.getDetail(req.params.publicId);
  res.json(data);
}

/**
 * POST /sync/:publicId — Pide la iniciativa a KashioOS y la guarda/actualiza local.
 * Devuelve `201` si la creó, `200` si la actualizó.
 */
export async function syncInitiative(
  req: Request<{ publicId: string }>,
  res: Response,
): Promise<void> {
  const existed = await initiativeService.getOne(req.params.publicId).catch((err) => {
    // 404 esperable cuando aún no existe localmente
    if (err && typeof err === 'object' && 'status' in err && err.status === 404) return null;
    throw err;
  });
  const synced = await initiativeService.syncFromKashio(req.params.publicId);
  res.status(existed ? 200 : 201).json(synced);
}

/**
 * PUT /:publicId — Update parcial. Hoy solo `status` (útil para restaurar una
 * iniciativa soft-deleted o marcar un estado local custom).
 *
 * Handler **funcional**: la ruta está comentada en `routes/initiativeRoutes.ts`
 * para que no quede expuesto hasta que se decida habilitarlo. Para activarlo
 * basta con descomentar la línea de la ruta correspondiente.
 */
export async function updateInitiative(
  req: Request<{ publicId: string }, unknown, InitiativeUpdateBody>,
  res: Response,
): Promise<void> {
  const updated = await initiativeService.update(req.params.publicId, req.body);
  res.json(updated);
}

/**
 * DELETE /:publicId — **Soft-delete**: no elimina la fila; solo cambia
 * `status` a `DELETED`. Para restaurar: `PUT /:publicId` con un `status`
 * distinto, o re-sincronizar con `POST /sync/:publicId`.
 */
export async function deleteInitiative(
  req: Request<{ publicId: string }>,
  res: Response,
): Promise<void> {
  const updated = await initiativeService.destroy(req.params.publicId);
  res.json({ success: true, softDeleted: true, initiative: updated });
}
