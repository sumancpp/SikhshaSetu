import mongoose, { Document, Schema, Types } from 'mongoose';

export type AttendanceVerificationStatus =
  | 'PRESENT'
  | 'OUT_OF_RANGE'
  | 'SUSPICIOUS_TOKEN_EXPIRED'
  | 'REJECTED';

export interface IAttendanceRecord extends Document {
  sessionId: Types.ObjectId;
  classId: Types.ObjectId;
  subjectId?: Types.ObjectId;
  studentId: Types.ObjectId;
  scannedAt: Date;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  distanceFromCenter: number;
  verificationStatus: AttendanceVerificationStatus;
  deviceFingerprint?: string;
  ipAddress?: string;
  pointsAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'AttendanceSession', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scannedAt: { type: Date, default: Date.now },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracyMeters: { type: Number, default: 0 },
    distanceFromCenter: { type: Number, required: true },
    verificationStatus: {
      type: String,
      enum: ['PRESENT', 'OUT_OF_RANGE', 'SUSPICIOUS_TOKEN_EXPIRED', 'REJECTED'],
      default: 'PRESENT',
      index: true,
    },
    deviceFingerprint: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    pointsAwarded: { type: Number, default: 5 },
  },
  { timestamps: true }
);

// One attendance record per student per session
AttendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
AttendanceRecordSchema.index({ classId: 1, studentId: 1, scannedAt: -1 });

export const AttendanceRecord = mongoose.model<IAttendanceRecord>(
  'AttendanceRecord',
  AttendanceRecordSchema
);
