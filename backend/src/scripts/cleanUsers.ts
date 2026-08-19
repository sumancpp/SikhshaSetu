import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Class } from '../models/Class.js';
import { ClassMember } from '../models/ClassMember.js';
import { Subject } from '../models/Subject.js';
import { SubjectMember } from '../models/SubjectMember.js';
import { Material } from '../models/Material.js';
import { Assignment } from '../models/Assignment.js';
import { Submission } from '../models/Submission.js';
import { Quiz } from '../models/Quiz.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { Challenge } from '../models/Challenge.js';
import { ChallengeAttempt } from '../models/ChallengeAttempt.js';
import { Achievement } from '../models/Achievement.js';
import { UserAchievement } from '../models/UserAchievement.js';
import { PointTransaction } from '../models/PointTransaction.js';
import { ForumPost } from '../models/ForumPost.js';
import { ForumAnswer } from '../models/ForumAnswer.js';
import { Vote } from '../models/Vote.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { SYSTEM_ACHIEVEMENTS } from '../constants/achievements.js';

export const cleanAllUsersAndData = async () => {
  console.log('🔄 Connecting to MongoDB database...');
  await connectDB();

  console.log('🗑️ Removing all existing users, admins, faculties, students, and related operational data...');

  const results = await Promise.all([
    User.deleteMany({}),
    ClassMember.deleteMany({}),
    SubjectMember.deleteMany({}),
    Submission.deleteMany({}),
    QuizAttempt.deleteMany({}),
    ChallengeAttempt.deleteMany({}),
    UserAchievement.deleteMany({}),
    PointTransaction.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    Vote.deleteMany({}),
    ForumAnswer.deleteMany({}),
    ForumPost.deleteMany({}),
    Class.deleteMany({}),
    Subject.deleteMany({}),
    Material.deleteMany({}),
    Assignment.deleteMany({}),
    Quiz.deleteMany({}),
    Challenge.deleteMany({}),
  ]);

  console.log('✅ All existing users and user data have been completely deleted.');

  // Ensure system achievements/badges exist for new signups
  const achievementCount = await Achievement.countDocuments();
  if (achievementCount === 0) {
    await Achievement.insertMany(SYSTEM_ACHIEVEMENTS);
    console.log(`🏆 Initialized ${SYSTEM_ACHIEVEMENTS.length} system badges/achievements for new users.`);
  }

  const remainingUsers = await User.countDocuments();
  console.log(`📊 Current Users Count in Database: ${remainingUsers}`);

  await disconnectDB();
  console.log('🎉 Cleanup completed successfully.');
};

cleanAllUsersAndData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
  });
