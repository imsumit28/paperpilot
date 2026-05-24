import { Router } from 'express';
import multer from 'multer';
import {
  createHandler,
  deleteHandler,
  getHandler,
  listHandler,
  pdfHandler,
  regenerateHandler,
} from '../controllers/assignments.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();

// Accept either multipart (with optional file) OR plain JSON
router.post('/', upload.single('file'), createHandler);
router.get('/', listHandler);
router.get('/:id', getHandler);
router.delete('/:id', deleteHandler);
router.post('/:id/regenerate', regenerateHandler);
router.get('/:id/pdf', pdfHandler);

export default router;
