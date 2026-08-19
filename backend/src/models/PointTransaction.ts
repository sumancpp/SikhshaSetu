import mongoose, { Document, Schema, Types } from 'mongoose';
import { PointSourceType } from '../constants/points.js';

export interface IPointTransaction extends Document {
  userId: Types.ObjectId;
  sourceType: PointSourceType;
  sourceId?: Types.ObjectId;
  points: number;
  reason: string;
  createdAt: Date;
}

const PointTransactionSchema = new Schema<IPointTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sourceType: {
      type: String,
      enum: [
        'ASSIGNMENT',
        'QUIZ',
        'CHALLENGE',
        'FORUM_POST',
        'FORUM_ANSWER',
        'FORUM_ACCEPTED',
        'FORUM_UPVOTE',
        'STREAK_BONUS',
        'ADMIN_GRANT',
      ],
      required: true,
      index: true,
    },
    sourceId: { type: Schema.Types.ObjectId },
    points: { type: Number, required: true },
    reason: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PointTransactionSchema.index({ userId: 1, createdAt: -1 });

export const PointTransaction = mongoose.model<IPointTransaction>(
  'PointTransaction',
  PointTransactionSchema
);
