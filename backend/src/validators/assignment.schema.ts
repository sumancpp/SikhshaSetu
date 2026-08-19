import { z } from 'zod';

export const createAssignmentSchema = z.object({
  body: z.object({
    classId: z.string().optional(),
    subjectId: z.string().min(1, 'Subject ID is required'),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional().default(''),
    instructions: z.string().optional().default(''),
    dueDate: z.string().min(1, 'Due date is required'),
    maxMarks: z.coerce.number().min(1).default(100),
    rewardPoints: z.coerce.number().min(1).default(20),
    allowedFileTypes: z.array(z.string()).optional().default(['.pdf', '.doc', '.docx', '.zip']),
    maxFileSizeMb: z.coerce.number().min(1).max(100).default(25),
    allowLateSubmissions: z.boolean().optional().default(true),
  }),
});

export const submitAssignmentSchema = z.object({
  body: z.object({
    submissionText: z.string().optional().default(''),
  }),
});

export const gradeSubmissionSchema = z.object({
  body: z.object({
    marksObtained: z.number().min(0),
    feedback: z.string().optional().default(''),
  }),
});
