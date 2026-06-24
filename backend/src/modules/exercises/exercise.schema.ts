import { z } from 'zod';

export const createExerciseSchema = z.object({
  workout_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid workout ID'),
  name: z.string().min(1, 'Name is required').max(100),
  weight: z.number().min(0, 'Weight must be non-negative'),
  reps: z.number().int().min(0, 'Reps must be non-negative'),
  sets: z.number().int().min(1, 'Sets must be at least 1'),
});

export const bulkCreateExerciseSchema = z.array(createExerciseSchema).min(1).max(50);

export const updateExerciseSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  weight: z.number().min(0).optional(),
  reps: z.number().int().min(0).optional(),
  sets: z.number().int().min(1).optional(),
});

export const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID'),
});

export const exerciseQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  workout_id: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  suggestions: z.enum(['true', 'false']).optional(),
});

export const workoutIdParamsSchema = z.object({
  workoutId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID'),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
