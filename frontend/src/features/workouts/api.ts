import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../lib/api/client.js';

export function useWorkouts(params?: { ended?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ['workouts', params],
    queryFn: async () => {
      const { data } = await client.get('/workouts', { params });
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ['workouts', id],
    queryFn: async () => {
      const { data } = await client.get(`/workouts/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workout: { name: string; createdAt?: string; endedAt?: string | null }) => {
      const { data } = await client.post('/workouts', workout);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...workout }: { id: string; name?: string; endedAt?: string | null }) => {
      const { data } = await client.patch(`/workouts/${id}`, workout);
      return data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', variables.id] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await client.delete(`/workouts/${id}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useClearAllWorkouts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await client.delete('/workouts/clear-all');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}
