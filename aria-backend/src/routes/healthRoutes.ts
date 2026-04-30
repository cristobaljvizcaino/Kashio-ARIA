import { Router } from 'express';
import * as healthController from '../controllers/healthController';
import { asyncHandler } from '../utils/async';

const router = Router();

router.get('/', healthController.checkLiveness);
router.get('/db', asyncHandler(healthController.checkDatabase));

export default router;
