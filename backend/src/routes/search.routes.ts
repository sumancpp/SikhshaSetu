import { Router } from 'express';
import { SearchController } from '../controllers/search.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', SearchController.globalSearch);

export default router;
