import { Router } from 'express';
import { ClassCommentController } from '../controllers/classComment.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post('/:classId/comments', ClassCommentController.createComment);
router.get('/:classId/comments', ClassCommentController.getComments);
router.delete('/comments/:commentId', ClassCommentController.deleteComment);

export default router;
