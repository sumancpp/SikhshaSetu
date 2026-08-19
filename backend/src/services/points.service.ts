import mongoose, { Types } from 'mongoose';
import { PointTransaction } from '../models/PointTransaction.js';
import { User } from '../models/User.js';
import { Achievement } from '../models/Achievement.js';
import { UserAchievement } from '../models/UserAchievement.js';
import { PointSourceType } from '../constants/points.js';
import { emitToUser, emitGlobal } from '../config/socket.js';
import { Notification } from '../models/Notification.js';

export class PointsService {
  /**
   * Award points atomically to a user, record transaction, check achievements, and emit socket event.
   */
  static async awardPoints(
    userId: string | Types.ObjectId,
    sourceType: PointSourceType,
    points: number,
    reason: string,
    sourceId?: string | Types.ObjectId
  ): Promise<{ newPoints: number; achievementsUnlocked: string[] }> {
    if (points <= 0) {
      const user = await User.findById(userId);
      return { newPoints: user?.points || 0, achievementsUnlocked: [] };
    }

    // 1. Create Point Transaction Ledger Record
    await PointTransaction.create({
      userId,
      sourceType,
      sourceId: sourceId ? new Types.ObjectId(sourceId.toString()) : undefined,
      points,
      reason,
    });

    // 2. Update user's total points atomically
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { points: points }, $set: { lastActiveDate: new Date() } },
      { new: true }
    );

    const totalPoints = updatedUser?.points || 0;

    // 3. Emit real-time points event to user's private socket room
    emitToUser(userId.toString(), 'points:earned', {
      points,
      totalPoints,
      reason,
      sourceType,
    });

    // 4. Create Notification
    const notif = await Notification.create({
      recipientId: userId,
      type: 'POINTS_EARNED',
      title: `+${points} Points Earned!`,
      message: reason,
      referenceId: sourceId ? new Types.ObjectId(sourceId.toString()) : undefined,
    });

    emitToUser(userId.toString(), 'notification:new', notif);

    // 5. Broadcast global / room leaderboard update notification
    emitGlobal('leaderboard:updated', {
      userId: userId.toString(),
      totalPoints,
    });

    // 6. Check and award achievements
    const achievementsUnlocked = await this.checkAndAwardAchievements(userId, totalPoints, sourceType);

    return {
      newPoints: totalPoints,
      achievementsUnlocked,
    };
  }

  /**
   * Check system achievements and unlock eligible badges for user
   */
  static async checkAndAwardAchievements(
    userId: string | Types.ObjectId,
    totalPoints: number,
    sourceType?: PointSourceType
  ): Promise<string[]> {
    const unlockedTitles: string[] = [];

    // Find all achievements that user qualifies for
    const allAchievements = await Achievement.find();

    for (const achievement of allAchievements) {
      let isEligible = false;

      if (achievement.pointsRequired > 0 && totalPoints >= achievement.pointsRequired) {
        isEligible = true;
      }

      if (achievement.code === 'FIRST_CHALLENGE' && sourceType === 'CHALLENGE') {
        isEligible = true;
      }

      if (achievement.code === 'HELPFUL_PEER' && sourceType === 'FORUM_ACCEPTED') {
        isEligible = true;
      }

      if (isEligible) {
        try {
          const userAch = await UserAchievement.findOneAndUpdate(
            { userId, achievementId: achievement._id },
            { $setOnInsert: { userId, achievementId: achievement._id, unlockedAt: new Date() } },
            { upsert: true, new: false }
          );

          // If was not already unlocked before (newly inserted)
          if (!userAch) {
            unlockedTitles.push(achievement.title);

            const notif = await Notification.create({
              recipientId: userId,
              type: 'ACHIEVEMENT_UNLOCKED',
              title: `Badge Unlocked: ${achievement.title}!`,
              message: `${achievement.icon} ${achievement.description}`,
            });

            emitToUser(userId.toString(), 'notification:new', notif);
            emitToUser(userId.toString(), 'achievement:unlocked', {
              achievement,
            });
          }
        } catch (err) {
          // Ignore duplicate upsert errors
        }
      }
    }

    return unlockedTitles;
  }
}
