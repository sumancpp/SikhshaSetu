import mongoose, { Document, Schema, Types } from 'mongoose';

export type QuizType = 'NATIVE_MCQ' | 'GOOGLE_FORM';
export type QuestionType = 'MCQ' | 'MULTIPLE' | 'TF' | 'SHORT';

export interface IQuizQuestion {
  questionText: string;
  type: QuestionType;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
  marks: number;
}

export interface IQuiz extends Document {
  classId: Types.ObjectId;
  subjectId: Types.ObjectId;
  title: string;
  description: string;
  type: QuizType;
  googleFormUrl?: string;
  timeLimitMinutes: number;
  attemptLimit: number;
  rewardPoints: number;
  startDate?: Date;
  endDate?: Date;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  questions: IQuizQuestion[];
  totalMarks: number;
  isPublished: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  questionText: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'MULTIPLE', 'TF', 'SHORT'], default: 'MCQ' },
  options: [
    {
      text: { type: String, required: true },
      isCorrect: { type: Boolean, required: true },
    },
  ],
  explanation: { type: String, default: '' },
  marks: { type: Number, default: 1 },
});

const QuizSchema = new Schema<IQuiz>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['NATIVE_MCQ', 'GOOGLE_FORM'], default: 'NATIVE_MCQ' },
    googleFormUrl: { type: String, default: '' },
    timeLimitMinutes: { type: Number, default: 15 },
    attemptLimit: { type: Number, default: 1 },
    rewardPoints: { type: Number, default: 25 },
    startDate: { type: Date },
    endDate: { type: Date },
    randomizeQuestions: { type: Boolean, default: false },
    randomizeOptions: { type: Boolean, default: false },
    questions: [QuizQuestionSchema],
    totalMarks: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

QuizSchema.index({ subjectId: 1, isPublished: 1 });

export const Quiz = mongoose.model<IQuiz>('Quiz', QuizSchema);
