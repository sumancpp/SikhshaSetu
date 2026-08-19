import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateRequest } from '../middleware/validate.js';
import { createQuizSchema, submitQuizAttemptSchema } from '../validators/quiz.schema.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requireRole('ADMIN', 'FACULTY'),
  validateRequest(createQuizSchema),
  QuizController.createQuiz
);

router.get('/', QuizController.getQuizzes);
router.get('/:id', QuizController.getQuizById);

router.post(
  '/:id/attempt',
  requireRole('STUDENT', 'FACULTY', 'ADMIN'),
  validateRequest(submitQuizAttemptSchema),
  QuizController.submitQuizAttempt
);

router.get(
  '/:id/results',
  requireRole('ADMIN', 'FACULTY'),
  QuizController.getQuizResults
);

export default router;
