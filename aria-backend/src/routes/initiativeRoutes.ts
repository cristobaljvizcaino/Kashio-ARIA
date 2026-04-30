import { Router } from 'express';
import * as controller from '../controllers/initiativeController';
import { asyncHandler } from '../utils/async';

const router = Router();

router.get('/', asyncHandler(controller.listInitiatives));
router.post('/', asyncHandler(controller.createInitiative));
router.put('/:id', asyncHandler(controller.updateInitiative));
router.delete('/:id', asyncHandler(controller.deleteInitiative));

export default router;
