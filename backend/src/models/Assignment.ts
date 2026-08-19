import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAssignment extends Document {
  classId: Types.ObjectId;
  subjectId: Types.ObjectId;
  title: string;
  description: string;
  instructions: string;
  dueDate: Date;
  maxMarks: number;
  rewardPoints: number;
  attachments: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }[];
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  allowLateSubmissions: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    instructions: { type: String, default: '' },
    dueDate: { type: Date, required: true, index: true },
    maxMarks: { type: Number, required: true, default: 100 },
    rewardPoints: { type: Number, required: true, default: 20 },
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileSize: { type: Number, required: true },
      },
    ],
    allowedFileTypes: [{ type: String, default: ['.pdf', '.doc', '.docx', '.zip'] }],
    maxFileSizeMb: { type: Number, default: 25 },
    allowLateSubmissions: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

AssignmentSchema.index({ subjectId: 1, dueDate: 1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
