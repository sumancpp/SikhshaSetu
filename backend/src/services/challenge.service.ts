import { Types } from 'mongoose';
import { Challenge, IChallenge, ChallengeCategory } from '../models/Challenge.js';
import { ChallengeAttempt } from '../models/ChallengeAttempt.js';
import { PointsService } from './points.service.js';
import { emitGlobal, emitToUser } from '../config/socket.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';

export class ChallengeService {
  static async createChallenge(facultyId: string, data: any): Promise<IChallenge> {
    const challenge = await Challenge.create({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      createdBy: facultyId,
    });

    const populated = await Challenge.findById(challenge._id).populate(
      'createdBy',
      'name email avatar'
    );

    emitGlobal('challenge:started', populated);
    return populated || challenge;
  }

  static async getChallenges(
    studentId?: string,
    options: { category?: ChallengeCategory; classId?: string; subjectId?: string } = {}
  ): Promise<any[]> {
    const filter: any = { isActive: true };

    if (options.category) filter.category = options.category;
    if (options.classId) filter.$or = [{ classId: options.classId }, { classId: null }];
    if (options.subjectId) filter.subjectId = options.subjectId;

    const challenges = await Challenge.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email avatar');

    if (!studentId) {
      return challenges;
    }

    const attempts = await ChallengeAttempt.find({
      challengeId: { $in: challenges.map((c) => c._id) },
      studentId,
    });

    return challenges.map((c) => {
      const myAttempt = attempts.find((a) => a.challengeId.toString() === c._id.toString());
      return {
        ...c.toObject(),
        myAttempt: myAttempt || null,
        isCompleted: myAttempt?.status === 'COMPLETED',
      };
    });
  }

  static async getChallengeById(challengeId: string, isStudent: boolean = false): Promise<any> {
    const challenge = await Challenge.findById(challengeId).populate('createdBy', 'name email avatar');
    if (!challenge) throw new Error('Challenge not found.');

    if (isStudent) {
      // Hide correctIndex from client
      const sanitizedTasks = challenge.tasks.map((t) => ({
        question: t.question,
        options: t.options,
        hint: t.hint,
      }));
      return {
        ...challenge.toObject(),
        tasks: sanitizedTasks,
      };
    }

    return challenge;
  }

  static async submitChallenge(
    challengeId: string,
    studentId: string,
    answers: number[]
  ): Promise<{ score: number; maxScore: number; pointsAwarded: number; isPassed: boolean; explanations: string[] }> {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge || !challenge.isActive) {
      throw new Error('Challenge is inactive or not found.');
    }

    // Idempotency: Check if already completed and awarded
    const existingCompleted = await ChallengeAttempt.findOne({
      challengeId,
      studentId,
      status: 'COMPLETED',
    });

    if (existingCompleted) {
      throw new Error('You have already completed this challenge and earned its rewards.');
    }

    let score = 0;
    const totalQuestions = challenge.tasks.length;
    const explanations: string[] = [];

    challenge.tasks.forEach((task, idx) => {
      const selected = answers[idx];
      if (selected === task.correctIndex) {
        score += 1;
      }
      explanations.push(task.explanation || 'No explanation provided.');
    });

    const isPassed = score === totalQuestions; // Require all correct for full completion or >= 70%
    const pointsAwarded = isPassed ? challenge.rewardPoints : 0;

    await ChallengeAttempt.findOneAndUpdate(
      { challengeId, studentId },
      {
        $set: {
          completedAt: new Date(),
          score,
          maxScore: totalQuestions,
          pointsAwarded,
          status: isPassed ? 'COMPLETED' : 'FAILED',
        },
      },
      { upsert: true, new: true }
    );

    if (isPassed) {
      await PointsService.awardPoints(
        studentId,
        'CHALLENGE',
        pointsAwarded,
        `Solved ${challenge.category.toLowerCase()} challenge: "${challenge.title}"`,
        challenge._id
      );

      emitGlobal('challenge:completed', {
        challengeId: challenge._id,
        challengeTitle: challenge.title,
        studentId,
      });
    }

    return {
      score,
      maxScore: totalQuestions,
      pointsAwarded,
      isPassed,
      explanations,
    };
  }

  static async getChallengeLeaderboard(challengeId: string): Promise<any[]> {
    const completions = await ChallengeAttempt.find({ challengeId, status: 'COMPLETED' })
      .populate('studentId', 'name email avatar department studentId points')
      .sort({ completedAt: 1 })
      .limit(50);

    return completions.map((c, index) => ({
      rank: index + 1,
      student: c.studentId,
      completedAt: c.completedAt,
      pointsAwarded: c.pointsAwarded,
    }));
  }
}
