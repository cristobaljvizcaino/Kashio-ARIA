import { Router } from 'express';
import * as controller from '../controllers/libraryController';
import { asyncHandler } from '../utils/async';

const router = Router();

router.get('/files', asyncHandler(controller.listLibraryFiles));
router.post('/upload-url', asyncHandler(controller.getUploadUrl));
router.get('/download/:fileId', asyncHandler(controller.getDownloadUrl));
router.delete('/delete/:fileId', asyncHandler(controller.deleteLibraryFile));

export default router;
