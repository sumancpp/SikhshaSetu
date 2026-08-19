import { Router } from 'express';
import { CodeExecutionController } from '../controllers/codeExecution.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Run raw code with stdin (Authenticated users)
router.post('/run', requireAuth, CodeExecutionController.runCode);

// Evaluate code against structured testcases
router.post('/eval-testcases', requireAuth, CodeExecutionController.evalTestCases);

export default router;
