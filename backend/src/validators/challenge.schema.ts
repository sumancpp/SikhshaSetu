import { z } from 'zod';

export const createChallengeSchema = z.object({
  body: z.object({
    classId: z.string().optional(),
    subjectId: z.string().optional(),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional().default(''),
    category: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    tasks: z.array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string().min(1)).min(2),
        correctIndex: z.number().int().min(0),
        explanation: z.string().optional().default(''),
        hint: z.string().optional().default(''),
      })
    ),
    rewardPoints: z.number().min(5).default(25),
    timeLimitMinutes: z.number().min(1).default(10),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
  }),
});

export const submitChallengeAttemptSchema = z.object({
  body: z.object({
    answers: z.array(z.number().int()), // Array of selected option indices
  }),
});
