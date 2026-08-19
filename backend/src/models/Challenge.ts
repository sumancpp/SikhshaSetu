import mongoose, { Document, Schema, Types } from 'mongoose';

export type ChallengeCategory = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type ChallengeDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface IChallengeTask {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  hint?: string;
}

export interface IChallenge extends Document {
  classId?: Types.ObjectId;
  subjectId?: Types.ObjectId;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  tasks: IChallengeTask[];
  rewardPoints: number;
  timeLimitMinutes: number;
  startDate: Date;
  endDate: Date;
  attemptLimit: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema = new Schema<IChallenge>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
      index: true,
    },
    tasks: [
      {
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctIndex: { type: Number, required: true },
        explanation: { type: String, default: '' },
        hint: { type: String, default: '' },
      },
    ],
    rewardPoints: { type: Number, required: true, default: 25 },
    timeLimitMinutes: { type: Number, default: 10 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    attemptLimit: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ChallengeSchema.index({ category: 1, isActive: 1, endDate: 1 });

export const Challenge = mongoose.model<IChallenge>('Challenge', ChallengeSchema);
