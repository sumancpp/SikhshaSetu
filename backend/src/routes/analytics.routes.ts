import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Dashboard Overviews
router.get('/admin', requireAuth, requireRole('ADMIN'), AnalyticsController.getAdminOverview);
router.get('/faculty', requireAuth, requireRole('FACULTY', 'ADMIN'), AnalyticsController.getFacultyOverview);
router.get('/student', requireAuth, AnalyticsController.getStudentOverview);
router.get('/audit-logs', requireAuth, requireRole('ADMIN'), AnalyticsController.getAuditLogs);

// Student self-assessment health radar
router.get('/student/my-health', requireAuth, AnalyticsController.getStudentHealth);

// Faculty & Admin: Class At-Risk Analytics Radar & Student Breakdown
router.get(
  '/subject/:subjectId/at-risk',
  requireAuth,
  requireRole('FACULTY', 'ADMIN'),
  AnalyticsController.getSubjectAtRiskAnalytics
);

// Faculty & Admin: Send early-intervention counseling notification
router.post(
  '/subject/:subjectId/intervene',
  requireAuth,
  requireRole('FACULTY', 'ADMIN'),
  AnalyticsController.sendIntervention
);

export default router;
