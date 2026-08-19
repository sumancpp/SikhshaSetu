import mongoose, { Document, Schema, Types } from 'mongoose';
import { UserRole } from './User.js';

export type CommentVisibility = 'ALL' | 'TEACHER_ONLY' | 'SELECTED';

export interface IClassComment extends Document {
  classId: Types.ObjectId;
  authorId: Types.ObjectId;
  authorRole: UserRole;
  content: string;
  visibility: CommentVisibility;
  targetUserIds: Types.ObjectId[];
  attachments: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }[];
  isResolved?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassCommentSchema = new Schema<IClassComment>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorRole: { type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT', 'PARENT'], required: true },
    content: { type: String, required: true, trim: true },
    visibility: {
      type: String,
      enum: ['ALL', 'TEACHER_ONLY', 'SELECTED'],
      default: 'ALL',
      index: true,
    },
    targetUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileSize: { type: Number, required: true },
      },
    ],
    isResolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ClassCommentSchema.index({ classId: 1, visibility: 1, createdAt: -1 });
ClassCommentSchema.index({ targetUserIds: 1 });

export const ClassComment = mongoose.model<IClassComment>('ClassComment', ClassCommentSchema);
