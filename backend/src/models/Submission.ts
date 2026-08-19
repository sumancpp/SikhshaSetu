import mongoose, { Document, Schema, Types } from 'mongoose';

export type SubmissionStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RETURNED';

export interface ISubmission extends Document {
  assignmentId: Types.ObjectId;
  subjectId: Types.ObjectId;
  classId: Types.ObjectId;
  studentId: Types.ObjectId;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  submissionText?: string;
  submittedAt: Date;
  status: SubmissionStatus;
  marksObtained?: number;
  feedback?: string;
  gradedBy?: Types.ObjectId;
  gradedAt?: Date;
  pointsAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    submissionText: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['NOT_SUBMITTED', 'SUBMITTED', 'LATE', 'GRADED', 'RETURNED'],
      default: 'SUBMITTED',
      index: true,
    },
    marksObtained: { type: Number },
    feedback: { type: String, default: '' },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    gradedAt: { type: Date },
    pointsAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One submission per student per assignment (unique compound index)
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
