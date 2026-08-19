import { z } from 'zod';

export const createMaterialSchema = z.object({
  body: z.object({
    classId: z.string().min(1, 'Class ID is required'),
    subjectId: z.string().min(1, 'Subject ID is required'),
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().optional().default(''),
    type: z
      .enum(['NOTE', 'BOOK', 'MATERIAL', 'SLIDES', 'SYLLABUS', 'OTHER'])
      .default('MATERIAL'),
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
