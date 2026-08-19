import mongoose, { Document, Schema, Types } from 'mongoose';
import { UserRole } from './User.js';

export interface IInvitation extends Document {
  token: string;
  email: string;
  classId: Types.ObjectId;
  subjectId?: Types.ObjectId;
  role: UserRole;
  invitedBy: Types.ObjectId;
  expiresAt: Date;
  isAccepted: boolean;
  createdAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    token: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    role: { type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT'], required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    isAccepted: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Invitation = mongoose.model<IInvitation>('Invitation', InvitationSchema);
