import { Router } from 'express';
import { AiController } from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(requireAuth);

// AI Doubt Assistant (Accessible to all enrolled students and faculty)
router.post('/ask-doubt', AiController.askDoubt);

// 1-Click AI Quiz & Flashcard Generator (Faculty & Admin)
router.post('/generate-quiz', requireRole('ADMIN', 'FACULTY'), AiController.generateQuiz);

// AI Rubric & Assignment Feedback Assistant (Faculty & Admin)
router.post('/grade-submission', requireRole('ADMIN', 'FACULTY'), AiController.gradeSubmission);

// Subject Flashcards
router.get('/flashcards/:subjectId', AiController.getFlashcards);

export default router;
