import mongoose, { Document, Schema, Types } from 'mongoose';
import { UserRole } from './User.js';

export type ForumAudience = 'ALL' | 'DEPARTMENT_ONLY' | 'FACULTY_AND_PARENTS' | 'FACULTY_ONLY';

export interface IForumPost extends Document {
  classId?: Types.ObjectId;
  subjectId?: Types.ObjectId; // If null, class-wide or general discussion
  title: string;
  description: string;
  tags: string[];
  attachments: string[];
  authorId: Types.ObjectId;
  authorRole: UserRole;
  audience: ForumAudience;
  targetDepartment?: string;
  allowedRoles?: string[];
  upvotesCount: number;
  downvotesCount: number;
  answersCount: number;
  hasAcceptedAnswer: boolean;
  isLocked: boolean;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ForumPostSchema = new Schema<IForumPost>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: false, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    tags: [{ type: String, lowercase: true, trim: true }],
    attachments: [{ type: String }],
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorRole: { type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT', 'PARENT'], required: true },
    audience: {
      type: String,
      enum: ['ALL', 'DEPARTMENT_ONLY', 'FACULTY_AND_PARENTS', 'FACULTY_ONLY'],
      default: 'ALL',
      index: true,
    },
    targetDepartment: { type: String, default: '', index: true },
    allowedRoles: [{ type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT', 'PARENT'] }],
    upvotesCount: { type: Number, default: 0 },
    downvotesCount: { type: Number, default: 0 },
    answersCount: { type: Number, default: 0 },
    hasAcceptedAnswer: { type: Boolean, default: false, index: true },
    isLocked: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ForumPostSchema.index({ classId: 1, subjectId: 1, createdAt: -1 });
ForumPostSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const ForumPost = mongoose.model<IForumPost>('ForumPost', ForumPostSchema);
