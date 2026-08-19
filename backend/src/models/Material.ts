import mongoose, { Document, Schema, Types } from 'mongoose';

export type MaterialType = 'NOTE' | 'BOOK' | 'MATERIAL' | 'SLIDES' | 'SYLLABUS' | 'OTHER';

export interface IMaterial extends Document {
  classId: Types.ObjectId;
  subjectId: Types.ObjectId;
  title: string;
  description: string;
  type: MaterialType;
  fileUrl: string;
  fileName: string;
  fileSize: number; // bytes
  mimeType: string;
  uploadedBy: Types.ObjectId;
  tags: string[];
  viewCount: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['NOTE', 'BOOK', 'MATERIAL', 'SLIDES', 'SYLLABUS', 'OTHER'],
      default: 'MATERIAL',
      index: true,
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for fast searching and filtering
MaterialSchema.index({ subjectId: 1, type: 1, createdAt: -1 });
MaterialSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Material = mongoose.model<IMaterial>('Material', MaterialSchema);
