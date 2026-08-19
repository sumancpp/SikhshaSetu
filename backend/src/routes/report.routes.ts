import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateRequest } from '../middleware/validate.js';
import { createReportSchema } from '../validators/forum.schema.js';

const router = Router();

router.use(requireAuth);
router.post('/', validateRequest(createReportSchema), ReportController.createReport);
router.get('/', requireRole('ADMIN', 'FACULTY'), ReportController.getReports);
router.patch('/:id/status', requireRole('ADMIN', 'FACULTY'), ReportController.updateReportStatus);

export default router;
