import { Request, Response, NextFunction } from 'express';
import { QuizService } from '../services/quiz.service.js';

export class QuizController {
  static async createQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const quiz = await QuizService.createQuiz(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Quiz created successfully.',
        data: quiz,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getQuizzes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId } = req.query;
      if (!subjectId) {
        res.status(400).json({ success: false, message: 'Subject ID is required.' });
        return;
      }

      const studentId = req.user!.role === 'STUDENT' ? req.user!.id : undefined;
      const quizzes = await QuizService.getQuizzesForSubject(subjectId as string, studentId);

      res.status(200).json({
        success: true,
        data: quizzes,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getQuizById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isStudent = req.user!.role === 'STUDENT';
      const quiz = await QuizService.getQuizDetails(req.params.id, isStudent);
      res.status(200).json({
        success: true,
        data: quiz,
      });
    } catch (err) {
      next(err);
    }
  }

  static async submitQuizAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await QuizService.submitQuizAttempt(
        req.params.id,
        req.user!.id,
        req.body.answers
      );

      res.status(200).json({
        success: true,
        message: `Quiz completed! Score: ${result.score}/${result.maxScore} (+${result.pointsAwarded} pts)`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getQuizResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const results = await QuizService.getQuizResults(req.params.id);
      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (err) {
      next(err);
    }
  }
}
