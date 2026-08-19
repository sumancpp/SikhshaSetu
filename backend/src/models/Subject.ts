import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFacultyPermission {
  facultyId: Types.ObjectId;
  manageMaterials: boolean;
  createAssignments: boolean;
  gradeAssignments: boolean;
  createChallenges: boolean;
  moderateForum: boolean;
}

export interface ISubject extends Document {
  classId: Types.ObjectId;
  name: string;
  code: string;
  description: string;
  subjectImage?: string;
  semester: number;
  credits?: number;
  primaryFacultyId: Types.ObjectId;
  coFaculties: Types.ObjectId[];
  facultyPermissions: IFacultyPermission[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    subjectImage: { type: String, default: '' },
    semester: { type: Number, required: true },
    credits: { type: Number, default: 4 },
    primaryFacultyId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coFaculties: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    facultyPermissions: [
      {
        facultyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        manageMaterials: { type: Boolean, default: true },
        createAssignments: { type: Boolean, default: true },
        gradeAssignments: { type: Boolean, default: true },
        createChallenges: { type: Boolean, default: true },
        moderateForum: { type: Boolean, default: true },
      },
    ],
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound index for class & code
SubjectSchema.index({ classId: 1, code: 1 }, { unique: true });

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema);
