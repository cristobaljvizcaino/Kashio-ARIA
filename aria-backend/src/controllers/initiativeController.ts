import { Request, Response } from 'express';
import * as initiativeService from '../services/initiativeService';
import type {
  InitiativeSyncBody,
  InitiativeUpdateBody,
} from '../services/initiativeService';

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
 * POST /sync — Pide la iniciativa a KashioOS y la guarda/actualiza local.
 * Devuelve `201` si la creó, `200` si la actualizó.
 *
 * Body esperado:
 * ```json
 * {
 *   "publicId":   "ed5c9978-c12b-4ba0-b127-3faf89d0e9a8",
 *   "productType": "Sellable"
 * }
 * ```
 *
 * `productType` ∈ `Offering | Sellable | Non_Sellable` y se persiste en
 * `initiative.product_type` para que `GET /:publicId` filtre los artefactos
 * activos del catálogo aplicables a ese tipo de producto.
 */
export async function syncInitiative(
  req: Request<unknown, unknown, InitiativeSyncBody>,
  res: Response,
): Promise<void> {
  const publicIdRaw = (req.body && typeof req.body === 'object' && !Array.isArray(req.body))
    ? (req.body as InitiativeSyncBody).publicId
    : undefined;
  const publicIdStr = typeof publicIdRaw === 'string' ? publicIdRaw.trim() : '';

  const existed = publicIdStr
    ? await initiativeService.getOne(publicIdStr).catch((err) => {
        // 404 esperable cuando aún no existe localmente
        if (err && typeof err === 'object' && 'status' in err && err.status === 404) return null;
        throw err;
      })
    : null;

  const synced = await initiativeService.syncFromKashio(req.body);
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
 * distinto, o re-sincronizar con `POST /sync` (body con `publicId` y
 * `productType`).
 */
export async function deleteInitiative(
  req: Request<{ publicId: string }>,
  res: Response,
): Promise<void> {
  const updated = await initiativeService.destroy(req.params.publicId);
  res.json({ success: true, softDeleted: true, initiative: updated });
}
