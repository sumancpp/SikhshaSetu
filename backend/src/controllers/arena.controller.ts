import { Request, Response, NextFunction } from 'express';
import { ArenaService } from '../services/arena.service.js';

export class ArenaController {
  static async startMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || (req as any).user?._id;
      const { subjectId } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized. User ID missing.' });
        return;
      }

      const matchState = await ArenaService.startMatch(userId, subjectId);
      res.status(200).json({
        success: true,
        data: matchState,
      });
    } catch (err) {
      next(err);
    }
  }

  static async submitRound(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || (req as any).user?._id;
      const { matchId, questionId, selectedOptionIndex, timeTakenSeconds } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized. User ID missing.' });
        return;
      }

      if (!matchId || selectedOptionIndex === undefined) {
        res.status(400).json({
          success: false,
          message: 'matchId and selectedOptionIndex are required.',
        });
        return;
      }

      const result = await ArenaService.submitRoundAnswer(
        matchId,
        userId,
        questionId,
        Number(selectedOptionIndex),
        Number(timeTakenSeconds || 5)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMatchStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || (req as any).user?._id;
      const { matchId } = req.params;

      if (!userId || !matchId) {
        res.status(400).json({ success: false, message: 'matchId and auth token required.' });
        return;
      }

      const matchState = ArenaService.getMatchStatus(matchId, userId);
      if (!matchState) {
        res.status(404).json({ success: false, message: 'Match not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        data: matchState,
      });
    } catch (err) {
      next(err);
    }
  }
}
