import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { ClassMember } from '../models/ClassMember.js';

export class LeaderboardController {
  static async getGlobalLeaderboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const topStudents = await User.find({ role: 'STUDENT', isSuspended: false })
        .sort({ points: -1 })
        .limit(100)
        .select('name email avatar department studentId points streakDays');

      let currentRank = 1;
      const ranked = topStudents.map((student, index, array) => {
        if (index > 0 && student.points < array[index - 1].points) {
          currentRank = index + 1;
        }
        return {
          rank: currentRank,
          student,
        };
      });

      res.status(200).json({
        success: true,
        data: ranked,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getClassLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await ClassMember.find({
        classId: req.params.classId,
        role: 'STUDENT',
      }).populate('userId', 'name email avatar department studentId points streakDays isSuspended');

      const validStudents = members
        .map((m) => m.userId as any)
        .filter((u) => u && !u.isSuspended)
        .sort((a, b) => b.points - a.points);

      let currentRank = 1;
      const ranked = validStudents.map((student, index, array) => {
        if (index > 0 && student.points < array[index - 1].points) {
          currentRank = index + 1;
        }
        return {
          rank: currentRank,
          student,
        };
      });

      res.status(200).json({
        success: true,
        data: ranked,
      });
    } catch (err) {
      next(err);
    }
  }
}
