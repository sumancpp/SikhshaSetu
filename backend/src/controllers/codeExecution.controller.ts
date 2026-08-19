import { Request, Response, NextFunction } from 'express';
import { CodeExecutionService } from '../services/codeExecution.service.js';

export class CodeExecutionController {
  static async runCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { language, code, stdin } = req.body;
      if (!language || !code) {
        res.status(400).json({
          success: false,
          message: 'Language and code are required for execution.',
        });
        return;
      }

      const result = await CodeExecutionService.executeCode(language, code, stdin || '');
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async evalTestCases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { language, code, testCases } = req.body;
      if (!language || !code) {
        res.status(400).json({
          success: false,
          message: 'Language and code are required.',
        });
        return;
      }

      const report = await CodeExecutionService.evaluateTestCases(
        language,
        code,
        Array.isArray(testCases) ? testCases : []
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }
}
