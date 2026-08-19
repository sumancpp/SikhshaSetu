import mongoose, { Document, Schema, Types } from 'mongoose';
import { UserRole } from './User.js';

export interface IClassMember extends Document {
  classId: Types.ObjectId;
  userId: Types.ObjectId;
  role: UserRole;
  joinedAt: Date;
}

const ClassMemberSchema = new Schema<IClassMember>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT'], required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound unique index: A user can only be in a class once
ClassMemberSchema.index({ classId: 1, userId: 1 }, { unique: true });
ClassMemberSchema.index({ userId: 1, role: 1 });

export const ClassMember = mongoose.model<IClassMember>('ClassMember', ClassMemberSchema);
