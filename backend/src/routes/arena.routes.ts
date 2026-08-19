import { Router } from 'express';
import { ArenaController } from '../controllers/arena.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Start live 1v1 battle match
router.post('/start-match', requireAuth, ArenaController.startMatch);

// Submit round answer
router.post('/submit-round', requireAuth, ArenaController.submitRound);

// Get match status
router.get('/match-status/:matchId', requireAuth, ArenaController.getMatchStatus);

export default router;
