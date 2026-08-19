import { z } from 'zod';

export const createClassSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Class name must be at least 3 characters'),
    description: z.string().optional().default(''),
    academicYear: z.string().min(4, 'Academic year is required (e.g. 2025-2026)'),
    department: z.string().min(2, 'Department is required'),
    semester: z.number().int().min(1).max(12),
    section: z.string().optional().default(''),
    bannerImage: z.string().optional().default(''),
  }),
});

export const updateClassSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    academicYear: z.string().optional(),
    department: z.string().optional(),
    semester: z.number().int().min(1).max(12).optional(),
    section: z.string().optional(),
    bannerImage: z.string().optional(),
    isArchived: z.boolean().optional(),
  }),
});

export const joinClassSchema = z.object({
  body: z.object({
    code: z.string().min(4, 'Class join code is required'),
  }),
});

export const inviteFacultySchema = z.object({
  body: z.object({
    email: z.string().email('Valid faculty email required'),
  }),
});
