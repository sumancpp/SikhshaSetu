import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChallengeAttempt extends Document {
  challengeId: Types.ObjectId;
  studentId: Types.ObjectId;
  startedAt: Date;
  completedAt?: Date;
  score: number;
  maxScore: number;
  pointsAwarded: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeAttemptSchema = new Schema<IChallengeAttempt>(
  {
    challengeId: { type: Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    pointsAwarded: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'FAILED'],
      default: 'IN_PROGRESS',
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate rewards: student can only successfully complete a challenge once
ChallengeAttemptSchema.index({ challengeId: 1, studentId: 1 });

export const ChallengeAttempt = mongoose.model<IChallengeAttempt>('ChallengeAttempt', ChallengeAttemptSchema);
