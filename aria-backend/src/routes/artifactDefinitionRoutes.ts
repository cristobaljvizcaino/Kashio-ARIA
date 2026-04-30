import { Router } from 'express';
import * as controller from '../controllers/artifactDefinitionController';
import { asyncHandler } from '../utils/async';

const router = Router();

router.get('/', asyncHandler(controller.listArtifactDefinitions));
router.post('/', asyncHandler(controller.createArtifactDefinition));
router.put('/:id', asyncHandler(controller.updateArtifactDefinition));
router.delete('/:id', asyncHandler(controller.deleteArtifactDefinition));

export default router;
