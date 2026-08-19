import { z } from 'zod';

export const createSubjectSchema = z.object({
  body: z.object({
    classId: z.string().min(1, 'Class ID is required'),
    name: z.string().min(2, 'Subject name must be at least 2 characters'),
    code: z.string().min(2, 'Subject code is required (e.g. CS301)'),
    description: z.string().optional().default(''),
    subjectImage: z.string().optional().default(''),
    semester: z.number().int().min(1).max(12),
    credits: z.number().optional().default(4),
  }),
});

export const updateSubjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().min(2).optional(),
    description: z.string().optional(),
    subjectImage: z.string().optional(),
    semester: z.number().int().min(1).max(12).optional(),
    credits: z.number().optional(),
    isArchived: z.boolean().optional(),
  }),
});

export const addCoFacultySchema = z.object({
  body: z.object({
    facultyId: z.string().min(1, 'Faculty ID is required'),
    permissions: z
      .object({
        manageMaterials: z.boolean().default(true),
        createAssignments: z.boolean().default(true),
        gradeAssignments: z.boolean().default(true),
        createChallenges: z.boolean().default(true),
        moderateForum: z.boolean().default(true),
      })
      .optional(),
  }),
});

export const enrollStudentSchema = z.object({
  body: z.object({
    studentId: z.string().optional(),
    email: z.string().email().optional(),
  }),
});
