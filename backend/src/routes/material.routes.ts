import { Router } from 'express';
import { MaterialController } from '../controllers/material.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';
import { validateRequest } from '../middleware/validate.js';
import { createMaterialSchema } from '../validators/material.schema.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requireRole('ADMIN', 'FACULTY'),
  upload.single('file'),
  validateRequest(createMaterialSchema),
  MaterialController.uploadMaterial
);

router.get('/', MaterialController.getMaterials);
router.patch('/:id/view', MaterialController.incrementView);
router.delete('/:id', requireRole('ADMIN', 'FACULTY'), MaterialController.deleteMaterial);

export default router;
