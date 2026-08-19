import { Request, Response, NextFunction } from 'express';
import { ChallengeService } from '../services/challenge.service.js';

export class ChallengeController {
  static async createChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const challenge = await ChallengeService.createChallenge(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Challenge created successfully.',
        data: challenge,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getChallenges(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, classId, subjectId } = req.query;
      const studentId = req.user!.role === 'STUDENT' ? req.user!.id : undefined;

      const challenges = await ChallengeService.getChallenges(studentId, {
        category: category as any,
        classId: classId as string,
        subjectId: subjectId as string,
      });

      res.status(200).json({
        success: true,
        data: challenges,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getChallengeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isStudent = req.user!.role === 'STUDENT';
      const challenge = await ChallengeService.getChallengeById(req.params.id, isStudent);
      res.status(200).json({
        success: true,
        data: challenge,
      });
    } catch (err) {
      next(err);
    }
  }

  static async submitChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ChallengeService.submitChallenge(
        req.params.id,
        req.user!.id,
        req.body.answers
      );

      res.status(200).json({
        success: true,
        message: result.isPassed
          ? `Challenge completed! You earned +${result.pointsAwarded} points! 🎉`
          : `Challenge submitted (${result.score}/${result.maxScore}). Review explanations to learn more.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getChallengeLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaderboard = await ChallengeService.getChallengeLeaderboard(req.params.id);
      res.status(200).json({
        success: true,
        data: leaderboard,
      });
    } catch (err) {
      next(err);
    }
  }
}
