import mongoose, { Document, Schema, Types } from 'mongoose';

export type AttendanceSessionStatus = 'ACTIVE' | 'EXPIRED' | 'CLOSED';

export interface IAttendanceSession extends Document {
  classId: Types.ObjectId;
  subjectId?: Types.ObjectId;
  facultyId: Types.ObjectId;
  title: string;
  sessionSecret: string;
  centerLatitude: number;
  centerLongitude: number;
  allowedRadiusMeters: number;
  startTime: Date;
  endTime: Date;
  status: AttendanceSessionStatus;
  attendanceCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', index: true },
    facultyId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, default: 'Class Attendance Session' },
    sessionSecret: { type: String, required: true },
    centerLatitude: { type: Number, required: true },
    centerLongitude: { type: Number, required: true },
    allowedRadiusMeters: { type: Number, default: 100 },
    startTime: { type: Date, default: Date.now, index: true },
    endTime: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CLOSED'],
      default: 'ACTIVE',
      index: true,
    },
    attendanceCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AttendanceSessionSchema.index({ classId: 1, status: 1, startTime: -1 });

export const AttendanceSession = mongoose.model<IAttendanceSession>(
  'AttendanceSession',
  AttendanceSessionSchema
);
