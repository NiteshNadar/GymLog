import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../lib/api/client.js';

export function useExercises(params?: { workout_id?: string; suggestions?: boolean }) {
  return useQuery({
    queryKey: ['exercises', params],
    queryFn: async () => {
      const { data } = await client.get('/exercises', { params });
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: params?.workout_id !== '', // Don't run if empty string
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exercise: { workout_id: string; name: string; weight: number; reps: number; sets: number }) => {
      const { data } = await client.post('/exercises', exercise);
      return data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exercises', { workout_id: variables.workout_id }] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] }); // Invalidate workouts to update nested exercises
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...exercise }: { id: string; name?: string; weight?: number; reps?: number; sets?: number }) => {
      const { data } = await client.patch(`/exercises/${id}`, exercise);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; workoutId: string }) => {
      const { data } = await client.delete(`/exercises/${id}`);
      return data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exercises', { workout_id: variables.workoutId }] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useDeleteExercisesByWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workoutId: string) => {
      const { data } = await client.delete(`/exercises/by-workout/${workoutId}`);
      return data.data;
    },
    onSuccess: (data, workoutId) => {
      queryClient.invalidateQueries({ queryKey: ['exercises', { workout_id: workoutId }] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
