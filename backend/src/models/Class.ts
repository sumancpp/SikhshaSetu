import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IClass extends Document {
  name: string;
  code: string;
  description: string;
  academicYear: string;
  department: string;
  semester: number;
  section?: string;
  bannerImage?: string;
  isArchived: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    academicYear: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    isArchived: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Class = mongoose.model<IClass>('Class', ClassSchema);
