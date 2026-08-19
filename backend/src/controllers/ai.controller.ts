import { Request, Response, NextFunction } from 'express';
import { AiService } from '../services/ai.service.js';

export class AiController {
  static async askDoubt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId, question, history } = req.body;
      if (!subjectId || !question) {
        res.status(400).json({
          success: false,
          message: 'Subject ID and Question are required.',
        });
        return;
      }

      const result = await AiService.askCourseDoubt(subjectId, question, history || []);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async generateQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId, materialId, topic, count, difficulty } = req.body;
      if (!subjectId) {
        res.status(400).json({
          success: false,
          message: 'Subject ID is required.',
        });
        return;
      }

      const result = await AiService.generateQuizAndFlashcards(subjectId, {
        materialId,
        topic,
        count: count ? Number(count) : 5,
        difficulty,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async gradeSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assignmentId, submissionId } = req.body;
      if (!assignmentId || !submissionId) {
        res.status(400).json({
          success: false,
          message: 'Assignment ID and Submission ID are required.',
        });
        return;
      }

      const result = await AiService.gradeSubmissionWithRubric(assignmentId, submissionId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getFlashcards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId } = req.params;
      const { topic, refresh, seed } = req.query;
      if (!subjectId) {
        res.status(400).json({
          success: false,
          message: 'Subject ID is required.',
        });
        return;
      }

      const flashcards = await AiService.getSubjectFlashcards(subjectId, {
        topic: topic ? String(topic) : undefined,
        refresh: refresh === 'true' || Boolean(refresh),
        seed: seed ? Number(seed) : undefined,
      });
      res.status(200).json({
        success: true,
        data: flashcards,
      });
    } catch (err) {
      next(err);
    }
  }

  static async checkPlagiarism(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assignmentId } = req.body;
      if (!assignmentId) {
        res.status(400).json({
          success: false,
          message: 'Assignment ID is required.',
        });
        return;
      }

      const report = await AiService.detectPlagiarismAndDuplicates(assignmentId);
      res.status(200).json({
        success: true,
        message: `Plagiarism scan completed. Found ${report.duplicatesDetectedCount} duplicate/suspicious submissions.`,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPlagiarismReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assignmentId } = req.params;
      if (!assignmentId) {
        res.status(400).json({
          success: false,
          message: 'Assignment ID is required.',
        });
        return;
      }

      const report = await AiService.getPlagiarismReport(assignmentId);
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }
}
