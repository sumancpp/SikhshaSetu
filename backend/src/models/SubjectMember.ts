import mongoose, { Document, Schema, Types } from 'mongoose';
import { UserRole } from './User.js';

export interface ISubjectMember extends Document {
  subjectId: Types.ObjectId;
  classId: Types.ObjectId;
  userId: Types.ObjectId;
  role: UserRole;
  joinedAt: Date;
}

const SubjectMemberSchema = new Schema<ISubjectMember>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT'], required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound unique index: User can only belong to a subject once
SubjectMemberSchema.index({ subjectId: 1, userId: 1 }, { unique: true });
SubjectMemberSchema.index({ userId: 1, role: 1 });

export const SubjectMember = mongoose.model<ISubjectMember>('SubjectMember', SubjectMemberSchema);
