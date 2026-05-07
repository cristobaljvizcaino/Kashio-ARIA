import { Router } from 'express';
import * as controller from '../controllers/artifactDefinitionController';
import { asyncHandler } from '../utils/async';

const router = Router();

router.get('/', asyncHandler(controller.listArtifactDefinitions));
router.get('/:publicId', asyncHandler(controller.getArtifactDefinition));
router.post('/', asyncHandler(controller.createArtifactDefinition));
router.put('/:publicId', asyncHandler(controller.updateArtifactDefinition));
router.delete('/:publicId', asyncHandler(controller.deleteArtifactDefinition));

export default router;
