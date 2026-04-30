import { Router } from 'express';
import * as controller from '../controllers/intakeController';
import { asyncHandler } from '../utils/async';

const router = Router();

router.get('/', asyncHandler(controller.listIntakes));

export default router;
