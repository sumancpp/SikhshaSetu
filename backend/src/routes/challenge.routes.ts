import { Router } from 'express';
import { ChallengeController } from '../controllers/challenge.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createChallengeSchema,
  submitChallengeAttemptSchema,
} from '../validators/challenge.schema.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requireRole('ADMIN', 'FACULTY'),
  validateRequest(createChallengeSchema),
  ChallengeController.createChallenge
);

router.get('/', ChallengeController.getChallenges);
router.get('/:id', ChallengeController.getChallengeById);
router.get('/:id/leaderboard', ChallengeController.getChallengeLeaderboard);

router.post(
  '/:id/submit',
  requireRole('STUDENT'),
  validateRequest(submitChallengeAttemptSchema),
  ChallengeController.submitChallenge
);

export default router;
