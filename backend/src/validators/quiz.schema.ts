import { z } from 'zod';

export const createQuizSchema = z.object({
  body: z.object({
    classId: z.string().optional(),
    subjectId: z.string().min(1, 'Subject ID is required'),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional().default(''),
    type: z.enum(['NATIVE_MCQ', 'GOOGLE_FORM']).default('NATIVE_MCQ'),
    googleFormUrl: z.string().optional().default(''),
    timeLimitMinutes: z.coerce.number().min(1).max(180).default(15),
    attemptLimit: z.coerce.number().min(1).default(1),
    rewardPoints: z.coerce.number().min(0).default(25),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    randomizeQuestions: z.boolean().optional().default(false),
    randomizeOptions: z.boolean().optional().default(false),
    questions: z
      .array(
        z.object({
          questionText: z.string().min(1, 'Question text required'),
          type: z.enum(['MCQ', 'MULTIPLE', 'TF', 'SHORT']).default('MCQ'),
          options: z.array(
            z.object({
              text: z.string().min(1, 'Option text required'),
              isCorrect: z.boolean().default(false),
            })
          ),
          explanation: z.string().optional().default(''),
          marks: z.coerce.number().min(1).default(1),
        })
      )
      .optional()
      .default([]),
  }),
});

export const submitQuizAttemptSchema = z.object({
  body: z.object({
    answers: z.array(
      z.object({
        questionIndex: z.number(),
        selectedOptionIndices: z.array(z.number()).optional(),
        selectedOptionIndex: z.number().optional(),
        shortAnswerText: z.string().optional().default(''),
      }).transform((val) => ({
        questionIndex: val.questionIndex,
        selectedOptionIndices:
          val.selectedOptionIndices !== undefined
            ? val.selectedOptionIndices
            : val.selectedOptionIndex !== undefined && val.selectedOptionIndex >= 0
            ? [val.selectedOptionIndex]
            : [],
        shortAnswerText: val.shortAnswerText || '',
      }))
    ),
  }),
});
