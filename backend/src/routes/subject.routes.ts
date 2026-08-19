import { Router } from 'express';
import { SubjectController } from '../controllers/subject.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, requireSubjectMember, requireSubjectFaculty } from '../middleware/rbac.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createSubjectSchema,
  updateSubjectSchema,
  addCoFacultySchema,
  enrollStudentSchema,
} from '../validators/subject.schema.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requireRole('ADMIN', 'FACULTY'),
  validateRequest(createSubjectSchema),
  SubjectController.createSubject
);

router.get('/', SubjectController.getSubjects);
router.get('/:id', requireSubjectMember, SubjectController.getSubjectWorkspace);
router.patch(
  '/:id',
  requireSubjectFaculty,
  validateRequest(updateSubjectSchema),
  SubjectController.updateSubject
);

router.post(
  '/:id/co-faculty',
  requireSubjectFaculty,
  validateRequest(addCoFacultySchema),
  SubjectController.addCoFaculty
);

router.post(
  '/:id/enroll',
  requireSubjectFaculty,
  validateRequest(enrollStudentSchema),
  SubjectController.enrollStudent
);

router.get('/:id/leaderboard', requireSubjectMember, SubjectController.getLeaderboard);

export default router;
