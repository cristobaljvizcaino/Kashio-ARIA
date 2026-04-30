import express, { Router } from 'express';
import * as controller from '../controllers/artifactController';
import { asyncHandler } from '../utils/async';

const router = Router();

router.get('/files', asyncHandler(controller.listArtifactFiles));
router.post('/publish', asyncHandler(controller.publishArtifactMarkdown));
router.post(
  '/publish-pdf',
  express.raw({ type: 'application/pdf', limit: '50mb' }),
  asyncHandler(controller.publishArtifactPdf),
);

export default router;
