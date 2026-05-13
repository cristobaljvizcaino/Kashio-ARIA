import { Router } from 'express';
import * as controller from '../controllers/initiativeController';
import { asyncHandler } from '../utils/async';

const router = Router();

router.get('/', asyncHandler(controller.listInitiatives));
// POST /sync — Body: { publicId: UUID, productType: "Offering"|"Sellable"|"Non_Sellable" }.
// El productType viaja en el body y se persiste en `initiative.product_type` para
// que `GET /:publicId` muestre solo los artefactos del catálogo aplicables al
// tipo de producto y al `initiative_type` de la iniciativa.
router.post('/sync', asyncHandler(controller.syncInitiative));
router.get('/:publicId', asyncHandler(controller.getInitiative));

// PUT /:publicId — Update parcial (hoy solo `status`).
// Útil para "restaurar" una iniciativa soft-deleted (PUT { "status": "IN_PROGRESS" })
// o para marcarla en cualquier estado local custom de ARIA.
// El handler `controller.updateInitiative` ya está implementado y testeado;
// para exponer el endpoint, descomentar la línea siguiente:
// router.put('/:publicId', asyncHandler(controller.updateInitiative));

router.delete('/:publicId', asyncHandler(controller.deleteInitiative));

export default router;
