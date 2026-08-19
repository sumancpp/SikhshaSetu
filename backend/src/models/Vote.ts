import mongoose, { Document, Schema, Types } from 'mongoose';

export type VoteTargetType = 'POST' | 'ANSWER';

export interface IVote extends Document {
  userId: Types.ObjectId;
  targetType: VoteTargetType;
  targetId: Types.ObjectId;
  voteValue: number; // 1 for upvote, -1 for downvote
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['POST', 'ANSWER'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    voteValue: { type: Number, enum: [1, -1], required: true },
  },
  { timestamps: true }
);

// Atomic uniqueness: One vote record per user per target!
VoteSchema.index({ userId: 1, targetId: 1 }, { unique: true });

export const Vote = mongoose.model<IVote>('Vote', VoteSchema);
