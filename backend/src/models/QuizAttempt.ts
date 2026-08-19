import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IQuizAnswerSubmission {
  questionIndex: number;
  selectedOptionIndices: number[];
  shortAnswerText?: string;
  isCorrect?: boolean;
  marksObtained?: number;
}

export interface IQuizAttempt extends Document {
  quizId: Types.ObjectId;
  subjectId: Types.ObjectId;
  classId: Types.ObjectId;
  studentId: Types.ObjectId;
  attemptNumber: number;
  startedAt: Date;
  submittedAt?: Date;
  score: number;
  maxScore: number;
  pointsAwarded: number;
  answers: IQuizAnswerSubmission[];
  status: 'IN_PROGRESS' | 'COMPLETED' | 'TIMED_OUT';
  createdAt: Date;
  updatedAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    attemptNumber: { type: Number, default: 1 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    pointsAwarded: { type: Number, default: 0 },
    answers: [
      {
        questionIndex: { type: Number, required: true },
        selectedOptionIndices: [{ type: Number }],
        shortAnswerText: { type: String, default: '' },
        isCorrect: { type: Boolean, default: false },
        marksObtained: { type: Number, default: 0 },
      },
    ],
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'TIMED_OUT'],
      default: 'IN_PROGRESS',
      index: true,
    },
  },
  { timestamps: true }
);

QuizAttemptSchema.index({ quizId: 1, studentId: 1 });

export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
