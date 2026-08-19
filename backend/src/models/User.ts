import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  department?: string;
  studentId?: string;
  googleId?: string;
  points: number;
  streakDays: number;
  lastActiveDate: Date;
  isSuspended: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT'], default: 'STUDENT', index: true },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    department: { type: String, default: '' },
    studentId: { type: String, default: '', trim: true },
    googleId: { type: String, sparse: true },
    points: { type: Number, default: 0, index: -1 },
    streakDays: { type: Number, default: 1 },
    lastActiveDate: { type: Date, default: Date.now },
    isSuspended: { type: Boolean, default: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ points: -1, name: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
