import { Router } from 'express';
import { ForumController } from '../controllers/forum.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { forumLimiter } from '../middleware/rateLimiter.js';
import {
  createPostSchema,
  createAnswerSchema,
  voteSchema,
} from '../validators/forum.schema.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/posts',
  forumLimiter,
  validateRequest(createPostSchema),
  ForumController.createPost
);

router.get('/posts', ForumController.getPosts);
router.get('/posts/:id', ForumController.getPostById);
router.get('/tags', ForumController.getTrendingTags);

router.post(
  '/posts/:id/answers',
  forumLimiter,
  validateRequest(createAnswerSchema),
  ForumController.createAnswer
);

router.post(
  '/posts/:id/answers/:answerId/accept',
  ForumController.markAcceptedAnswer
);

router.post(
  '/vote/:id',
  validateRequest(voteSchema),
  ForumController.handleVote
);

export default router;
