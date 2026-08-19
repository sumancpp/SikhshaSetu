import { Router } from 'express';
import { AssignmentController } from '../controllers/assignment.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createAssignmentSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
} from '../validators/assignment.schema.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requireRole('ADMIN', 'FACULTY'),
  validateRequest(createAssignmentSchema),
  AssignmentController.createAssignment
);

router.get('/', AssignmentController.getAssignments);

router.post(
  '/:id/submit',
  requireRole('STUDENT', 'FACULTY', 'ADMIN'),
  upload.single('file'),
  validateRequest(submitAssignmentSchema),
  AssignmentController.submitAssignment
);

router.get(
  '/:id/submissions',
  requireRole('ADMIN', 'FACULTY'),
  AssignmentController.getSubmissions
);

router.patch(
  '/submissions/:id/grade',
  requireRole('ADMIN', 'FACULTY'),
  validateRequest(gradeSubmissionSchema),
  AssignmentController.gradeSubmission
);

export default router;
