import { Router } from 'express';
import { LeaderboardController } from '../controllers/leaderboard.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/global', LeaderboardController.getGlobalLeaderboard);
router.get('/class/:classId', LeaderboardController.getClassLeaderboard);

export default router;
