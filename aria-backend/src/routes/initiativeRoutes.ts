import { Router } from 'express';
import * as controller from '../controllers/initiativeController';
import { asyncHandler } from '../utils/async';

const router = Router();

router.get('/', asyncHandler(controller.listInitiatives));
router.post('/sync/:publicId', asyncHandler(controller.syncInitiative));
router.get('/:publicId', asyncHandler(controller.getInitiative));

// PUT /:publicId — Update parcial (hoy solo `status`).
// Útil para "restaurar" una iniciativa soft-deleted (PUT { "status": "IN_PROGRESS" })
// o para marcarla en cualquier estado local custom de ARIA.
// El handler `controller.updateInitiative` ya está implementado y testeado;
// para exponer el endpoint, descomentar la línea siguiente:
// router.put('/:publicId', asyncHandler(controller.updateInitiative));

router.delete('/:publicId', asyncHandler(controller.deleteInitiative));

export default router;
