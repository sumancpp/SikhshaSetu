import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(requireAuth);
router.get('/', requireRole('ADMIN'), UserController.getUsers);
router.patch('/:id/suspend', requireRole('ADMIN'), UserController.toggleSuspendUser);

export default router;
