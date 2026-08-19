import mongoose, { Document, Schema } from 'mongoose';

export interface IAchievement extends Document {
  code: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  category: 'CHALLENGE' | 'QUIZ' | 'FORUM' | 'STREAK' | 'GENERAL';
}

const AchievementSchema = new Schema<IAchievement>(
  {
    code: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: '🏆' },
    pointsRequired: { type: Number, default: 0 },
    category: {
      type: String,
      enum: ['CHALLENGE', 'QUIZ', 'FORUM', 'STREAK', 'GENERAL'],
      default: 'GENERAL',
    },
  },
  { timestamps: true }
);

export const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema);
