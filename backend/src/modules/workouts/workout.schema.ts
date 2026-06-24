import { z } from 'zod';

export const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  notes: z.string().max(500).optional(),
});

export const updateWorkoutSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).optional(),
  endedAt: z.string().datetime().optional(),
});

export const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID'),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
