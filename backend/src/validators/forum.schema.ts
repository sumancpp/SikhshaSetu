import { z } from 'zod';

export const createPostSchema = z.object({
  body: z.object({
    classId: z.string().optional(),
    subjectId: z.string().optional(),
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().min(3, 'Description must be at least 3 characters'),
    tags: z
      .union([z.array(z.string()), z.string()])
      .optional()
      .transform((val) => {
        if (typeof val === 'string') {
          return val
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
        }
        return val || [];
      }),
  }),
});

export const createAnswerSchema = z.object({
  body: z.object({
    content: z.string().min(3, 'Answer content must be at least 3 characters'),
  }),
});

export const voteSchema = z.object({
  body: z.object({
    targetType: z.enum(['POST', 'ANSWER']),
    voteValue: z.union([z.literal(1), z.literal(-1), z.literal(0)]), // 1 upvote, -1 downvote, 0 remove vote
  }),
});

export const createReportSchema = z.object({
  body: z.object({
    targetType: z.enum(['POST', 'ANSWER', 'USER', 'MATERIAL']),
    targetId: z.string().min(1, 'Target ID is required'),
    reason: z.string().min(3, 'Reason is required'),
    description: z.string().optional().default(''),
  }),
});
