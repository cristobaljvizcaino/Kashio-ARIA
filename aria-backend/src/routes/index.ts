import { Router } from 'express';

import artifactRoutes from './artifactRoutes';
import artifactDefinitionRoutes from './artifactDefinitionRoutes';
import healthRoutes from './healthRoutes';
import initiativeRoutes from './initiativeRoutes';
import intakeRoutes from './intakeRoutes';
import libraryRoutes from './libraryRoutes';

/**
 * Router único de la API. Cada subrouter agrupa por entidad o tabla:
 *
 *   /health                   liveness + DB
 *   /initiatives              tabla initiative
 *   /intakes                  tabla intake_request (solo lectura)
 *   /artifact-definitions     tabla artifact_definition
 *   /library/*                bucket GCS (Contexto/Prompt/Template)
 *   /artifacts/*              bucket GCS (Output/)
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/initiatives', initiativeRoutes);
router.use('/intakes', intakeRoutes);
router.use('/artifact-definitions', artifactDefinitionRoutes);
router.use('/library', libraryRoutes);
router.use('/artifacts', artifactRoutes);

export default router;
