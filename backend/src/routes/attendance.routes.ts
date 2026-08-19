import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(requireAuth);

// Faculty: Start a 5-minute dynamic QR attendance session for a subject with GPS coordinates
router.post('/subject/:subjectId/session', requireRole('ADMIN', 'FACULTY'), AttendanceController.createSubjectSession);

// Faculty: Start a 5-minute dynamic QR attendance session for a class with GPS coordinates
router.post('/class/:classId/session', requireRole('ADMIN', 'FACULTY'), AttendanceController.createSession);

// Faculty: Get live rotating HMAC QR token (updates every 10s)
router.get('/session/:sessionId/live-token', requireRole('ADMIN', 'FACULTY'), AttendanceController.getLiveToken);

// Faculty / Admin: Get live roster of scanned attendees for a session
router.get('/session/:sessionId', requireRole('ADMIN', 'FACULTY'), AttendanceController.getSessionDetails);

// Faculty / Admin: Get subject attendance sessions history
router.get('/subject/:subjectId/history', AttendanceController.getSubjectHistory);

// Faculty / Admin: Get class attendance sessions history
router.get('/class/:classId/history', AttendanceController.getClassHistory);

// Student: Submit dynamic QR token along with active mobile GPS
router.post('/submit', AttendanceController.submitAttendance);

// Student: Get personal attendance logs
router.get('/student/my-history', AttendanceController.getStudentHistory);

export default router;
