import mongoose, { Document, Schema, Types } from 'mongoose';
import { UserRole } from './User.js';

export interface IForumAnswer extends Document {
  postId: Types.ObjectId;
  classId: Types.ObjectId;
  subjectId?: Types.ObjectId;
  content: string;
  authorId: Types.ObjectId;
  authorRole: UserRole;
  upvotesCount: number;
  downvotesCount: number;
  isAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ForumAnswerSchema = new Schema<IForumAnswer>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'ForumPost', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorRole: { type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT'], required: true },
    upvotesCount: { type: Number, default: 0 },
    downvotesCount: { type: Number, default: 0 },
    isAccepted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ForumAnswerSchema.index({ postId: 1, isAccepted: -1, upvotesCount: -1 });

export const ForumAnswer = mongoose.model<IForumAnswer>('ForumAnswer', ForumAnswerSchema);
