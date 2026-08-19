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
  plagiarismScore?: number;
  matchedSubmissionId?: Types.ObjectId;
  matchedStudentName?: string;
  isDuplicateFlag?: boolean;
  similarityDetails?: {
    matchedExcerpts?: string[];
    commonKeywords?: string[];
    confidence?: number;
    comparisonSummary?: string;
  };
  aiEvaluation?: {
    suggestedMarks?: number;
    maxMarks?: number;
    rubricBreakdown?: {
      criterion: string;
      score: number;
      maxScore: number;
      comments: string;
    }[];
    strengths?: string[];
    areasForImprovement?: string[];
    suggestedFeedback?: string;
    evaluatedAt?: Date;
  };
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
    plagiarismScore: { type: Number, default: 0, min: 0, max: 100 },
    matchedSubmissionId: { type: Schema.Types.ObjectId, ref: 'Submission' },
    matchedStudentName: { type: String, default: '' },
    isDuplicateFlag: { type: Boolean, default: false, index: true },
    similarityDetails: {
      matchedExcerpts: [{ type: String }],
      commonKeywords: [{ type: String }],
      confidence: { type: Number, default: 0 },
      comparisonSummary: { type: String, default: '' },
    },
    aiEvaluation: {
      suggestedMarks: { type: Number },
      maxMarks: { type: Number },
      rubricBreakdown: [
        {
          criterion: { type: String },
          score: { type: Number },
          maxScore: { type: Number },
          comments: { type: String },
        },
      ],
      strengths: [{ type: String }],
      areasForImprovement: [{ type: String }],
      suggestedFeedback: { type: String },
      evaluatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

// One submission per student per assignment (unique compound index)
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
