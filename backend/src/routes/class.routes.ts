import { Router } from 'express';
import { ClassController } from '../controllers/class.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, requireClassMember } from '../middleware/rbac.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createClassSchema,
  updateClassSchema,
  joinClassSchema,
  inviteFacultySchema,
} from '../validators/class.schema.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('ADMIN'), validateRequest(createClassSchema), ClassController.createClass);
router.get('/', ClassController.getClasses);
router.post('/join', validateRequest(joinClassSchema), ClassController.joinClass);

router.get('/:id', requireClassMember, ClassController.getClassById);
router.patch('/:id', requireRole('ADMIN'), validateRequest(updateClassSchema), ClassController.updateClass);
router.post('/:id/regenerate-code', requireRole('ADMIN'), ClassController.regenerateCode);
router.post('/:id/invite-faculty', requireRole('ADMIN'), validateRequest(inviteFacultySchema), ClassController.inviteFaculty);
router.delete('/:id/members/:userId', requireRole('ADMIN'), ClassController.removeMember);

export default router;
